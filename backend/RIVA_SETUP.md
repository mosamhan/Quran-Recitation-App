# NVIDIA Riva Setup Guide for Arabic ASR

This guide will help you set up NVIDIA Riva with Arabic speech recognition for the Quran Recitation App.

## Prerequisites

1. NVIDIA GPU with CUDA support (for local deployment)
2. Docker and Docker Compose
3. NVIDIA Container Toolkit
4. Arabic ASR model (.nemo file)

## Arabic Model Configuration

This project includes a Conformer CTC Large Model for Arabic ASR. The model path is configured in `.env`:

```bash
RIVA_MODEL_NAME=/path/to/Conformer CTC Large Model.nemo
RIVA_LANGUAGE_CODE=ar-AR
```

Supported Arabic language codes:
- `ar-AR`: Modern Standard Arabic
- `ar-SA`: Saudi Arabic
- `ar-EG`: Egyptian Arabic
- `ar-AE`: UAE Arabic

## Option 1: Using NVIDIA Riva Cloud (Recommended for Development)

If you have access to NVIDIA Riva cloud services:

1. Sign up for NVIDIA Riva API access at [NVIDIA NGC](https://ngc.nvidia.com)
2. Get your API endpoint and API key
3. Update `backend/.env`:
   ```bash
   RIVA_API_URL=https://your-riva-endpoint.com
   RIVA_API_KEY=your_api_key_here
   RIVA_USE_SSL=true
   RIVA_MODEL_NAME=ar-AR-Conformer-CTC-Large
   RIVA_LANGUAGE_CODE=ar-AR
   ```

## Option 2: Local Riva Deployment with Custom Arabic Model

### Step 1: Install NVIDIA Container Toolkit

```bash
# For Ubuntu/Debian
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

### Step 2: Download Riva QuickStart Scripts

```bash
# Download Riva QuickStart from NGC
ngc registry resource download-version nvidia/riva/riva_quickstart:2.15.0

cd riva_quickstart_v2.15.0
```

### Step 3: Configure Riva for Arabic

Edit `config.sh`:

```bash
# Set service settings
service_enabled_asr=true
service_enabled_nlp=false
service_enabled_tts=false

# Set language
riva_language_code="ar-AR"

# Point to your custom .nemo model
# Place your .nemo file in the models directory
models_asr=("ar-AR-Conformer-CTC-Large=/models/Conformer CTC Large Model.nemo")
```

### Step 4: Initialize and Deploy Riva

```bash
# Initialize Riva (converts .nemo to .rmir format)
bash riva_init.sh

# Start Riva server
bash riva_start.sh
```

The server will start on `localhost:50051` (gRPC).

### Step 5: Update Backend Configuration

Update `backend/.env`:
```bash
RIVA_API_URL=localhost:50051
RIVA_USE_SSL=false
RIVA_MODEL_NAME=ar-AR-Conformer-CTC-Large
RIVA_LANGUAGE_CODE=ar-AR
```

## Option 3: Using Riva Python SDK (gRPC)

For production, you should use the Riva Python SDK with gRPC:

1. Install Riva Python SDK:
```bash
pip install nvidia-riva-client
```

2. Update `backend/riva_client.py` to use the gRPC client:

```python
from riva.client import ASRService

class RivaClient:
    def __init__(self, riva_uri, api_key=None):
        self.asr_service = ASRService(riva_uri, api_key=api_key)
    
    def transcribe_audio(self, audio_data):
        # Decode base64 audio
        audio_bytes = base64.b64decode(audio_data)
        
        # Use Riva ASR
        response = self.asr_service.recognize(
            audio_bytes,
            sample_rate_hertz=16000,
            language_code='ar'  # Arabic
        )
        
        return response.results[0].alternatives[0].transcript
```

## Arabic Language Model

Make sure your Riva deployment includes Arabic language models. You may need to:

1. Download Arabic ASR models
2. Configure Riva to use Arabic models
3. Set language code to 'ar' in API calls

## Testing the Connection

You can test the Riva connection by running:

```bash
cd backend
python -c "from riva_client import RivaClient; client = RivaClient('http://localhost:50051'); print('Connected!')"
```

## Troubleshooting

- **Connection refused**: Make sure Riva server is running and accessible
- **Audio format issues**: Ensure audio is in WAV format, 16kHz, mono
- **Language not supported**: Verify Arabic models are installed in Riva

For more information, visit: https://docs.nvidia.com/deeplearning/riva/





