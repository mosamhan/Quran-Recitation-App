# Quick Setup Guide

## 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env.example .env
# Edit .env with your configuration

# Initialize database
python scripts/init_db.py

# Run the server
python app.py
```

The backend will be available at `http://localhost:8000`

## 2. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `i`/`a` for simulators.

## 3. NVIDIA Riva Setup (Optional)

See `backend/docs/RIVA_SETUP.md` for detailed instructions.

Without Riva, the backend falls back to OpenAI Whisper for Arabic speech recognition. Install it with:

```bash
pip install openai-whisper
```

## Troubleshooting

### Backend won't start
- Make sure Python 3.8+ is installed
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Verify the database file is created: `ls -la backend/instance/*.db`

### Mobile app won't start
- Make sure Node.js 16+ is installed
- Try deleting `node_modules` and running `npm install` again
- Make sure Expo CLI is installed: `npm install -g expo-cli`

### Riva connection errors
- Check that Riva server is running
- Verify the API URL in `.env` is correct
- See `backend/docs/RIVA_SETUP.md` for setup instructions
