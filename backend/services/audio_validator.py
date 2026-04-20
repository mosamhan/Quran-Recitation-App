"""
Audio validation and processing utilities
"""
import base64
import io
from typing import Dict, Optional, Tuple
import wave
import struct

try:
    from pydub import AudioSegment
    # Test if ffprobe is available
    try:
        AudioSegment.from_file(io.BytesIO(b'test'), format='wav')
    except:
        pass  # This will fail, but we just want to check if pydub imports
    PYDUB_AVAILABLE = True
except ImportError:
    PYDUB_AVAILABLE = False
    print("Warning: pydub not available. Install with: pip install pydub")
except Exception as e:
    PYDUB_AVAILABLE = False
    print(f"Warning: pydub available but FFmpeg not found: {e}")
    print("Install FFmpeg: brew install ffmpeg (macOS) or apt-get install ffmpeg (Linux)")


class AudioValidator:
    """Validates and processes audio files for recitation data collection"""
    
    @staticmethod
    def validate_audio_base64(audio_data: str) -> Tuple[bool, Optional[str], Optional[Dict]]:
        """
        Validate base64 encoded audio data
        
        Returns:
            (is_valid, error_message, audio_metadata)
        """
        try:
            # Extract base64 part if it's a data URI
            if audio_data.startswith('data:audio'):
                audio_data = audio_data.split(',')[1]
            
            # Decode base64
            try:
                audio_bytes = base64.b64decode(audio_data)
            except Exception as e:
                return False, f"Invalid base64 encoding: {str(e)}", None
            
            # Check if audio is empty
            if len(audio_bytes) < 100:  # Minimum reasonable audio file size
                return False, "Audio file is too small or empty", None
            
            # Try to get metadata
            metadata = {}
            
            if PYDUB_AVAILABLE:
                try:
                    # Try to load as audio
                    audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
                    metadata = {
                        'duration_ms': len(audio),
                        'channels': audio.channels,
                        'sample_rate': audio.frame_rate,
                        'frame_width': audio.frame_width,
                        'format': 'detected'
                    }
                    
                    # Check if audio has actual sound (not just silence)
                    if audio.max_possible_amplitude == 0:
                        return False, "Audio file contains no sound data", None
                    
                    # Check duration (should be reasonable for a verse)
                    if metadata['duration_ms'] < 500:  # Less than 0.5 seconds
                        return False, "Audio duration is too short", None
                    
                    if metadata['duration_ms'] > 300000:  # More than 5 minutes
                        return False, "Audio duration is too long", None
                    
                except FileNotFoundError as e:
                    # FFmpeg/ffprobe not found - skip detailed validation
                    print(f"Warning: FFmpeg not available, skipping detailed audio validation: {e}")
                    metadata = {
                        'size_bytes': len(audio_bytes),
                        'format': 'unknown',
                        'validation_skipped': True
                    }
                except Exception as e:
                    # Other errors - still validate basic properties
                    print(f"Warning: Could not parse audio with pydub: {e}")
                    metadata = {
                        'size_bytes': len(audio_bytes),
                        'format': 'unknown',
                        'validation_skipped': True
                    }
            else:
                # Basic validation without pydub
                metadata = {
                    'size_bytes': len(audio_bytes),
                    'format': 'unknown',
                    'validation_skipped': True
                }
            
            return True, None, metadata
            
        except Exception as e:
            return False, f"Error validating audio: {str(e)}", None
    
    @staticmethod
    def standardize_audio(audio_data: str, target_sample_rate: int = 16000, 
                          target_channels: int = 1) -> Tuple[bool, Optional[str], Optional[bytes]]:
        """
        Standardize audio to target format (for ML training consistency)
        
        Returns:
            (success, error_message, standardized_audio_bytes)
        """
        if not PYDUB_AVAILABLE:
            return False, "pydub not available for audio standardization", None
        
        try:
            # Extract base64 part if it's a data URI
            if audio_data.startswith('data:audio'):
                audio_data = audio_data.split(',')[1]
            
            # Decode base64
            audio_bytes = base64.b64decode(audio_data)
            
            # Load audio
            audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
            
            # Standardize
            audio = audio.set_frame_rate(target_sample_rate)
            audio = audio.set_channels(target_channels)
            audio = audio.set_sample_width(2)  # 16-bit
            
            # Export as WAV
            wav_buffer = io.BytesIO()
            audio.export(wav_buffer, format="wav")
            standardized_bytes = wav_buffer.getvalue()
            
            return True, None, standardized_bytes
            
        except FileNotFoundError as e:
            return False, f"FFmpeg not installed. Please install FFmpeg: {str(e)}", None
        except Exception as e:
            return False, f"Error standardizing audio: {str(e)}", None
    
    @staticmethod
    def get_audio_duration_ms(audio_data: str) -> Optional[int]:
        """Get audio duration in milliseconds"""
        if not PYDUB_AVAILABLE:
            return None
        
        try:
            if audio_data.startswith('data:audio'):
                audio_data = audio_data.split(',')[1]
            
            audio_bytes = base64.b64decode(audio_data)
            audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
            return len(audio)
        except:
            return None

