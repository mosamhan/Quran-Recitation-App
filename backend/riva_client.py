"""
NVIDIA Riva Client for speech recognition and analysis
"""
import requests
import base64
import difflib
from typing import List, Dict, Any, Optional
import re
import os
from tajweed_rules import detect_tajweed_rules, classify_tajweed_mistake, get_all_rules

# Try to import Riva gRPC client
try:
    from riva.client import ASRService
    import grpc
    RIVA_GRPC_AVAILABLE = True
except ImportError:
    try:
        # Alternative import path
        import riva.client.proto.riva_asr_pb2 as riva_asr_pb2
        import riva.client.proto.riva_asr_pb2_grpc as riva_asr_pb2_grpc
        import grpc
        RIVA_GRPC_AVAILABLE = True
        USE_LEGACY_RIVA = True
    except ImportError:
        RIVA_GRPC_AVAILABLE = False
        USE_LEGACY_RIVA = False
        print("Warning: Riva gRPC client not available. Install with: pip install nvidia-riva-client")

class RivaClient:
    """Client for interacting with NVIDIA Riva API"""
    
    def __init__(self, api_url: str, api_key: str = None, use_ssl: bool = False, 
                 model_name: str = None, language_code: str = 'ar-AR'):
        self.api_url = api_url.rstrip('/')
        self.api_key = api_key
        self.use_ssl = use_ssl
        self.model_name = model_name  # e.g., path to .nemo model
        self.language_code = language_code  # Default to Arabic
        self.headers = {}
        if api_key:
            self.headers['Authorization'] = f'Bearer {api_key}'
        
        # Determine if using gRPC or HTTP
        self.use_grpc = ':' in self.api_url and not self.api_url.startswith('http')
        if self.use_grpc:
            self.grpc_channel = None
            self.asr_service = None
            
        print(f"RivaClient initialized: URL={self.api_url}, Model={self.model_name}, Lang={self.language_code}")
    
    def transcribe_audio(self, audio_data: str, language_code: str = None) -> str:
        """
        Transcribe audio using NVIDIA Riva ASR
        
        Args:
            audio_data: Base64 encoded audio data or file path
            language_code: Language code (default: uses self.language_code, typically 'ar-AR' for Arabic)
            
        Returns:
            Transcribed text
        """
        # Use instance language code if not provided
        if language_code is None:
            language_code = self.language_code
            
        try:
            # If audio_data is a base64 string, decode it
            if isinstance(audio_data, str) and audio_data.startswith('data:audio'):
                # Extract base64 part from data URI
                audio_data = audio_data.split(',')[1]
            
            # Try gRPC first if available
            if self.use_grpc and RIVA_GRPC_AVAILABLE:
                return self._transcribe_grpc(audio_data, language_code)
            
            # Try HTTP REST API
            if self.api_url.startswith('http'):
                return self._transcribe_http(audio_data, language_code)
            
            # Fallback to mock if Riva not configured
            print("Warning: Riva not configured, using mock transcription")
            return self._mock_transcribe(audio_data)
                
        except Exception as e:
            print(f"Error in transcribe_audio: {e}")
            import traceback
            traceback.print_exc()
            # For development, return mock transcription
            return self._mock_transcribe(audio_data)
    
    def _transcribe_grpc(self, audio_data: str, language_code: str) -> str:
        """Transcribe using Riva gRPC client"""
        try:
            # Decode base64 audio
            audio_bytes = base64.b64decode(audio_data)
            
            print(f"Transcribing with gRPC - Lang: {language_code}, Model: {self.model_name}")
            
            # Use Riva ASRService if available (newer API)
            try:
                from riva.client import ASRService
                
                # Initialize ASR service
                asr_service = ASRService(
                    url=self.api_url,
                    ssl_cert=self.api_key if self.use_ssl else None
                )
                
                # Prepare recognition config
                config_kwargs = {
                    'sample_rate': 16000,
                    'language_code': language_code,
                }
                
                # Add model name if specified (for custom .nemo models)
                if self.model_name:
                    config_kwargs['model_name'] = self.model_name
                
                # Transcribe
                response = asr_service.offline_recognize(
                    audio_bytes,
                    **config_kwargs
                )
                
                # Extract transcription
                if response and hasattr(response, 'results'):
                    for result in response.results:
                        if hasattr(result, 'alternatives') and result.alternatives:
                            return result.alternatives[0].transcript
                elif isinstance(response, str):
                    return response
                elif isinstance(response, dict) and 'transcript' in response:
                    return response['transcript']
                
                return ""
                
            except ImportError:
                # Fallback to legacy gRPC API
                if not self.grpc_channel:
                    # Create gRPC channel
                    if self.use_ssl:
                        credentials = grpc.ssl_channel_credentials()
                        self.grpc_channel = grpc.secure_channel(self.api_url, credentials)
                    else:
                        self.grpc_channel = grpc.insecure_channel(self.api_url)
                    
                    # Create ASR service stub
                    import riva.client.proto.riva_asr_pb2_grpc as riva_asr_pb2_grpc
                    self.asr_service = riva_asr_pb2_grpc.RivaSpeechRecognitionStub(self.grpc_channel)
                
                # Use legacy API
                import riva.client.proto.riva_asr_pb2 as riva_asr_pb2
                
                # Build config with optional model name
                config_params = {
                    'encoding': riva_asr_pb2.RecognitionConfig.AudioEncoding.LINEAR_PCM,
                    'sample_rate_hertz': 16000,
                    'language_code': language_code,
                    'max_alternatives': 1,
                    'enable_automatic_punctuation': False,
                }
                
                # Add model name if specified
                if self.model_name:
                    config_params['model'] = self.model_name
                
                config = riva_asr_pb2.RecognitionConfig(**config_params)
                
                request = riva_asr_pb2.RecognizeRequest(
                    config=config,
                    audio=riva_asr_pb2.RecognitionAudio(content=audio_bytes)
                )
                
                response = self.asr_service.Recognize(request)
                
                if response.results:
                    for result in response.results:
                        if result.alternatives:
                            return result.alternatives[0].transcript
                
                return ""
            
        except Exception as e:
            print(f"Error in gRPC transcription: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    def _transcribe_http(self, audio_data: str, language_code: str) -> str:
        """Transcribe using Riva HTTP REST API"""
        try:
            payload = {
                'audio': audio_data,
                'language_code': language_code,
                'sample_rate': 16000
            }
            
            # Add model name if specified
            if self.model_name:
                payload['model_name'] = self.model_name
            
            print(f"HTTP transcribe request - Lang: {language_code}, Model: {self.model_name}")
            
            response = requests.post(
                f'{self.api_url}/asr/transcribe',
                json=payload,
                headers=self.headers,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return result.get('transcription', '')
            else:
                print(f"Riva HTTP API error: {response.status_code} - {response.text}")
                return self._mock_transcribe(audio_data)
                
        except requests.exceptions.RequestException as e:
            print(f"Error connecting to Riva HTTP API: {e}")
            return self._mock_transcribe(audio_data)
    
    def _mock_transcribe(self, audio_data: str) -> str:
        """
        Fallback transcription using OpenAI Whisper for Arabic speech-to-text.
        Used when Riva is not configured.
        """
        return self._whisper_transcribe(audio_data)

    def _whisper_transcribe(self, audio_data: str) -> str:
        """Transcribe audio using OpenAI Whisper (local, no API key needed)."""
        import tempfile
        import os

        try:
            import whisper
        except ImportError:
            print("Whisper not installed. Run: pip install openai-whisper")
            return ""

        # Lazy-load model once
        if not hasattr(self, '_whisper_model') or self._whisper_model is None:
            print("Loading Whisper model (base) for Arabic transcription...")
            self._whisper_model = whisper.load_model("base")
            print("Whisper model loaded.")

        try:
            # Decode base64 audio to a temp file
            audio_bytes = base64.b64decode(audio_data)
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                f.write(audio_bytes)
                tmp_path = f.name

            # Transcribe with Arabic language hint
            result = self._whisper_model.transcribe(
                tmp_path,
                language="ar",
                task="transcribe",
            )
            transcription = result.get("text", "").strip()
            print(f"Whisper transcription: {transcription}")

            os.unlink(tmp_path)
            return transcription

        except Exception as e:
            print(f"Whisper transcription error: {e}")
            import traceback
            traceback.print_exc()
            return ""
    
    def compare_recitation(self, transcribed: str, expected: str) -> List[Dict[str, Any]]:
        """
        Compare transcribed text with expected text and identify mistakes.
        Enriches each mistake with tajweed rule info when applicable.
        """
        mistakes = []

        transcribed_normalized = self._normalize_arabic(transcribed)
        expected_normalized = self._normalize_arabic(expected)

        diff = difflib.SequenceMatcher(None, expected_normalized, transcribed_normalized)

        for tag, i1, i2, j1, j2 in diff.get_opcodes():
            if tag in ['replace', 'delete', 'insert']:
                correct_segment = expected[i1:i2] if i1 < i2 else ''
                incorrect_segment = transcribed[j1:j2] if j1 < j2 else ''

                # Check if this mistake overlaps with a tajweed rule
                tajweed_info = classify_tajweed_mistake(expected, incorrect_segment, i1)

                if tajweed_info['is_tajweed']:
                    mistake = {
                        'type': 'tajweed',
                        'position': i1,
                        'incorrect': incorrect_segment,
                        'correct': correct_segment,
                        'suggestion': tajweed_info['suggestion'],
                        'tajweed_rule': tajweed_info['rule_id'],
                        'tajweed_name': tajweed_info['rule_name'],
                        'tajweed_arabic': tajweed_info['rule_arabic'],
                        'tajweed_description': tajweed_info['rule_description'],
                        'tajweed_color': tajweed_info['rule_color'],
                    }
                else:
                    mistake = {
                        'type': self._classify_mistake_type(tag, correct_segment, incorrect_segment),
                        'position': i1,
                        'incorrect': incorrect_segment,
                        'correct': correct_segment,
                        'suggestion': self._generate_suggestion(correct_segment, incorrect_segment),
                    }
                mistakes.append(mistake)

        return mistakes
    
    def _normalize_arabic(self, text: str) -> str:
        """Normalize Arabic text for comparison"""
        # Remove diacritics (tashkeel) but keep base letters
        # This is a simplified version - you may want more sophisticated normalization
        arabic_diacritics = re.compile(r'[\u064B-\u065F\u0670]')
        return arabic_diacritics.sub('', text)
    
    def _classify_mistake_type(self, tag: str, correct: str, incorrect: str) -> str:
        """Classify the type of mistake"""
        if tag == 'delete':
            return 'omission'
        elif tag == 'insert':
            return 'addition'
        elif tag == 'replace':
            # Check if it's a Tajweed rule violation
            if self._is_tajweed_related(correct, incorrect):
                return 'tajweed'
            else:
                return 'pronunciation'
        return 'general'
    
    def _is_tajweed_related(self, correct: str, incorrect: str) -> bool:
        """Check if mistake is related to Tajweed rules"""
        # Simplified check - in production, use more sophisticated Tajweed analysis
        tajweed_indicators = ['غنة', 'مد', 'إدغام', 'إخفاء', 'إظهار']
        return any(indicator in correct or indicator in incorrect for indicator in tajweed_indicators)
    
    def _generate_suggestion(self, correct: str, incorrect: str) -> str:
        """Generate helpful suggestion for correction"""
        if not correct:
            return "Try to pronounce this part more clearly."
        if not incorrect:
            return f"Don't forget to include: {correct}"
        return f"Instead of '{incorrect}', try saying '{correct}'. Focus on the pronunciation of each letter."
    
    def calculate_accuracy(self, transcribed: str, expected: str) -> float:
        """
        Calculate accuracy score between transcribed and expected text
        
        Returns:
            Accuracy score between 0 and 100
        """
        # Clean and normalize both texts
        transcribed_clean = transcribed.strip() if transcribed else ""
        expected_clean = expected.strip() if expected else ""
        
        if not expected_clean:
            return 0.0
        
        if not transcribed_clean:
            return 0.0
        
        transcribed_norm = self._normalize_arabic(transcribed_clean)
        expected_norm = self._normalize_arabic(expected_clean)
        
        if not expected_norm:
            return 0.0
        
        if not transcribed_norm:
            return 0.0
        
        # Use SequenceMatcher for similarity
        similarity = difflib.SequenceMatcher(None, expected_norm, transcribed_norm).ratio()
        
        # For development: if similarity is very low but we have some transcription,
        # give a minimum score to indicate the system is working
        # (This helps when using mock transcription)
        if similarity < 0.1 and len(transcribed_norm) > 0:
            # Give a small score to indicate transcription is happening
            return max(round(similarity * 100, 2), 5.0)
        
        return round(similarity * 100, 2)
    
    def generate_feedback(self, mistakes: List[Dict], accuracy: float) -> str:
        """Generate friendly feedback message for the user"""
        if accuracy >= 95:
            return "🌟 Excellent! Your recitation is very accurate. Keep up the great work!"
        elif accuracy >= 85:
            return "👍 Good job! You're doing well. Practice a bit more to perfect it."
        elif accuracy >= 70:
            return "💪 You're making progress! Focus on the mistakes highlighted below."
        else:
            return "📚 Don't worry, learning takes time! Review the mistakes and try again. You can do it!"



