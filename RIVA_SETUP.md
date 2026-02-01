# NVIDIA Riva ASR Integration Guide

This guide will help you set up NVIDIA Riva for Arabic speech recognition in your Iqra application.

## Overview

NVIDIA Riva is an AI SDK that provides:
- **Automatic Speech Recognition (ASR)** - Convert speech to text
- **Text-to-Speech (TTS)** - Convert text to speech
- **Natural Language Understanding (NLU)**

For this project, we'll use Riva's ASR capabilities to transcribe Arabic Quranic recitations.

## Prerequisites

1. **NVIDIA GPU** (recommended) or CPU-only setup
2. **Docker** and **Docker Compose** installed
3. **NVIDIA Container Toolkit** (for GPU support)
4. **Python 3.8+**

## Option 1: Using Riva Service (Recommended for Production)

### Step 1: Set Up Riva Service

NVIDIA Riva can be deployed as a service. You have several options:

#### A. NVIDIA NGC (NVIDIA GPU Cloud) - Easiest

1. **Sign up for NVIDIA NGC**: https://ngc.nvidia.com/
2. **Get API Key**: Navigate to your profile → API Keys → Generate new key
3. **Use Riva Service**: NVIDIA provides managed Riva services

#### B. Self-Hosted Riva Server

1. **Install Riva Quickstart**:
```bash
# Clone Riva repository
git clone https://github.com/nvidia/riva.git
cd riva

# Follow the quickstart guide
# https://docs.nvidia.com/riva/quick-start-guide/
```

2. **Deploy Riva with Docker**:
```bash
# Pull Riva images
docker pull nvcr.io/nvidia/riva/riva-speech:2.x.x

# Run Riva server (adjust ports as needed)
docker run --gpus all -p 50051:50051 nvcr.io/nvidia/riva/riva-speech:2.x.x
```

### Step 2: Install Riva Python Client

```bash
cd backend
pip install nvidia-riva-client
```

Or add to `requirements.txt`:
```
nvidia-riva-client>=2.0.0
grpcio>=1.60.0
protobuf>=4.25.1
```

### Step 3: Configure Environment Variables

Create or update `.env` file in the `backend` directory:

```env
# Riva Configuration
RIVA_API_URL=localhost:50051
RIVA_API_KEY=your_api_key_here  # If using NGC, otherwise leave empty
RIVA_USE_SSL=false  # Set to true for production
RIVA_MODEL_NAME=ArabicASR  # Model name for Arabic ASR
```

### Step 4: Update Riva Client Code

The code has been updated to support real Riva integration. The `riva_client.py` file will automatically use Riva if:
- `RIVA_API_URL` is set
- Riva client library is installed
- Riva server is running

## Option 2: Using Riva Python SDK (Alternative)

If you prefer using the Python SDK directly:

### Step 1: Install Dependencies

```bash
pip install nvidia-riva-client grpcio protobuf
```

### Step 2: Update the Code

The `riva_client.py` file includes both gRPC and HTTP REST API support. The current implementation tries:
1. HTTP REST API first (if `RIVA_API_URL` is an HTTP URL)
2. gRPC client (if `RIVA_API_URL` is a gRPC endpoint)
3. Falls back to mock if neither works

## Testing the Integration

### 1. Test Riva Connection

Create a test script `test_riva.py`:

```python
import os
from dotenv import load_dotenv
from riva_client import RivaClient

load_dotenv()

riva = RivaClient(
    api_url=os.getenv('RIVA_API_URL', 'localhost:50051'),
    api_key=os.getenv('RIVA_API_KEY')
)

# Test with a sample audio file
# You'll need to provide a base64 encoded audio file
test_audio = "base64_encoded_audio_here"
transcription = riva.transcribe_audio(test_audio)
print(f"Transcription: {transcription}")
```

### 2. Verify Arabic Model

Make sure your Riva server has an Arabic ASR model loaded. Check Riva documentation for:
- Arabic language model support
- Model configuration
- Language code (usually `ar` for Arabic)

## Configuration for Arabic ASR

Riva needs to be configured for Arabic language. In your Riva server configuration:

1. **Language Code**: Set to `ar` (Arabic)
2. **Model**: Use Arabic ASR model (check Riva model catalog)
3. **Sample Rate**: 16000 Hz (standard for speech recognition)
4. **Audio Format**: WAV, PCM, or WebM

## Troubleshooting

### Issue: "Connection refused"
- **Solution**: Make sure Riva server is running and accessible
- Check firewall settings
- Verify `RIVA_API_URL` is correct

### Issue: "Model not found"
- **Solution**: Ensure Arabic ASR model is loaded in Riva
- Check model configuration in Riva server

### Issue: "Authentication failed"
- **Solution**: Verify `RIVA_API_KEY` is correct (if using NGC)
- Check API key permissions

### Issue: "Unsupported audio format"
- **Solution**: Convert audio to supported format (WAV, 16kHz, mono)
- The code handles WebM conversion, but Riva may need WAV

## Production Considerations

1. **SSL/TLS**: Enable SSL for production (`RIVA_USE_SSL=true`)
2. **API Key Security**: Store API keys securely (use environment variables, not code)
3. **Error Handling**: The code includes fallback to mock, but in production you may want to fail fast
4. **Rate Limiting**: Implement rate limiting for Riva API calls
5. **Caching**: Consider caching transcriptions for repeated audio

## Alternative: Using Other ASR Services

If NVIDIA Riva is not available, you can integrate:

1. **Google Cloud Speech-to-Text** (supports Arabic)
2. **Azure Speech Services** (supports Arabic)
3. **AWS Transcribe** (supports Arabic)
4. **Whisper (OpenAI)** - Open source, supports Arabic

The `riva_client.py` can be adapted to use any of these services.

## Next Steps

1. Set up Riva server or get NGC API access
2. Install Riva Python client
3. Configure environment variables
4. Test the connection
5. Deploy and monitor

For more information, visit:
- [NVIDIA Riva Documentation](https://docs.nvidia.com/riva/)
- [Riva GitHub Repository](https://github.com/nvidia/riva)
- [NVIDIA NGC](https://ngc.nvidia.com/)



