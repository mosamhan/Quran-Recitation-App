# IQRA - Quran Recitation Learning App - Project Summary

## Overview

A mobile application (React Native/Expo) designed to help users learn and improve their Quranic recitation using NVIDIA Riva speech recognition technology. Features age-adaptive themes, structured curriculum, and Tajweed rule feedback.

## Key Features

### 1. Speech Recognition & Analysis
- Integration with NVIDIA Riva for Arabic speech-to-text transcription
- Automatic comparison of user recitation with correct text
- Mistake detection and classification (pronunciation, Tajweed, omissions, additions)

### 2. Progress Tracking
- User profiles with session history
- Memorization tracking for individual verses
- Accuracy scores and statistics
- Common mistakes identification and suggestions

### 3. Age-Adaptive Interface
- Theme system that adapts to user age group (kids, teens, adults)
- Clean navigation with Ionicons
- IQRA branding throughout

### 4. Practice Features
- Browse all 114 chapters with audio playback
- Verse selection with translations
- Real-time feedback after each recitation
- Structured curriculum with guided learning paths

## Technology Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: SQLite (easily upgradeable to PostgreSQL)
- **Speech Recognition**: NVIDIA Riva API
- **ORM**: SQLAlchemy
- **CORS**: Flask-CORS for cross-origin requests

### Mobile
- **Framework**: React Native (Expo)
- **Navigation**: React Navigation
- **HTTP Client**: Axios
- **Icons**: Ionicons via @expo/vector-icons

## Project Structure

```
Quran Recitation Project/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── models.py           # Database models
│   ├── riva_client.py      # NVIDIA Riva integration client
│   ├── quran_api.py        # Al-Quran Cloud API integration
│   ├── requirements.txt    # Python dependencies
│   └── env.example         # Environment variables template
│
├── mobile/
│   ├── App.js              # Root component & navigation
│   ├── src/
│   │   ├── screens/        # App screens
│   │   ├── context/        # React contexts (theme, user)
│   │   ├── services/       # API client
│   │   └── utils/          # Theme & helpers
│   └── package.json        # Node dependencies
│
└── README.md
```

## API Endpoints

### User Management
- `POST /api/users` - Create new user
- `GET /api/users/<id>` - Get user information

### Recitation
- `POST /api/recitation/analyze` - Analyze audio recitation
- `GET /api/verses` - Get all available verses
- `GET /api/verses/<id>` - Get specific verse

### Progress Tracking
- `GET /api/progress/<user_id>` - Get user progress and statistics
- `POST /api/progress/memorize` - Mark verse as memorized
- `GET /api/sessions/<user_id>` - Get user's practice sessions

## Database Schema

### Users
- Stores user profiles and basic information

### RecitationSessions
- Tracks each practice session
- Stores transcribed text, expected text, and accuracy score

### Mistakes
- Records individual mistakes found in recitations
- Includes type, position, and correction suggestions

### Progress
- Tracks memorization status for each verse per user
- Records practice frequency

## Next Steps

1. **NVIDIA Riva Setup** - Deploy and configure Arabic ASR
2. **Database Migration** - PostgreSQL for production
3. **Enhanced Features** - Gamification, social features, offline mode
4. **Security** - JWT auth, rate limiting, input validation
5. **Testing** - Unit, integration, and E2E tests

## License

MIT License - feel free to modify and use for educational purposes.

