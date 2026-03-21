from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os
from datetime import datetime

from models import db, User, RecitationSession, Mistake, Progress
from demographic_model import DemographicInformation
from auth import generate_token, login_required
from riva_client import RivaClient
from verses import get_all_verses, get_verse
from quran_api import QuranAPIService
from streaming_analyzer import StreamingAnalyzer
from audio_validator import AudioValidator
from tajweed_rules import detect_tajweed_rules, get_all_rules as get_all_tajweed_rules
from gamification import (
    get_gamification_stats, record_practice, get_or_create_streak,
    UserStreak, UserBadge
)
from curriculum import (
    get_curriculum, get_lesson, get_lessons_for_level, compute_user_progress
)

# Optional imports for annotation system (only import if needed)
try:
    from annotation_model import Annotator, Annotation, AnnotationBatch
    from annotation_service import AnnotationService
    from data_preprocessing import DataPreprocessor
    ANNOTATION_SYSTEM_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Annotation system not available: {e}")
    ANNOTATION_SYSTEM_AVAILABLE = False
from datetime import datetime

load_dotenv()

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///quran_app.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

CORS(app)
db.init_app(app)

# Initialize Riva client
riva_client = RivaClient(
    api_url=os.getenv('RIVA_API_URL', 'localhost:50051'),  # Default to gRPC format
    api_key=os.getenv('RIVA_API_KEY'),
    use_ssl=os.getenv('RIVA_USE_SSL', 'false').lower() == 'true',
    model_name=os.getenv('RIVA_MODEL_NAME'),  # Path to .nemo model or model name
    language_code=os.getenv('RIVA_LANGUAGE_CODE', 'ar-AR')  # Arabic language code
)

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'message': 'Quran Recitation API is running'})

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user account"""
    data = request.json
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    display_name = data.get('display_name', '').strip()

    if not all([username, email, password]):
        return jsonify({'error': 'Username, email, and password are required'}), 400

    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(
        username=username,
        email=email,
        display_name=display_name or username
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = generate_token(user.id)
    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Log in with username/email and password"""
    data = request.json
    identifier = data.get('identifier', '').strip()  # username or email
    password = data.get('password', '')

    if not all([identifier, password]):
        return jsonify({'error': 'Username/email and password are required'}), 400

    # Try username first, then email
    user = User.query.filter_by(username=identifier).first()
    if not user:
        user = User.query.filter_by(email=identifier.lower()).first()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = generate_token(user.id)
    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200


@app.route('/api/auth/me', methods=['GET'])
@login_required
def get_current_user():
    """Get the currently authenticated user's profile"""
    user = g.current_user
    return jsonify({
        'user': user.to_dict(),
        'total_sessions': len(user.recitation_sessions),
        'total_verses_memorized': len([p for p in user.progress if p.is_memorized])
    })


@app.route('/api/auth/profile', methods=['PUT'])
@login_required
def update_profile():
    """Update the current user's profile (onboarding + settings)"""
    user = g.current_user
    data = request.json

    if 'display_name' in data:
        user.display_name = data['display_name'].strip()
    if 'age_group' in data:
        if data['age_group'] not in ('child', 'teen', 'adult'):
            return jsonify({'error': 'age_group must be child, teen, or adult'}), 400
        user.age_group = data['age_group']
    if 'experience_level' in data:
        if data['experience_level'] not in ('beginner', 'intermediate', 'advanced'):
            return jsonify({'error': 'experience_level must be beginner, intermediate, or advanced'}), 400
        user.experience_level = data['experience_level']
    if 'onboarding_completed' in data:
        user.onboarding_completed = bool(data['onboarding_completed'])

    db.session.commit()
    return jsonify({'user': user.to_dict()})


# Legacy endpoint - kept for backwards compatibility during migration
@app.route('/api/users', methods=['POST'])
def create_user():
    """Create a new user (legacy - use /api/auth/register instead)"""
    data = request.json
    username = data.get('username')

    if not username:
        return jsonify({'error': 'Username is required'}), 400

    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify(existing_user.to_dict()), 200

    user = User(
        username=username,
        email=f"{username.lower().replace(' ', '_')}@legacy.local",
        display_name=username
    )
    user.set_password('legacy-temp-password')
    db.session.add(user)
    db.session.commit()

    return jsonify(user.to_dict()), 201


@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user information"""
    user = User.query.get_or_404(user_id)
    return jsonify({
        'id': user.id,
        'username': user.username,
        'created_at': user.created_at.isoformat(),
        'total_sessions': len(user.recitation_sessions),
        'total_verses_memorized': len([p for p in user.progress if p.is_memorized])
    })

@app.route('/api/users/<int:user_id>/demographic', methods=['GET', 'POST', 'PUT'])
def user_demographic(user_id):
    """Get, create, or update user demographic information"""
    user = User.query.get_or_404(user_id)
    
    if request.method == 'GET':
        demographic = DemographicInformation.query.filter_by(user_id=user_id).first()
        if demographic:
            return jsonify(demographic.to_dict()), 200
        return jsonify({'message': 'No demographic information found'}), 404
    
    elif request.method in ['POST', 'PUT']:
        data = request.json
        
        demographic = DemographicInformation.query.filter_by(user_id=user_id).first()
        
        if not demographic:
            demographic = DemographicInformation(user_id=user_id)
            db.session.add(demographic)
        
        # Update fields
        if 'gender' in data:
            demographic.gender = data['gender']
        if 'age_range' in data:
            demographic.age_range = data['age_range']
        if 'ethnicity' in data:
            demographic.ethnicity = data['ethnicity']
        if 'native_language' in data:
            demographic.native_language = data['native_language']
        if 'qiraah_style' in data:
            demographic.qiraah_style = data['qiraah_style']
        if 'arabic_proficiency' in data:
            demographic.arabic_proficiency = data['arabic_proficiency']
        if 'years_studying_quran' in data:
            demographic.years_studying_quran = data['years_studying_quran']
        if 'has_formal_tajweed_training' in data:
            demographic.has_formal_tajweed_training = data['has_formal_tajweed_training']
        if 'consent_for_ml_training' in data:
            demographic.consent_for_ml_training = data['consent_for_ml_training']
            if data['consent_for_ml_training']:
                demographic.consent_given_at = datetime.utcnow()
        
        db.session.commit()
        return jsonify(demographic.to_dict()), 200

# Store active streaming analyzers per user
active_analyzers = {}

@app.route('/api/recitation/start-streaming', methods=['POST'])
def start_streaming_analysis():
    """Start a real-time streaming analysis session"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        user_id = data.get('user_id')
        expected_text = data.get('expected_text')
        verse_id = data.get('verse_id')
        
        print(f"Starting streaming session - user_id: {user_id}, verse_id: {verse_id}")
        print(f"Expected text length: {len(expected_text) if expected_text else 0}")
        
        if not all([user_id, expected_text]):
            missing = []
            if not user_id:
                missing.append('user_id')
            if not expected_text:
                missing.append('expected_text')
            return jsonify({'error': f'Missing required fields: {", ".join(missing)}'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': f'User {user_id} not found'}), 404
        
        # Create streaming analyzer
        try:
            analyzer = StreamingAnalyzer(riva_client)
            analyzer.set_expected_text(expected_text)
        except Exception as e:
            print(f"Error creating StreamingAnalyzer: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': f'Error creating analyzer: {str(e)}'}), 500
        
        # Store analyzer for this session
        session_key = f"{user_id}_{verse_id}"
        active_analyzers[session_key] = analyzer
        
        print(f"Streaming session started successfully: {session_key}")
        
        return jsonify({
            'session_key': session_key,
            'status': 'started',
            'expected_words': analyzer.expected_words,
            'word_statuses': analyzer.word_statuses,
        }), 200
        
    except Exception as e:
        print(f"Error in start_streaming_analysis: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/recitation/analyze-chunk', methods=['POST'])
def analyze_chunk():
    """Analyze an audio chunk in real-time"""
    try:
        data = request.json
        session_key = data.get('session_key')
        audio_chunk = data.get('audio_chunk')  # Base64 encoded audio chunk
        
        print(f"Analyzing chunk for session: {session_key}")
        
        if not all([session_key, audio_chunk]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if session_key not in active_analyzers:
            print(f"Session key {session_key} not found in active_analyzers")
            print(f"Active sessions: {list(active_analyzers.keys())}")
            return jsonify({'error': 'Session not found'}), 404
        
        analyzer = active_analyzers[session_key]
        result = analyzer.analyze_chunk(audio_chunk)
        
        print(f"Chunk analysis result: has_mistake={result.get('has_mistake')}, progress={result.get('progress')}")
        
        return jsonify(result), 200
    except Exception as e:
        print(f"Error in analyze_chunk: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/recitation/finish-streaming', methods=['POST'])
def finish_streaming_analysis():
    """Finish streaming analysis and get final results"""
    data = request.json
    session_key = data.get('session_key')
    user_id = data.get('user_id')
    verse_id = data.get('verse_id')
    audio_data = data.get('audio_data')  # Final complete audio recording
    client_session_id = data.get('client_session_id')
    platform = data.get('platform', 'web')
    
    if not all([session_key, user_id]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    if session_key not in active_analyzers:
        return jsonify({'error': 'Session not found'}), 404
    
    analyzer = active_analyzers[session_key]
    user = User.query.get_or_404(user_id)
    
    try:
        print(f"Finishing streaming analysis for session: {session_key}")
        
        # Get final transcription and accuracy
        final_transcription = analyzer.current_transcription
        print(f"Final transcription: {final_transcription}")
        
        accuracy = analyzer.get_final_accuracy()
        print(f"Final accuracy: {accuracy}")
        
        mistakes = analyzer.get_all_mistakes()
        print(f"Total mistakes: {len(mistakes)}")
        
        # Validate and process audio if provided
        audio_file_path = None
        audio_metadata = None
        
        if audio_data:
            # Validate audio (but don't fail if FFmpeg is not available)
            is_valid, error_msg, metadata = AudioValidator.validate_audio_base64(audio_data)
            if not is_valid:
                # If validation failed due to FFmpeg not being available, continue anyway
                if metadata and metadata.get('validation_skipped'):
                    print(f"Warning: Audio validation skipped: {error_msg}")
                    audio_metadata = metadata
                else:
                    return jsonify({'error': f'Invalid audio: {error_msg}'}), 400
            else:
                audio_metadata = metadata
            
            # Check if user consented to ML training
            demographic = DemographicInformation.query.filter_by(user_id=user_id).first()
            should_store_audio = demographic and demographic.consent_for_ml_training
            
            if should_store_audio:
                # Standardize audio for ML training
                success, error_msg, standardized_audio = AudioValidator.standardize_audio(audio_data)
                if success:
                    # Create recordings directory if it doesn't exist
                    recordings_dir = os.path.join(os.getcwd(), 'recordings')
                    os.makedirs(recordings_dir, exist_ok=True)
                    
                    # Generate filename using UUID
                    import uuid
                    file_uuid = str(uuid.uuid4())
                    chapter_num, verse_num = verse_id.split(':') if ':' in verse_id else ('0', '0')
                    filename = f"{chapter_num}_{verse_num}_{file_uuid}.wav"
                    file_path = os.path.join(recordings_dir, filename)
                    
                    # Save audio file
                    with open(file_path, 'wb') as f:
                        f.write(standardized_audio)
                    
                    audio_file_path = file_path
        
        # Create recitation session
        session = RecitationSession(
            user_id=user_id,
            verse_id=verse_id or 'unknown',
            transcribed_text=final_transcription,
            expected_text=analyzer.expected_text,
            accuracy_score=accuracy,
            session_id=client_session_id,
            platform=platform,
            audio_file_path=audio_file_path,
            audio_duration_ms=audio_metadata.get('duration_ms') if audio_metadata else None,
            audio_sample_rate=audio_metadata.get('sample_rate') if audio_metadata else None,
            audio_channels=audio_metadata.get('channels') if audio_metadata else None
        )
        db.session.add(session)
        db.session.flush()
        
        # Save mistakes
        for mistake in mistakes:
            mistake_record = Mistake(
                session_id=session.id,
                mistake_type=mistake.get('type', 'pronunciation'),
                position=mistake.get('position', 0),
                incorrect_text=mistake.get('incorrect', ''),
                correct_text=mistake.get('correct', ''),
                suggestion=mistake.get('suggestion', '')
            )
            db.session.add(mistake_record)
        
        db.session.commit()
        
        # Clean up analyzer
        del active_analyzers[session_key]

        # Record gamification (XP, streaks, badges)
        gamification_result = record_practice(user_id, accuracy)

        return jsonify({
            'session_id': session.id,
            'transcription': final_transcription,
            'expected_text': analyzer.expected_text,
            'accuracy': accuracy,
            'mistakes': mistakes,
            'feedback': riva_client.generate_feedback(mistakes, accuracy),
            'gamification': gamification_result,
        }), 200
        
    except Exception as e:
        # Clean up on error
        if session_key in active_analyzers:
            del active_analyzers[session_key]
        return jsonify({'error': str(e)}), 500

@app.route('/api/recitation/analyze', methods=['POST'])
def analyze_recitation():
    """Legacy endpoint - Analyze a complete recitation after recording"""
    data = request.json
    user_id = data.get('user_id')
    audio_data = data.get('audio_data')  # Base64 encoded audio
    expected_text = data.get('expected_text')  # The correct verse text
    verse_id = data.get('verse_id')
    
    if not all([user_id, audio_data, expected_text]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    user = User.query.get_or_404(user_id)
    
    try:
        # Use Riva to transcribe the audio
        transcription = riva_client.transcribe_audio(audio_data)
        
        # Compare with expected text and identify mistakes
        mistakes = riva_client.compare_recitation(transcription, expected_text)
        
        # Calculate accuracy score
        accuracy = riva_client.calculate_accuracy(transcription, expected_text)
        
        # Create recitation session
        session = RecitationSession(
            user_id=user_id,
            verse_id=verse_id or 'unknown',
            transcribed_text=transcription,
            expected_text=expected_text,
            accuracy_score=accuracy
        )
        db.session.add(session)
        db.session.flush()
        
        # Save mistakes
        for mistake in mistakes:
            mistake_record = Mistake(
                session_id=session.id,
                mistake_type=mistake.get('type', 'pronunciation'),
                position=mistake.get('position', 0),
                incorrect_text=mistake.get('incorrect', ''),
                correct_text=mistake.get('correct', ''),
                suggestion=mistake.get('suggestion', '')
            )
            db.session.add(mistake_record)
        
        db.session.commit()
        
        return jsonify({
            'session_id': session.id,
            'transcription': transcription,
            'expected_text': expected_text,
            'accuracy': accuracy,
            'mistakes': mistakes,
            'feedback': riva_client.generate_feedback(mistakes, accuracy)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/progress/<int:user_id>', methods=['GET'])
def get_progress(user_id):
    """Get user's progress and statistics"""
    user = User.query.get_or_404(user_id)
    
    sessions = RecitationSession.query.filter_by(user_id=user_id).all()
    total_sessions = len(sessions)
    average_accuracy = sum(s.accuracy_score for s in sessions) / total_sessions if total_sessions > 0 else 0
    
    # Get memorized verses
    memorized_verses = Progress.query.filter_by(
        user_id=user_id,
        is_memorized=True
    ).all()
    
    # Get recent mistakes
    recent_mistakes = db.session.query(Mistake).join(RecitationSession).filter(
        RecitationSession.user_id == user_id
    ).order_by(Mistake.created_at.desc()).limit(10).all()
    
    return jsonify({
        'user_id': user_id,
        'total_sessions': total_sessions,
        'average_accuracy': round(average_accuracy, 2),
        'verses_memorized': len(memorized_verses),
        'recent_mistakes': [
            {
                'type': m.mistake_type,
                'incorrect': m.incorrect_text,
                'correct': m.correct_text,
                'suggestion': m.suggestion,
                'date': m.created_at.isoformat()
            }
            for m in recent_mistakes
        ]
    })

@app.route('/api/progress/memorize', methods=['POST'])
def mark_memorized():
    """Mark a verse as memorized"""
    data = request.json
    user_id = data.get('user_id')
    verse_id = data.get('verse_id')
    
    if not all([user_id, verse_id]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if already exists
    existing = Progress.query.filter_by(
        user_id=user_id,
        verse_id=verse_id
    ).first()
    
    if existing:
        existing.is_memorized = True
        existing.last_practiced = datetime.utcnow()
    else:
        progress = Progress(
            user_id=user_id,
            verse_id=verse_id,
            is_memorized=True
        )
        db.session.add(progress)
    
    db.session.commit()
    return jsonify({'message': 'Verse marked as memorized'}), 200

@app.route('/api/sessions/<int:user_id>', methods=['GET'])
def get_sessions(user_id):
    """Get all recitation sessions for a user"""
    sessions = RecitationSession.query.filter_by(user_id=user_id).order_by(
        RecitationSession.created_at.desc()
    ).limit(50).all()
    
    return jsonify({
        'sessions': [
            {
                'id': s.id,
                'verse_id': s.verse_id,
                'accuracy': s.accuracy_score,
                'date': s.created_at.isoformat(),
                'mistakes_count': len(s.mistakes)
            }
            for s in sessions
        ]
    })

@app.route('/api/verses', methods=['GET'])
def get_verses():
    """Get all available verses for practice"""
    verses = get_all_verses()
    return jsonify({'verses': verses})

@app.route('/api/verses/<verse_id>', methods=['GET'])
def get_verse_by_id(verse_id):
    """Get a specific verse by ID (legacy - for sample verses)"""
    verse = get_verse(verse_id)
    if not verse:
        return jsonify({'error': 'Verse not found'}), 404
    return jsonify(verse)

# New Quran API endpoints
@app.route('/api/quran/chapters', methods=['GET'])
def get_quran_chapters():
    """Get all 114 chapters of the Quran"""
    chapters = QuranAPIService.get_all_chapters()
    return jsonify({'chapters': chapters})

@app.route('/api/quran/chapters/<int:chapter_number>', methods=['GET'])
def get_quran_chapter(chapter_number):
    """Get a specific chapter with all its verses"""
    translation = request.args.get('translation', 'en.sahih')
    chapter = QuranAPIService.get_chapter(chapter_number, translation)
    if not chapter:
        return jsonify({'error': 'Chapter not found'}), 404
    return jsonify(chapter)

@app.route('/api/quran/verses/<int:chapter_number>/<int:verse_number>', methods=['GET'])
def get_quran_verse(chapter_number, verse_number):
    """Get a specific verse from the Quran"""
    translation = request.args.get('translation', 'en.sahih')
    verse = QuranAPIService.get_verse(chapter_number, verse_number, translation)
    if not verse:
        return jsonify({'error': 'Verse not found'}), 404
    return jsonify(verse)

@app.route('/api/quran/audio/<int:chapter_number>', methods=['GET'])
def get_chapter_audio(chapter_number):
    """Get audio URL for a chapter or verse"""
    verse_number = request.args.get('verse', type=int)
    reciter = request.args.get('reciter', 'alafasy')
    absolute_verse_number = request.args.get('absolute_number', type=int)
    
    try:
        # If absolute verse number is provided, use it directly
        if absolute_verse_number:
            # Use the mapping from quran_api.py which handles fallbacks
            from quran_api import QuranAPIService
            audio_url = QuranAPIService.get_audio_url(chapter_number, verse_number, reciter)
            
            if not audio_url:
                # Fallback: use direct mapping with confirmed working reciters
                reciter_map = {
                    'alafasy': 'ar.alafasy',
                    'abu_bakr_ash_shaatree': 'ar.shaatree',
                    'ahmed_ibn_ali_al_ajamy': 'ar.ahmedajamy',
                    'hudhaify': 'ar.hudhaify',
                    'husary': 'ar.husary',
                    'husary_mujawwad': 'ar.husarymujawwad',
                    'maher_al_muaiqly': 'ar.mahermuaiqly',
                    'muhammad_ayyoub': 'ar.muhammadayyoub',
                    'muhammad_jibreel': 'ar.muhammadjibreel',
                }
                cdn_reciter = reciter_map.get(reciter, 'ar.alafasy')
                print(f"Generating audio URL for reciter: {reciter} -> {cdn_reciter}, verse: {absolute_verse_number}")
                audio_url = f"https://cdn.islamic.network/quran/audio/128/{cdn_reciter}/{absolute_verse_number}.mp3"
        else:
            audio_url = QuranAPIService.get_audio_url(chapter_number, verse_number, reciter)
        
        if not audio_url:
            return jsonify({'error': 'Audio not available'}), 404
        return jsonify({'audio_url': audio_url, 'reciter': reciter})
    except Exception as e:
        print(f"Error getting audio URL: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/quran/reciters', methods=['GET'])
def get_reciters():
    """Get list of available reciters"""
    reciters = QuranAPIService.get_available_reciters()
    return jsonify({'reciters': reciters})

# ==================== Tajweed Endpoints ====================

@app.route('/api/tajweed/rules', methods=['GET'])
def get_tajweed_rules():
    """Get all tajweed rule definitions (for legend/UI)"""
    return jsonify({'rules': get_all_tajweed_rules()})


@app.route('/api/tajweed/analyze', methods=['POST'])
def analyze_tajweed():
    """Detect tajweed rules in a given Arabic text"""
    data = request.json
    text = data.get('text', '')
    if not text:
        return jsonify({'error': 'text is required'}), 400

    rules = detect_tajweed_rules(text)
    return jsonify({
        'text': text,
        'rules': rules
    })


# ==================== Gamification Endpoints ====================

@app.route('/api/gamification/stats/<int:user_id>', methods=['GET'])
def gamification_stats(user_id):
    """Get full gamification profile: XP, level, streak, badges."""
    User.query.get_or_404(user_id)
    stats = get_gamification_stats(user_id)
    return jsonify(stats)


@app.route('/api/gamification/badges', methods=['GET'])
def all_badges():
    """Get all possible badge definitions."""
    from gamification import BADGE_DEFINITIONS
    return jsonify({'badges': BADGE_DEFINITIONS})


# ==================== Curriculum Endpoints ====================

@app.route('/api/curriculum', methods=['GET'])
def curriculum_overview():
    """Return the full curriculum with user progress if user_id provided."""
    user_id = request.args.get('user_id', type=int)
    raw = get_curriculum()

    # Build a serialisable copy with optional progress overlay
    progress = {}
    if user_id:
        progress = compute_user_progress(user_id, db.session)

    result = {}
    for level, data in raw.items():
        lessons = []
        for lesson in data['lessons']:
            lp = progress.get(lesson['id'], {})
            lessons.append({
                **lesson,
                'status': lp.get('status', 'locked'),
                'verses_completed': lp.get('verses_completed', 0),
                'verses_total': lp.get('verses_total', 0),
            })
        result[level] = {
            'title': data['title'],
            'title_child': data.get('title_child', data['title']),
            'description': data['description'],
            'lessons': lessons,
        }
    return jsonify(result)


@app.route('/api/curriculum/lesson/<lesson_id>', methods=['GET'])
def curriculum_lesson(lesson_id):
    """Return a single lesson with user progress."""
    lesson = get_lesson(lesson_id)
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404

    user_id = request.args.get('user_id', type=int)
    progress = {}
    if user_id:
        all_progress = compute_user_progress(user_id, db.session)
        progress = all_progress.get(lesson_id, {})

    return jsonify({
        **lesson,
        'status': progress.get('status', 'locked'),
        'verses_completed': progress.get('verses_completed', 0),
        'verses_total': progress.get('verses_total', 0),
    })


# ==================== Annotation Endpoints ====================
# Based on Tarteel's ML Journey Part 2

@app.route('/api/annotators', methods=['GET', 'POST'])
def manage_annotators():
    """Get list of annotators or create new annotator"""
    if not ANNOTATION_SYSTEM_AVAILABLE:
        return jsonify({'error': 'Annotation system not available'}), 503
    
    if request.method == 'GET':
        status = request.args.get('status', 'active')
        annotators = Annotator.query.filter_by(status=status).all()
        return jsonify([a.to_dict() for a in annotators]), 200
    
    elif request.method == 'POST':
        data = request.json
        annotator = Annotator(
            name=data.get('name'),
            email=data.get('email'),
            phone=data.get('phone'),
            arabic_proficiency=data.get('arabic_proficiency'),
            has_tajweed_training=data.get('has_tajweed_training', False),
            qiraah_style=data.get('qiraah_style'),
            status=data.get('status', 'training'),
            is_manager=data.get('is_manager', False)
        )
        db.session.add(annotator)
        db.session.commit()
        return jsonify(annotator.to_dict()), 201

@app.route('/api/annotators/<int:annotator_id>', methods=['GET', 'PUT'])
def annotator_detail(annotator_id):
    """Get or update annotator details"""
    if not ANNOTATION_SYSTEM_AVAILABLE:
        return jsonify({'error': 'Annotation system not available'}), 503
    
    annotator = Annotator.query.get_or_404(annotator_id)
    
    if request.method == 'GET':
        return jsonify(annotator.to_dict()), 200
    
    elif request.method == 'PUT':
        data = request.json
        if 'name' in data:
            annotator.name = data['name']
        if 'email' in data:
            annotator.email = data['email']
        if 'status' in data:
            annotator.status = data['status']
        if 'is_manager' in data:
            annotator.is_manager = data['is_manager']
        
        db.session.commit()
        return jsonify(annotator.to_dict()), 200

@app.route('/api/annotations', methods=['POST'])
def create_annotation():
    """Create a new annotation for a recitation session"""
    if not ANNOTATION_SYSTEM_AVAILABLE:
        return jsonify({'error': 'Annotation system not available'}), 503
    
    data = request.json
    session_id = data.get('session_id')
    annotator_id = data.get('annotator_id')
    
    if not all([session_id, annotator_id]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    session = RecitationSession.query.get_or_404(session_id)
    annotator = Annotator.query.get_or_404(annotator_id)
    
    # Check if annotation already exists
    existing = Annotation.query.filter_by(
        session_id=session_id,
        annotator_id=annotator_id
    ).first()
    
    if existing:
        return jsonify({'error': 'Annotation already exists'}), 400
    
    annotation = Annotation(
        session_id=session_id,
        annotator_id=annotator_id,
        is_correct=data.get('is_correct', False),
        is_complete=data.get('is_complete', True),
        has_proper_tashkeel=data.get('has_proper_tashkeel'),
        transcribed_text=data.get('transcribed_text'),
        corrected_text=data.get('corrected_text'),
        notes=data.get('notes'),
        audio_quality=data.get('audio_quality'),
        has_background_noise=data.get('has_background_noise', False),
        is_clear=data.get('is_clear', True),
        status='completed'
    )
    
    db.session.add(annotation)
    
    # Update annotator stats
    annotator.total_annotations += 1
    
    db.session.commit()
    
    return jsonify(annotation.to_dict()), 201

@app.route('/api/annotations/next-task', methods=['GET'])
def get_next_annotation_task():
    """Get next unannotated session for an annotator"""
    if not ANNOTATION_SYSTEM_AVAILABLE:
        return jsonify({'error': 'Annotation system not available'}), 503
    
    annotator_id = request.args.get('annotator_id', type=int)
    
    if not annotator_id:
        return jsonify({'error': 'annotator_id is required'}), 400
    
    task = AnnotationService.get_next_annotation_task(annotator_id)
    
    if not task:
        return jsonify({'message': 'No more tasks available'}), 404
    
    return jsonify(task), 200

@app.route('/api/annotations/stats', methods=['GET'])
def annotation_statistics():
    """Get annotation statistics"""
    if not ANNOTATION_SYSTEM_AVAILABLE:
        return jsonify({'error': 'Annotation system not available'}), 503
    
    stats = AnnotationService.get_annotation_statistics()
    return jsonify(stats), 200

@app.route('/api/annotation/batches', methods=['GET', 'POST'])
def manage_batches():
    """Get annotation batches or create new batch"""
    if not ANNOTATION_SYSTEM_AVAILABLE:
        return jsonify({'error': 'Annotation system not available'}), 503
    
    if request.method == 'GET':
        batches = AnnotationBatch.query.all()
        return jsonify([b.to_dict() for b in batches]), 200
    
    elif request.method == 'POST':
        data = request.json
        batch = AnnotationBatch(
            name=data.get('name'),
            description=data.get('description'),
            total_sessions=data.get('total_sessions', 0),
            priority=data.get('priority', 'normal')
        )
        db.session.add(batch)
        db.session.commit()
        return jsonify(batch.to_dict()), 201

@app.route('/api/training/manifest', methods=['POST'])
def generate_training_manifest():
    """Generate training manifest file (JSONL format)"""
    if not ANNOTATION_SYSTEM_AVAILABLE:
        return jsonify({'error': 'Annotation system not available'}), 503
    
    data = request.json or {}
    session_ids = data.get('session_ids')  # Optional: specific sessions
    output_format = data.get('format', 'jsonl')
    
    try:
        filepath = AnnotationService.create_training_manifest(
            session_ids=session_ids,
            output_format=output_format
        )
        
        return jsonify({
            'filepath': filepath,
            'filename': os.path.basename(filepath),
            'message': 'Training manifest generated successfully'
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/training/preprocess', methods=['POST'])
def preprocess_audio():
    """Preprocess audio files for training"""
    if not ANNOTATION_SYSTEM_AVAILABLE:
        return jsonify({'error': 'Annotation system not available'}), 503
    
    data = request.json
    input_dir = data.get('input_dir')
    output_dir = data.get('output_dir')
    sample_rate = data.get('sample_rate', 16000)
    channels = data.get('channels', 1)
    format = data.get('format', 'wav')
    extension = data.get('extension', 'webm')
    
    if not all([input_dir, output_dir]):
        return jsonify({'error': 'input_dir and output_dir are required'}), 400
    
    result = DataPreprocessor.batch_convert_audio(
        input_dir=input_dir,
        output_dir=output_dir,
        sample_rate=sample_rate,
        channels=channels,
        format=format,
        extension=extension
    )
    
    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify(result), 500

@app.route('/api/training/validate', methods=['POST'])
def validate_dataset():
    """Validate training dataset manifest"""
    if not ANNOTATION_SYSTEM_AVAILABLE:
        return jsonify({'error': 'Annotation system not available'}), 503
    
    data = request.json
    manifest_path = data.get('manifest_path')
    
    if not manifest_path:
        return jsonify({'error': 'manifest_path is required'}), 400
    
    result = DataPreprocessor.validate_training_dataset(manifest_path)
    return jsonify(result), 200

@app.route('/api/training/stats', methods=['POST'])
def dataset_statistics():
    """Get statistics about training dataset"""
    if not ANNOTATION_SYSTEM_AVAILABLE:
        return jsonify({'error': 'Annotation system not available'}), 503
    
    data = request.json
    manifest_path = data.get('manifest_path')
    
    if not manifest_path:
        return jsonify({'error': 'manifest_path is required'}), 400
    
    stats = DataPreprocessor.get_dataset_statistics(manifest_path)
    return jsonify(stats), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)

