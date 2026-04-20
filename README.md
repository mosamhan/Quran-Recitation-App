# IQRA - Quran Recitation Learning App

## Overview

A mobile application built with React Native (Expo) to help users learn and improve their Quranic recitation using AI-powered Arabic speech recognition (NVIDIA Riva ASR). Features age-adaptive themes, structured curriculum, and progress tracking.

## Features

- Browse all 114 chapters of the Quran
- Listen to recitations from verified reciters
- Practice recitation with real-time pronunciation feedback
- Track progress and accuracy over time
- Age-adaptive UI themes (kids, teens, adults)
- Structured curriculum with guided learning paths
- Tajweed rule highlighting and feedback

## Project Structure

```
Quran Recitation Project/
├── backend/                          # Flask API server
│   ├── app.py                       # Main application
│   ├── riva_client.py               # NVIDIA Riva ASR client
│   ├── quran_api.py                 # Al-Quran Cloud API integration
│   ├── streaming_analyzer.py        # Real-time analysis
│   ├── models.py                    # Database models
│   ├── requirements.txt             # Python dependencies
│   └── RIVA_ARABIC_SETUP.md        # Riva setup guide
│
├── mobile/                           # React Native (Expo) app
│   ├── App.js                       # Root component & navigation
│   ├── src/
│   │   ├── screens/                 # App screens
│   │   ├── context/                 # React contexts (theme, user)
│   │   ├── services/                # API client
│   │   └── utils/                   # Theme & helpers
│   └── package.json
│
└── README.md
```

## Quick Setup

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
cp env.example .env   # edit with your config
python -c "from app import app, db; app.app_context().push(); db.create_all()"
python app.py          # runs on http://localhost:5000
```

### 2. Mobile App

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with the Expo Go app on your phone, or press `i` for iOS simulator / `a` for Android emulator.

### 3. Environment Configuration

```bash
# backend/.env
FLASK_ENV=development
DATABASE_URL=sqlite:///quran_app.db

# For Arabic ASR (optional, see backend/RIVA_ARABIC_SETUP.md)
RIVA_API_URL=localhost:50051
RIVA_MODEL_NAME=ar-AR-Conformer-CTC-Large
RIVA_LANGUAGE_CODE=ar-AR
```

## API Endpoints

### Quran Data
- `GET /api/quran/chapters` - List all chapters
- `GET /api/quran/chapters/:id` - Get chapter with verses
- `GET /api/quran/audio/:chapter?verse=:verse&reciter=:reciter` - Get audio URL
- `GET /api/quran/reciters` - List available reciters

### Recitation Analysis
- `POST /api/recitation/start-streaming` - Start analysis session
- `POST /api/recitation/analyze-chunk` - Analyze audio chunk
- `POST /api/recitation/finish-streaming` - Complete analysis

### Progress Tracking
- `GET /api/progress/:userId` - Get user progress
- `GET /api/sessions/:userId` - Get practice sessions

## Technology Stack

**Mobile:** React Native, Expo, React Navigation

**Backend:** Python, Flask, SQLAlchemy, NVIDIA Riva ASR, Al-Quran Cloud API

**Infrastructure:** SQLite, Docker (Riva deployment)

## Resources

- **Riva Setup:** `backend/RIVA_ARABIC_SETUP.md`
- **API Integration:** `QURAN_API_INTEGRATION.md`
- **ML Pipeline:** `IMPROVEMENTS_FROM_TARTEEL.md`

## License

This project is for educational and religious purposes. Please use respectfully.

## Acknowledgments

- Al-Quran Cloud for comprehensive Quran API
- NVIDIA Riva for Arabic ASR technology
- All the reciters for their beautiful recitations
