# IQRA - Quran Recitation Learning App

A mobile application built with React Native (Expo) to help users learn and improve their Quranic recitation using AI-powered Arabic speech recognition. Features Mushaf layout, tajweed color-coding, word-by-word audio tracking, and structured curriculum.

## Project Structure

```
├── backend/                     # Flask API server
│   ├── app.py                   # Application entry point
│   ├── models.py                # Database models
│   ├── requirements.txt
│   ├── env.example
│   ├── api/                     # External API integrations
│   │   ├── quran_api.py         # Al-Quran Cloud API
│   │   └── auth.py              # JWT authentication
│   ├── services/                # Business logic
│   │   ├── riva_client.py       # NVIDIA Riva / Whisper ASR
│   │   ├── streaming_analyzer.py
│   │   ├── audio_validator.py
│   │   ├── gamification.py      # XP, streaks, badges
│   │   ├── curriculum.py        # Learning paths
│   │   └── tajweed_rules.py     # Tajweed detection
│   ├── ml/                      # ML / annotation pipeline
│   │   ├── annotation_model.py
│   │   ├── annotation_service.py
│   │   ├── data_preprocessing.py
│   │   └── demographic_model.py
│   ├── data/
│   │   └── verses.py
│   ├── scripts/
│   │   ├── init_db.py
│   │   └── migrate_db.py
│   ├── tests/
│   │   └── test_reciters.py
│   └── docs/
│       ├── RIVA_SETUP.md
│       └── RIVA_ARABIC_SETUP.md
│
├── mobile/                      # React Native (Expo) app
│   ├── App.js                   # Root component & navigation
│   ├── src/
│   │   ├── screens/             # App screens
│   │   ├── components/          # Reusable UI components
│   │   ├── context/             # React contexts
│   │   ├── services/            # API client
│   │   ├── data/                # Static data (Quran metadata)
│   │   └── utils/               # Theme & helpers
│   └── package.json
│
├── docs/                        # Project documentation
│   ├── SETUP.md
│   ├── PROJECT_SUMMARY.md
│   ├── QURAN_API_INTEGRATION.md
│   ├── ANNOTATION_SYSTEM.md
│   ├── IMPROVEMENTS_FROM_TARTEEL.md
│   └── RESUME_DESCRIPTION.md
│
└── README.md
```

## Quick Start

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp env.example .env              # edit with your config
python scripts/init_db.py
python app.py                    # runs on http://localhost:8000
```

### Mobile App

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go, or press `i` / `a` for simulators.

## Tech Stack

**Mobile:** React Native, Expo, React Navigation, Quran.com API

**Backend:** Python, Flask, SQLAlchemy, NVIDIA Riva / OpenAI Whisper, Al-Quran Cloud API

**Infrastructure:** SQLite, Docker (Riva deployment)

## Documentation

See the `docs/` directory for detailed guides:
- [Setup Guide](docs/SETUP.md)
- [Quran API Integration](docs/QURAN_API_INTEGRATION.md)
- [Riva ASR Setup](backend/docs/RIVA_SETUP.md)
- [ML Pipeline Notes](docs/IMPROVEMENTS_FROM_TARTEEL.md)
