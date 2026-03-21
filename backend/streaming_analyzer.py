"""
Real-time streaming analyzer for pronunciation checking
"""
import base64
import difflib
import re
from typing import Dict, Any, Optional
from riva_client import RivaClient

class StreamingAnalyzer:
    """Analyzes audio in real-time and detects pronunciation mistakes"""

    def __init__(self, riva_client: RivaClient):
        self.riva_client = riva_client
        self.expected_text = ""
        self.expected_text_normalized = ""  # Store normalized version
        self.current_transcription = ""
        self.mistakes_detected = []
        self.last_checked_position = 0
        # Word-level tracking for live highlighting
        self.expected_words = []           # Original words (with diacritics)
        self.expected_words_normalized = [] # Normalized words (no diacritics)
        self.word_statuses = []            # 'pending', 'correct', 'incorrect', 'current'

    def set_expected_text(self, expected_text: str):
        """Set the expected verse text"""
        # Clean and normalize expected text
        self.expected_text = expected_text.strip().replace('\n', ' ').replace('\r', ' ')
        # Normalize for comparison (remove extra whitespace)
        self.expected_text_normalized = ' '.join(self.expected_text.split())
        self.current_transcription = ""
        self.mistakes_detected = []
        self.last_checked_position = 0
        # Build word lists for word-level tracking
        self.expected_words = self.expected_text_normalized.split()
        self.expected_words_normalized = [
            self.riva_client._normalize_arabic(w) for w in self.expected_words
        ]
        self.word_statuses = ['pending'] * len(self.expected_words)
    
    def analyze_chunk(self, audio_chunk_base64: str) -> Dict[str, Any]:
        """
        Analyze an audio chunk in real-time
        
        Returns:
            Dict with 'has_mistake', 'mistake_details', 'current_transcription', 'progress'
        """
        try:
            # Transcribe the chunk
            chunk_transcription = self.riva_client.transcribe_audio(audio_chunk_base64)
            
            if not chunk_transcription or len(chunk_transcription.strip()) == 0:
                return {
                    'has_mistake': False,
                    'current_transcription': self.current_transcription,
                    'progress': self._calculate_progress(),
                    'chunk_transcription': '',
                    'word_statuses': self.word_statuses,
                }

            # Clean and normalize chunk transcription
            chunk_clean = chunk_transcription.strip()
            if not chunk_clean:
                return {
                    'has_mistake': False,
                    'current_transcription': self.current_transcription,
                    'progress': self._calculate_progress(),
                    'chunk_transcription': '',
                    'word_statuses': self.word_statuses,
                }
            
            # Append to current transcription (with space separator)
            if self.current_transcription:
                self.current_transcription += " " + chunk_clean
            else:
                self.current_transcription = chunk_clean
            
            # Normalize current transcription (remove extra whitespace)
            self.current_transcription = ' '.join(self.current_transcription.split())
            
            # Check for mistakes in real-time
            mistake = self._check_for_mistake()

            # Update word-level statuses for live highlighting
            self._update_word_statuses()

            result = {
                'has_mistake': mistake is not None,
                'mistake_details': mistake,
                'current_transcription': self.current_transcription,
                'progress': self._calculate_progress(),
                'chunk_transcription': chunk_transcription,
                'word_statuses': self.word_statuses,
            }
            
            # Log for debugging
            if mistake:
                print(f"Mistake detected: {mistake}")
            
            return result
        except Exception as e:
            print(f"Error analyzing chunk: {e}")
            import traceback
            traceback.print_exc()
            return {
                'has_mistake': False,
                'current_transcription': self.current_transcription,
                'progress': self._calculate_progress(),
                'word_statuses': self.word_statuses,
                'error': str(e)
            }
    
    def _update_word_statuses(self):
        """Update per-word statuses based on current transcription"""
        if not self.expected_words_normalized or not self.current_transcription:
            return

        transcribed_norm = self.riva_client._normalize_arabic(self.current_transcription)
        transcribed_words = transcribed_norm.split()
        num_transcribed = len(transcribed_words)
        num_expected = len(self.expected_words_normalized)

        # Use SequenceMatcher on word lists for alignment
        matcher = difflib.SequenceMatcher(
            None, self.expected_words_normalized, transcribed_words
        )

        # Reset all to pending first
        self.word_statuses = ['pending'] * num_expected

        for tag, i1, i2, j1, j2 in matcher.get_opcodes():
            if tag == 'equal':
                for idx in range(i1, i2):
                    self.word_statuses[idx] = 'correct'
            elif tag == 'replace':
                for idx in range(i1, i2):
                    self.word_statuses[idx] = 'incorrect'
            elif tag == 'delete':
                # Expected words not matched by transcription – if they fall
                # before the furthest transcribed word they were skipped (incorrect),
                # otherwise still pending.
                for idx in range(i1, i2):
                    if idx < num_transcribed:
                        self.word_statuses[idx] = 'incorrect'

        # Mark the next pending word after the last non-pending as 'current'
        last_active = -1
        for idx in range(num_expected - 1, -1, -1):
            if self.word_statuses[idx] in ('correct', 'incorrect'):
                last_active = idx
                break

        next_word = last_active + 1
        if next_word < num_expected and self.word_statuses[next_word] == 'pending':
            self.word_statuses[next_word] = 'current'

    def _check_for_mistake(self) -> Optional[Dict[str, Any]]:
        """Check if current transcription has mistakes compared to expected text"""
        if not self.expected_text_normalized or not self.current_transcription:
            return None
        
        # Normalize both texts (remove diacritics for comparison)
        expected_norm = self.riva_client._normalize_arabic(self.expected_text_normalized)
        transcribed_norm = self.riva_client._normalize_arabic(self.current_transcription)
        
        # For real-time checking, we want to check if the latest part of transcription
        # matches the corresponding part of expected text
        expected_length = len(expected_norm)
        transcribed_length = len(transcribed_norm)
        
        if transcribed_length == 0:
            return None
        
        # Compare the transcribed portion with the corresponding expected portion
        # We check if what was transcribed so far matches what should have been said
        check_length = min(expected_length, transcribed_length)
        expected_substring = expected_norm[:check_length]
        transcribed_substring = transcribed_norm[:check_length]
        
        # Use sequence matcher to find differences
        matcher = difflib.SequenceMatcher(None, expected_substring, transcribed_substring)
        similarity = matcher.ratio()
        
        # More lenient threshold for real-time (80% instead of 85%)
        # because transcription might be incomplete
        if similarity < 0.80:
            # Find the most recent difference (last mistake)
            last_mistake = None
            last_position = 0
            
            for tag, i1, i2, j1, j2 in matcher.get_opcodes():
                if tag in ['replace', 'delete', 'insert']:
                    # Track the most recent mistake
                    if i1 >= last_position:
                        last_position = i1
                        last_mistake = {
                            'type': self.riva_client._classify_mistake_type(
                                tag, 
                                expected_substring[i1:i2] if i1 < i2 else '',
                                transcribed_substring[j1:j2] if j1 < j2 else ''
                            ),
                            'position': i1,
                            'incorrect': transcribed_substring[j1:j2] if j1 < j2 else '',
                            'correct': expected_substring[i1:i2] if i1 < i2 else '',
                            'similarity': similarity,
                            'transcribed_so_far': transcribed_substring,
                            'expected_so_far': expected_substring
                        }
            
            return last_mistake
        
        return None
    
    def _calculate_progress(self) -> float:
        """Calculate how much of the verse has been recited"""
        if not self.expected_text_normalized:
            return 0.0
        
        expected_norm = self.riva_client._normalize_arabic(self.expected_text_normalized)
        transcribed_norm = self.riva_client._normalize_arabic(self.current_transcription)
        
        if not expected_norm:
            return 0.0
        
        # Calculate progress based on length
        progress = min(len(transcribed_norm) / len(expected_norm), 1.0) * 100
        return round(progress, 2)
    
    def get_final_accuracy(self) -> float:
        """Calculate final accuracy score"""
        if not self.expected_text_normalized:
            return 0.0
        
        # If no transcription was captured (mock returns empty), return 0
        if not self.current_transcription or len(self.current_transcription.strip()) == 0:
            return 0.0
        
        return self.riva_client.calculate_accuracy(
            self.current_transcription,
            self.expected_text_normalized
        )
    
    def get_all_mistakes(self) -> list:
        """Get all mistakes detected during the session"""
        if not self.expected_text_normalized or not self.current_transcription:
            return []
        
        # If no transcription was captured, return empty mistakes list
        if len(self.current_transcription.strip()) == 0:
            return []
        
        return self.riva_client.compare_recitation(
            self.current_transcription,
            self.expected_text_normalized
        )



