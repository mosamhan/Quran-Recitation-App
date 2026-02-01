from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(db.Model):
    """User model for tracking learners"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    recitation_sessions = db.relationship('RecitationSession', backref='user', lazy=True)
    progress = db.relationship('Progress', backref='user', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'created_at': self.created_at.isoformat()
        }

class RecitationSession(db.Model):
    """Model for tracking each recitation attempt"""
    __tablename__ = 'recitation_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    # UUID for unique identification and file naming
    uuid = db.Column(db.String(36), unique=True, default=lambda: str(uuid.uuid4()), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    verse_id = db.Column(db.String(100), nullable=False)
    transcribed_text = db.Column(db.Text, nullable=False)
    expected_text = db.Column(db.Text, nullable=False)
    accuracy_score = db.Column(db.Float, nullable=False)
    
    # Audio file storage (for future ML training)
    audio_file_path = db.Column(db.String(500), nullable=True)  # Path to stored audio file
    audio_duration_ms = db.Column(db.Integer, nullable=True)  # Duration in milliseconds
    audio_sample_rate = db.Column(db.Integer, nullable=True)  # Sample rate (e.g., 16000)
    audio_channels = db.Column(db.Integer, nullable=True)  # Number of channels (1 = mono)
    
    # Session metadata
    session_id = db.Column(db.String(100), nullable=True)  # Client-side session ID
    platform = db.Column(db.String(50), default='web', nullable=True)  # web, mobile, etc.
    recitation_mode = db.Column(db.String(50), default='single_verse', nullable=True)  # single_verse, continuous
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    mistakes = db.relationship('Mistake', backref='session', lazy=True, cascade='all, delete-orphan')

class Mistake(db.Model):
    """Model for tracking mistakes in recitation"""
    __tablename__ = 'mistakes'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('recitation_sessions.id'), nullable=False)
    mistake_type = db.Column(db.String(50), nullable=False)  # pronunciation, tajweed, etc.
    position = db.Column(db.Integer, default=0)
    incorrect_text = db.Column(db.String(200))
    correct_text = db.Column(db.String(200))
    suggestion = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Progress(db.Model):
    """Model for tracking memorization progress"""
    __tablename__ = 'progress'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    verse_id = db.Column(db.String(100), nullable=False)
    is_memorized = db.Column(db.Boolean, default=False)
    times_practiced = db.Column(db.Integer, default=0)
    last_practiced = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    __table_args__ = (db.UniqueConstraint('user_id', 'verse_id', name='unique_user_verse'),)



