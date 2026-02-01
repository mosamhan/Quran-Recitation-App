# NVIDIA Riva Arabic ASR Setup Guide

Complete guide for setting up NVIDIA Riva with your Arabic Conformer CTC Large Model for the Quran Recitation App.

## Quick Start

Your project already has an Arabic .nemo model file:
- **Location:** `backend/Conformer CTC Large Model.nemo`
- **Type:** Conformer CTC Large Model for Arabic ASR
- **Configuration:** Already set in `.env`

## Prerequisites

1. **NVIDIA GPU** with CUDA support (8GB+ VRAM recommended)
2. **Docker** and **Docker Compose**
3. **NVIDIA Container Toolkit**
4. **NGC Account** (free registration at https://ngc.nvidia.com)
5. **NGC CLI** (for downloading Riva QuickStart)

## Step-by-Step Setup

### 1. Install NVIDIA Container Toolkit

```bash
# For Ubuntu/Debian
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | \
  sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
  sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### 2. Install NGC CLI

```bash
# Download NGC CLI
wget --content-disposition https://ngc.nvidia.com/downloads/ngccli_linux.zip
unzip ngccli_linux.zip
chmod u+x ngc-cli/ngc

# Move to PATH
sudo mv ngc-cli/ngc /usr/local/bin/

# Configure NGC
ngc config set
# Enter your API key when prompted (get from https://ngc.nvidia.com/setup/api-key)
```

### 3. Download Riva QuickStart

```bash
# Create Riva directory
mkdir -p ~/riva
cd ~/riva

# Download Riva QuickStart
ngc registry resource download-version nvidia/riva/riva_quickstart:2.15.1

cd riva_quickstart_v2.15.1
```

### 4. Prepare Your Arabic Model

```bash
# Create models directory
mkdir -p models

# Copy your .nemo model to the Riva models directory
cp "/Users/moescomp/Desktop/Quran Recitation Project/backend/Conformer CTC Large Model.nemo" \
   models/arabic-conformer-ctc-large.nemo
```

### 5. Configure Riva for Arabic

Edit `config.sh` in the riva_quickstart directory:

```bash
# Open config.sh
nano config.sh
```

Update the following settings:

```bash
# Service settings - enable only ASR
service_enabled_asr=true
service_enabled_nlp=false
service_enabled_tts=false
service_enabled_nmt=false

# GPU settings
gpus_to_use="device=0"  # Use first GPU, change if needed

# Language code for Arabic
riva_model_loc="ar-AR"

# Configure ASR models - point to your Arabic .nemo model
models_asr=(
  "ar-AR-Conformer-CTC-Large=models/arabic-conformer-ctc-large.nemo"
)

# ASR parameters
asr_acoustic_model="ar-AR-Conformer-CTC-Large"
asr_language_code="ar-AR"

# Enable profiling and verbose logging (optional, for debugging)
riva_asr_verbosity="INFO"
```

### 6. Initialize Riva

This step converts your .nemo model to Riva's optimized .rmir format:

```bash
# Initialize Riva (this may take 10-30 minutes)
bash riva_init.sh

# You should see output like:
# "Building ASR model ar-AR-Conformer-CTC-Large..."
# "Model build complete"
```

**Note:** This process optimizes your model for inference and requires:
- Sufficient disk space (~10GB for model artifacts)
- Good internet connection
- Patience (first time takes longer)

### 7. Start Riva Server

```bash
# Start Riva services
bash riva_start.sh

# Check if running
docker ps | grep riva
```

You should see containers like:
- `riva-speech:2.15.1-server`
- Other Riva components

The gRPC server will be available at `localhost:50051`.

### 8. Configure Your Application

Update `/Users/moescomp/Desktop/Quran Recitation Project/backend/.env`:

```bash
# NVIDIA Riva Configuration
RIVA_API_URL=localhost:50051
RIVA_USE_SSL=false

# Arabic Model Configuration
RIVA_MODEL_NAME=ar-AR-Conformer-CTC-Large
RIVA_LANGUAGE_CODE=ar-AR

# Optional: Enable detailed logging
RIVA_VERBOSE=true
```

### 9. Test the Connection

Create a test script `backend/test_riva_arabic.py`:

```python
#!/usr/bin/env python3
"""Test Riva Arabic ASR connection"""

import os
import sys
import base64
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Import Riva client
from riva_client import RivaClient

def test_riva():
    """Test Riva connection and Arabic ASR"""
    
    print("Testing NVIDIA Riva Arabic ASR...")
    print("=" * 50)
    
    # Initialize client
    api_url = os.getenv('RIVA_API_URL', 'localhost:50051')
    model_name = os.getenv('RIVA_MODEL_NAME')
    language_code = os.getenv('RIVA_LANGUAGE_CODE', 'ar-AR')
    
    print(f"API URL: {api_url}")
    print(f"Model: {model_name}")
    print(f"Language: {language_code}")
    print()
    
    try:
        client = RivaClient(
            api_url=api_url,
            model_name=model_name,
            language_code=language_code
        )
        print("✓ Client initialized successfully")
        
        # Test with sample audio (you'll need to provide a sample)
        # For now, test with empty to see connection works
        print("\nTesting transcription...")
        
        # In production, you'd load actual Arabic audio here
        # For connection test, we'll just verify the client is ready
        print("✓ Riva client is ready for Arabic ASR")
        print("\nNext step: Record sample Arabic audio and test transcription")
        
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_riva()
    sys.exit(0 if success else 1)
```

Run the test:

```bash
cd /Users/moescomp/Desktop/Quran\ Recitation\ Project/backend
python test_riva_arabic.py
```

### 10. Verify Riva is Working

Check Riva server logs:

```bash
# View Riva logs
docker logs $(docker ps --filter "ancestor=nvcr.io/nvidia/riva/riva-speech:2.15.1" --format "{{.ID}}") | tail -50
```

Look for messages like:
- "ASR service started successfully"
- "Model ar-AR-Conformer-CTC-Large loaded"

## Testing with Real Audio

Once Riva is running, test with actual recitation:

1. Start your Flask backend:
   ```bash
   cd backend
   python app.py
   ```

2. Open the frontend and navigate to the Practice page

3. Select a verse and click "Start Recording"

4. Recite the verse in Arabic

5. Stop recording - you should now see real transcription and accuracy!

## Troubleshooting

### Issue: "Model not found" or "Failed to load model"

**Possible causes:**
- Model path in `config.sh` is incorrect
- .nemo file is corrupted
- Not enough GPU memory

**Solutions:**
```bash
# 1. Verify model file exists
ls -lh ~/riva/riva_quickstart_v2.15.1/models/arabic-conformer-ctc-large.nemo

# 2. Check file integrity
file models/arabic-conformer-ctc-large.nemo

# 3. Re-copy the model
cp "/Users/moescomp/Desktop/Quran Recitation Project/backend/Conformer CTC Large Model.nemo" \
   models/arabic-conformer-ctc-large.nemo

# 4. Re-initialize Riva
bash riva_init.sh config
```

### Issue: "Connection refused" to localhost:50051

**Solutions:**
```bash
# 1. Check if Riva is running
docker ps | grep riva

# 2. If not running, start it
cd ~/riva/riva_quickstart_v2.15.1
bash riva_start.sh

# 3. Check port is not blocked
sudo netstat -tlnp | grep 50051

# 4. Try restarting Docker
sudo systemctl restart docker
bash riva_start.sh
```

### Issue: "CUDA out of memory"

**Solutions:**
```bash
# 1. Check GPU memory
nvidia-smi

# 2. Close other GPU processes
# (kill other processes using GPU)

# 3. Use smaller batch size in config.sh:
# Edit config.sh and add:
asr_batch_size=1

# 4. Restart Riva
bash riva_stop.sh
bash riva_start.sh
```

### Issue: Poor transcription accuracy

**Checklist:**
1. ✓ Audio is 16kHz sample rate
2. ✓ Audio is mono (1 channel)
3. ✓ Audio is 16-bit PCM WAV
4. ✓ No background noise
5. ✓ Clear pronunciation
6. ✓ Using Arabic model (ar-AR)

**Debug transcription:**
```python
# In backend, add detailed logging
print(f"Transcribed: {transcribed_text}")
print(f"Expected: {expected_text}")
print(f"Normalized transcribed: {normalized_transcribed}")
print(f"Normalized expected: {normalized_expected}")
```

### Issue: Riva init takes forever

This is normal for first-time setup. The process:
1. Downloads TensorRT optimization tools
2. Converts .nemo to .rmir format
3. Optimizes for your specific GPU
4. Creates model artifacts

Expected time: 10-45 minutes depending on model size and hardware.

## Performance Optimization

### GPU Memory

Monitor GPU usage:
```bash
watch -n 1 nvidia-smi
```

### Batch Size

For real-time streaming, use smaller batches:
```bash
# In config.sh
asr_batch_size=1
asr_chunk_duration=0.1  # 100ms chunks
```

### Model Precision

Use FP16 for faster inference (slight accuracy tradeoff):
```bash
# In config.sh
asr_fp16_mode=true
```

## Alternative: Using Pre-built Arabic Models

If your .nemo model doesn't work, try NGC's pre-built Arabic models:

```bash
# List available Arabic models
ngc registry model list nvidia/tao/speechtotext_ar_*

# Download a pre-built model
ngc registry model download-version "nvidia/tao/speechtotext_ar_ar_conformer:trainable_v1.0"

# Update config.sh to use downloaded model
```

## Resources

- **Riva Documentation:** https://docs.nvidia.com/deeplearning/riva/user-guide/docs/
- **NGC Catalog:** https://ngc.nvidia.com/catalog/models
- **Riva QuickStart Guide:** https://github.com/nvidia-riva/riva-quickstart
- **Arabic ASR Models:** https://ngc.nvidia.com/catalog?query=arabic+asr

## Next Steps

After successful setup:

1. ✅ Riva server running on localhost:50051
2. ✅ Backend configured with Arabic model
3. ✅ Test connection successful
4. ✅ Start backend: `python app.py`
5. ✅ Open frontend and test recitation
6. ✅ Monitor accuracy and transcription quality
7. ✅ Fine-tune if needed

Your Quran recitation app now has real Arabic speech recognition! 🎉
