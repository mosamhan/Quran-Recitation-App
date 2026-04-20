# IQRA - Project Summary

## Overview

A mobile application (React Native/Expo) designed to help users learn and improve their Quranic recitation using AI-powered Arabic speech recognition. Features Mushaf layout with tajweed color-coding, word-by-word audio tracking, structured curriculum, and progress tracking.

## Key Features

### 1. Quran Reader
- Browse all 114 chapters with difficulty levels
- Mushaf page layout with tajweed-highlighted Arabic text
- Word-by-word audio tracking and highlighting
- Multiple reciters with playback speed control
- Tafsir (commentary) access
- Quran.com API integration for words, translations, and audio segments

### 2. Speech Recognition & Practice
- Real-time audio recording with expo-audio
- NVIDIA Riva or OpenAI Whisper for Arabic speech-to-text
- Automatic comparison of recitation with correct text
- Mistake detection and classification (pronunciation, Tajweed, omissions)

### 3. Progress & Gamification
- XP system with per-verse rewards based on chapter difficulty
- Streak tracking and achievement badges
- Memorization progress per verse
- Accuracy scores and statistics

### 4. Structured Learning
- Guided curriculum with learning paths
- Age-adaptive light/dark themes
- Experience-based onboarding (beginner, intermediate, advanced)

## Technology Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: SQLite (SQLAlchemy ORM)
- **Speech Recognition**: NVIDIA Riva / OpenAI Whisper fallback
- **Quran Data**: Al-Quran Cloud API

### Mobile
- **Framework**: React Native (Expo)
- **Navigation**: React Navigation
- **Quran Data**: Quran.com API (words, translations, audio segments, tajweed)
- **Icons**: Ionicons via @expo/vector-icons

## API Endpoints

### Quran Data
- `GET /api/quran/chapters` - List all chapters with difficulty levels
- `GET /api/quran/chapters/:id` - Get chapter with verses
- `GET /api/quran/audio/:chapter` - Get audio URL
- `GET /api/quran/reciters` - List available reciters

### Recitation Analysis
- `POST /api/recitation/start-streaming` - Start analysis session
- `POST /api/recitation/analyze-chunk` - Analyze audio chunk
- `POST /api/recitation/finish-streaming` - Complete analysis

### Progress
- `GET /api/progress/:userId` - Get user progress
- `GET /api/sessions/:userId` - Get practice sessions
- `GET /api/gamification/stats/:userId` - Get XP, streaks, badges

## License

MIT License - for educational and religious purposes.
