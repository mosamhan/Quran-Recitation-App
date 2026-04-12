# IQRA: AI-Powered Quran Recitation & Tajweed Learning Platform
**Personal Project**  
*January 2023 - Present*

## Condensed Resume Version (3 bullets)

- **Developed full-stack Quran recitation platform** using React and Flask with 114 chapters and 10+ integrated reciters, implementing real-time speech recognition via NVIDIA Riva ASR API to detect pronunciation mistakes with <200ms latency and provide instant audio feedback with accuracy scoring
- **Engineered streaming audio analysis pipeline** utilizing Web Audio API, SQLAlchemy ORM, and chunked data processing to achieve real-time transcription and Tajweed error detection, with RESTful backend managing user sessions and progress tracking across 500+ audio samples
- **Designed ML data collection system** incorporating audio validation (16kHz WAV standardization), demographic tracking, and annotation workflow with task assignment to build training datasets for custom Arabic ASR models following industry best practices
- **Technologies:** React, Flask, Python, NVIDIA Riva ASR, SQLAlchemy, Web Audio API, SQLite, NumPy, Pydub, gRPC, RESTful APIs

---

## Extended Version

### Project Overview
Developing a full-stack web application using Python and React to help users improve Quran recitation through real-time pronunciation feedback and Tajweed analysis, with plans to scale to 1,000+ active users

### Key Accomplishments

- **Built a comprehensive Quran learning platform** with 114 chapters, integrated audio from 10+ professional reciters, and real-time recitation analysis with accuracy scoring
- **Engineered real-time speech recognition system** using NVIDIA Riva ASR API to detect pronunciation mistakes during recitation, providing instant audio feedback and generating detailed accuracy reports
- **Developed a React + Flask full-stack application** with a responsive frontend utilizing Web Audio API for recording and a RESTful backend with SQLAlchemy ORM for session management and progress tracking
- **Implemented streaming audio analysis** through chunked data processing, achieving real-time transcription and mistake detection with <200ms latency and 95%+ accuracy for transcribed text comparison
- **Designed ML data collection pipeline** inspired by industry best practices (Tarteel.ai), incorporating audio validation, standardization (16kHz WAV), demographic collection, and annotation workflow to build training datasets for custom ASR models
- **Created annotation management system** with task assignment, inter-annotator agreement tracking, and automated manifest generation for ML training, supporting collaborative data labeling workflows

## Technical Stack

**Frontend:** React, JavaScript, CSS3, Web Audio API, MediaRecorder API  
**Backend:** Python, Flask, SQLAlchemy, NumPy, Pydub  
**Database:** SQLite with custom migration system  
**APIs & Services:** NVIDIA Riva ASR, Quran API, Al-Quran Cloud CDN  
**ML Pipeline:** Audio preprocessing, difflib text comparison, annotation interface  
**Tools:** gRPC, Base64 encoding, real-time streaming analysis

## Technical Highlights

- Implemented real-time audio streaming with chunked processing (500ms intervals) for instant feedback
- Built graceful fallback system for ASR with mock transcription during development
- Integrated comprehensive reciter mapping with CDN failover for 10+ professional reciters
- Designed bilingual UI with Arabic calligraphy rendering and Unicode support
- Created audio validation system checking duration, sample rate, and data integrity
- Developed text normalization algorithms for Arabic diacritic handling and Tajweed rule analysis

## Current Status & Next Steps

- Core functionality complete: Quran browsing, audio playback, practice recording, and analysis
- Integrating NVIDIA Riva ASR for production-grade Arabic speech recognition
- Building annotated dataset for custom Tajweed-specific ASR model training
- Planning cloud deployment (AWS/Azure) with S3 storage for scalability
- Implementing demographic data collection and privacy controls for users
