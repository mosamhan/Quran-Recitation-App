"""
Free recitation session orchestrator.
Manages auto-detection of recitation position and verse-by-verse following.
"""
import base64
from typing import Dict, Any, List, Optional

from services.riva_client import RivaClient
from services.streaming_analyzer import StreamingAnalyzer
from services.quran_index import get_index
from services.silence_detector import detect_trailing_silence


class FreeRecitationSession:
    """
    Manages a free recitation session with states:
      detecting -> following -> finished
    """

    # Minimum confidence to lock onto a verse
    DETECTION_CONFIDENCE = 0.35
    # Text completion threshold to consider a verse done
    COMPLETION_THRESHOLD = 85.0
    # Minimum silence duration (ms) to confirm verse boundary
    SILENCE_MS = 400

    def __init__(self, riva_client: RivaClient):
        self.riva_client = riva_client
        self.state = 'detecting'  # detecting | following | finished

        # Detection phase
        self._accumulated_transcription = ''
        self._detection_chunks = 0

        # Following phase
        self._analyzer: Optional[StreamingAnalyzer] = None
        self.current_chapter: Optional[int] = None
        self.current_verse: Optional[int] = None
        self.current_verse_text: Optional[str] = None

        # Results
        self.verse_results: List[Dict[str, Any]] = []

    def process_chunk(self, audio_chunk_base64: str) -> Dict[str, Any]:
        """
        Process an audio chunk. Behaviour depends on current state.

        Returns a dict with at least: {state, ...phase-specific fields}
        """
        if self.state == 'detecting':
            return self._detect(audio_chunk_base64)
        elif self.state == 'following':
            return self._follow(audio_chunk_base64)
        else:
            return {'state': 'finished', 'verse_results': self.verse_results}

    # ------------------------------------------------------------------
    # Detection phase
    # ------------------------------------------------------------------

    def _detect(self, audio_chunk_base64: str) -> Dict[str, Any]:
        """Transcribe chunk and search for matching verse."""
        self._detection_chunks += 1

        # Transcribe
        transcription = self.riva_client.transcribe_audio(audio_chunk_base64)
        if transcription:
            if self._accumulated_transcription:
                self._accumulated_transcription += ' ' + transcription.strip()
            else:
                self._accumulated_transcription = transcription.strip()

        # Search the index
        index = get_index()
        candidates = index.search(self._accumulated_transcription)

        if not candidates:
            return {
                'state': 'detecting',
                'transcription': self._accumulated_transcription,
                'candidates': [],
                'detected': False,
            }

        top = candidates[0]

        # Lock on if confidence is high enough
        if top['confidence'] >= self.DETECTION_CONFIDENCE:
            self._start_following(top['chapter'], top['verse'], top['verse_text'])
            return {
                'state': 'following',
                'detected': True,
                'current_chapter': self.current_chapter,
                'current_verse': self.current_verse,
                'verse_text': self.current_verse_text,
                'confidence': top['confidence'],
                'word_statuses': self._analyzer.word_statuses if self._analyzer else [],
                'progress': 0.0,
                'verse_completed': False,
                'verse_results_so_far': self.verse_results,
            }

        return {
            'state': 'detecting',
            'transcription': self._accumulated_transcription,
            'candidates': candidates[:3],
            'detected': False,
        }

    # ------------------------------------------------------------------
    # Following phase
    # ------------------------------------------------------------------

    def _start_following(self, chapter: int, verse: int, verse_text: str):
        """Initialize the StreamingAnalyzer for the detected verse."""
        self.state = 'following'
        self.current_chapter = chapter
        self.current_verse = verse
        self.current_verse_text = verse_text

        self._analyzer = StreamingAnalyzer(self.riva_client)
        self._analyzer.set_expected_text(verse_text)

        # Re-analyze accumulated transcription so far against the verse
        # (the detection-phase transcription may already cover part of the verse)
        if self._accumulated_transcription:
            # Fake a chunk from the accumulated text by encoding it as-is won't work;
            # instead just seed the analyzer's transcription directly.
            self._analyzer.current_transcription = self._accumulated_transcription
            self._analyzer._update_word_statuses()

    def _follow(self, audio_chunk_base64: str) -> Dict[str, Any]:
        """Send chunk to StreamingAnalyzer and check for verse completion."""
        result = self._analyzer.analyze_chunk(audio_chunk_base64)
        progress = result.get('progress', 0.0)
        word_statuses = result.get('word_statuses', [])

        # Check for verse completion: progress >= threshold AND trailing silence
        verse_completed = False
        if progress >= self.COMPLETION_THRESHOLD:
            # Decode audio to check for silence
            try:
                audio_bytes = base64.b64decode(audio_chunk_base64)
                has_silence = detect_trailing_silence(
                    audio_bytes, min_duration_ms=self.SILENCE_MS
                )
            except Exception:
                has_silence = False

            if has_silence:
                verse_completed = True

        if verse_completed:
            self._save_current_verse_result()
            advanced = self._advance_to_next_verse()
            if not advanced:
                # No more verses (end of Quran or end of chapter)
                self.state = 'finished'
                return {
                    'state': 'finished',
                    'verse_completed': True,
                    'verse_results_so_far': self.verse_results,
                    'current_chapter': self.current_chapter,
                    'current_verse': self.current_verse,
                }

        return {
            'state': self.state,
            'current_chapter': self.current_chapter,
            'current_verse': self.current_verse,
            'verse_text': self.current_verse_text,
            'word_statuses': word_statuses,
            'progress': progress,
            'verse_completed': verse_completed,
            'verse_results_so_far': self.verse_results,
            'has_mistake': result.get('has_mistake', False),
            'mistake_details': result.get('mistake_details'),
            'current_transcription': result.get('current_transcription', ''),
        }

    def _save_current_verse_result(self):
        """Save accuracy and mistakes for the current verse."""
        if not self._analyzer:
            return

        accuracy = self._analyzer.get_final_accuracy()
        mistakes = self._analyzer.get_all_mistakes()

        self.verse_results.append({
            'chapter': self.current_chapter,
            'verse': self.current_verse,
            'accuracy': accuracy,
            'mistakes': mistakes,
            'transcription': self._analyzer.current_transcription,
        })

    def _advance_to_next_verse(self) -> bool:
        """Move to the next verse. Returns False if there is no next verse."""
        index = get_index()
        nxt = index.get_next_verse(self.current_chapter, self.current_verse)
        if nxt is None:
            return False

        next_ch, next_v, next_text = nxt
        self.current_chapter = next_ch
        self.current_verse = next_v
        self.current_verse_text = next_text

        # Reset analyzer for new verse
        self._analyzer = StreamingAnalyzer(self.riva_client)
        self._analyzer.set_expected_text(next_text)
        self._accumulated_transcription = ''
        return True

    # ------------------------------------------------------------------
    # Finish
    # ------------------------------------------------------------------

    def finish(self) -> Dict[str, Any]:
        """End the session and return final results."""
        # Save current verse if we were mid-follow
        if self.state == 'following' and self._analyzer:
            self._save_current_verse_result()

        self.state = 'finished'

        total_accuracy = 0.0
        if self.verse_results:
            total_accuracy = sum(r['accuracy'] for r in self.verse_results) / len(self.verse_results)

        return {
            'verses_recited': self.verse_results,
            'total_accuracy': round(total_accuracy, 2),
            'total_verses': len(self.verse_results),
        }
