"""
Silence detection utility for verse boundary detection.
Analyzes PCM audio bytes to detect trailing silence.
"""
import struct
import math
from typing import Optional


def detect_trailing_silence(
    audio_bytes: bytes,
    sample_rate: int = 16000,
    threshold_db: float = -40.0,
    min_duration_ms: int = 400,
) -> bool:
    """
    Check if the audio has trailing silence.

    Args:
        audio_bytes: Raw PCM 16-bit signed little-endian mono audio.
        sample_rate: Samples per second (default 16kHz).
        threshold_db: RMS level below which audio is considered silent.
        min_duration_ms: Minimum trailing silence duration in ms to return True.

    Returns:
        True if trailing silence >= min_duration_ms is detected.
    """
    if not audio_bytes or len(audio_bytes) < 2:
        return False

    # Number of samples to check for trailing silence
    samples_needed = int(sample_rate * min_duration_ms / 1000)
    bytes_needed = samples_needed * 2  # 16-bit = 2 bytes per sample

    # Take the tail of the audio
    tail = audio_bytes[-bytes_needed:] if len(audio_bytes) >= bytes_needed else audio_bytes

    # Decode PCM 16-bit LE samples
    num_samples = len(tail) // 2
    if num_samples == 0:
        return False

    samples = struct.unpack(f'<{num_samples}h', tail[:num_samples * 2])

    # Compute RMS
    sum_sq = sum(s * s for s in samples)
    rms = math.sqrt(sum_sq / num_samples) if num_samples > 0 else 0

    # Convert to dB (relative to max 16-bit value 32768)
    if rms < 1:
        rms_db = -96.0  # Essentially silence
    else:
        rms_db = 20.0 * math.log10(rms / 32768.0)

    return rms_db <= threshold_db
