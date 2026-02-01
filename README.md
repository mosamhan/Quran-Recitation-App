# Quick Start Guide - Quran Recitation App

## Overview

A modern web application for Quran recitation with real-time pronunciation analysis using NVIDIA Riva Arabic ASR.

## Features

- 📖 Browse all 114 chapters of the Quran
- 🎧 Listen to recitations from 20 verified reciters
- 🎤 Practice recitation with real-time feedback
- 📊 Track your progress and accuracy
- 🤖 AI-powered Arabic speech recognition
- ✨ Beautiful, responsive UI

## Quick Setup (5 minutes)

### 1. Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy and edit the environment file:
```bash
cd backend
cp .env.example .env
nano .env
```

**Minimum configuration:**
```bash
# For basic functionality (without ASR)
FLASK_ENV=development
DATABASE_URL=sqlite:///quran_app.db

# For Arabic ASR (optional, see RIVA_ARABIC_SETUP.md)
RIVA_API_URL=localhost:50051
RIVA_MODEL_NAME=ar-AR-Conformer-CTC-Large
RIVA_LANGUAGE_CODE=ar-AR
```

### 3. Initialize Database

```bash
cd backend
python -c "from app import app, db; app.app_context().push(); db.create_all(); print('✓ Database initialized')"
```

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# App opens at http://localhost:3000
```

### 5. Test It Out

1. Open http://localhost:3000 in your browser
2. Create an account (just pick a username)
3. Browse Quran chapters
4. Select a reciter and listen to verses
5. Try the Practice page to test recording

## Available Reciters (9 Total - All Verified ✓)

All reciters tested and confirmed working with cdn.islamic.network (2026-01-25):

1. Abu Bakr Ash-Shaatree
2. Ahmed ibn Ali al-Ajamy
3. Ali Al-Hudhaify
4. Maher Al Muaiqly
5. Mahmoud Khalil Al-Husary
6. Mahmoud Khalil Al-Husary (Mujawwad)
7. Mishary Rashid Alafasy ⭐ (default)
8. Muhammad Ayyoub
9. Muhammad Jibreel

**Note:** These are the only reciters with working verse-by-verse audio on the CDN. While the Al-Quran Cloud API lists more reciters, many don't have individual verse audio available.

## Project Structure

```
Quran Recitation Project/
├── backend/                          # Flask API server
│   ├── app.py                       # Main application
│   ├── riva_client.py               # NVIDIA Riva ASR client
│   ├── quran_api.py                 # Al-Quran Cloud API integration
│   ├── streaming_analyzer.py        # Real-time analysis
│   ├── models.py                    # Database models
│   ├── .env                         # Configuration
│   ├── requirements.txt             # Python dependencies
│   ├── RIVA_ARABIC_SETUP.md        # Riva setup guide
│   └── Conformer CTC Large Model.nemo  # Arabic ASR model
│
├── frontend/                         # React application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── QuranPage.js        # Browse & listen
│   │   │   ├── PracticePage.js     # Record & analyze
│   │   │   └── ProgressPage.js     # Track progress
│   │   ├── components/
│   │   │   ├── FloatingAudioPlayer.js
│   │   │   ├── ReciterModal.js
│   │   │   └── ChapterVerseSelector.js
│   │   └── services/
│   │       └── api.js              # API client
│   └── package.json
│
├── PROJECT_IMPROVEMENTS.md          # Summary of changes
└── README.md                        # This file
```

## Usage Guide

### Browsing the Quran

1. Navigate to the "Quran" tab
2. Chapters load automatically
3. Click any chapter to see verses
4. Click a verse to select it
5. Audio player appears at bottom
6. Use ⏮️ and ⏭️ to navigate verses
7. Click 🔄 to change reciter

### Practicing Recitation

1. Navigate to the "Practice" tab
2. Click "Select Chapter & Verse"
3. Choose chapter, then verse
4. Click "Start Recording"
5. Recite the verse clearly
6. Click "Stop Recording"
7. View your accuracy score and mistakes

**Tips for best results:**
- Speak clearly in Arabic
- Minimize background noise
- Use a good microphone
- Follow proper Tajweed rules

### Tracking Progress

1. Navigate to the "Progress" tab
2. View your statistics:
   - Total practice sessions
   - Average accuracy
   - Verses memorized
   - Recent mistakes
3. Identify areas for improvement

## Advanced: Enable Real Arabic ASR

For full pronunciation analysis, set up NVIDIA Riva:

1. Follow the comprehensive guide: `backend/RIVA_ARABIC_SETUP.md`
2. Key requirements:
   - NVIDIA GPU (8GB+ VRAM)
   - Docker & NVIDIA Container Toolkit
   - NGC account (free)
3. Estimated setup time: 30-60 minutes

**Without Riva:** App works but uses mock transcription (0% accuracy shown)  
**With Riva:** Real Arabic speech recognition and accurate feedback

## API Endpoints

### Quran Data
- `GET /api/quran/chapters` - List all chapters
- `GET /api/quran/chapters/:id` - Get chapter with verses
- `GET /api/quran/audio/:chapter?verse=:verse&reciter=:reciter` - Get audio URL
- `GET /api/quran/reciters` - List available reciters

### Recitation Analysis
- `POST /api/recitation/start-streaming` - Start analysis session
- `POST /api/recitation/analyze-chunk` - Analyze audio chunk (real-time)
- `POST /api/recitation/finish-streaming` - Complete analysis

### Progress Tracking
- `GET /api/progress/:userId` - Get user progress
- `GET /api/sessions/:userId` - Get practice sessions

## Troubleshooting

### Backend won't start
```bash
# Check Python version (3.8+ required)
python --version

# Reinstall dependencies
pip install -r requirements.txt

# Check for port conflicts
lsof -i :5000
```

### Frontend won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version (14+ required)
node --version
```

### Audio not playing
- Check browser console for errors
- Verify reciter is in the list of 20 verified reciters
- Try a different reciter (Alafasy is most reliable)
- Check internet connection (audio streams from CDN)

### Recording not working
- Allow microphone access in browser
- Check browser console for errors
- Verify microphone works in other apps
- Try Chrome/Firefox (best compatibility)

### 0% accuracy shown
This is normal without Riva ASR configured. The app is working correctly but using mock transcription. To get real accuracy:
1. Set up Riva following `RIVA_ARABIC_SETUP.md`
2. Or use the app for listening and browsing (ASR optional)

## Development

### Running Tests
```bash
# Backend
cd backend
python -m pytest

# Frontend
cd frontend
npm test
```

### Code Style
```bash
# Backend (Python)
pip install black pylint
black backend/
pylint backend/

# Frontend (JavaScript)
npm run lint
npm run format
```

### Database Migrations
```bash
cd backend
python migrate_db.py
```

## Technology Stack

**Backend:**
- Python 3.8+
- Flask (web framework)
- SQLAlchemy (ORM)
- NVIDIA Riva (ASR)
- Al-Quran Cloud API

**Frontend:**
- React 18
- React Router
- Axios
- Web Audio API
- MediaRecorder API

**Infrastructure:**
- SQLite (database)
- Docker (Riva deployment)
- nginx (production serving)

## Contributing

Contributions welcome! Areas to improve:
- Additional reciters
- Better UI/UX
- Tajweed rule detection
- Mobile app
- Offline mode
- Additional languages

## Resources

- **Project Documentation:** See `PROJECT_IMPROVEMENTS.md`
- **Riva Setup:** See `backend/RIVA_ARABIC_SETUP.md`
- **API Integration:** See `QURAN_API_INTEGRATION.md`
- **ML Pipeline:** See `IMPROVEMENTS_FROM_TARTEEL.md`

## License

This project is for educational and religious purposes. Please use respectfully.

## Support

For issues or questions:
1. Check documentation files
2. Review troubleshooting section
3. Check console logs for errors
4. Verify configuration in `.env`

## Acknowledgments

- Al-Quran Cloud for comprehensive Quran API
- NVIDIA Riva for Arabic ASR technology
- All the reciters for their beautiful recitations
- The Muslim community for inspiration

---

**May this project benefit those learning and reciting the Quran. Ameen. 🤲**
