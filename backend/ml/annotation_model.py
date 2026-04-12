"""
Annotation models for data labeling
Based on Tarteel's ML journey Part 2
"""
from models import db
from datetime import datetime

class Annotator(db.Model):
    """Model for annotators who label recitation data"""
    __tablename__ = 'annotators'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    
    # Qualifications
    arabic_proficiency = db.Column(db.String(20), nullable=True)  # native, advanced, intermediate
    has_tajweed_training = db.Column(db.Boolean, default=False)
    qiraah_style = db.Column(db.String(50), nullable=True)
    
    # Status
    status = db.Column(db.String(20), default='active')  # active, inactive, training, suspended
    is_manager = db.Column(db.Boolean, default=False)
    
    # Performance tracking
    total_annotations = db.Column(db.Integer, default=0)
    accuracy_score = db.Column(db.Float, nullable=True)  # Based on review feedback
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    # Specify foreign_keys to avoid ambiguity (annotator_id is the primary relationship)
    annotations = db.relationship('Annotation', foreign_keys='Annotation.annotator_id', backref='annotator', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'status': self.status,
            'is_manager': self.is_manager,
            'total_annotations': self.total_annotations,
            'accuracy_score': self.accuracy_score,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Annotation(db.Model):
    """Model for individual annotations of recitation sessions"""
    __tablename__ = 'annotations'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('recitation_sessions.id'), nullable=False)
    annotator_id = db.Column(db.Integer, db.ForeignKey('annotators.id'), nullable=False)
    
    # Annotation results
    is_correct = db.Column(db.Boolean, nullable=False)  # Does recording match the verse?
    is_complete = db.Column(db.Boolean, default=True)  # Was the entire verse recited?
    has_proper_tashkeel = db.Column(db.Boolean, nullable=True)  # Proper diacritics
    
    # Detailed feedback
    transcribed_text = db.Column(db.Text, nullable=True)  # What annotator heard
    corrected_text = db.Column(db.Text, nullable=True)  # Corrected version if wrong
    notes = db.Column(db.Text, nullable=True)  # Additional notes from annotator
    
    # Quality flags
    audio_quality = db.Column(db.String(20), nullable=True)  # good, fair, poor
    has_background_noise = db.Column(db.Boolean, default=False)
    is_clear = db.Column(db.Boolean, default=True)
    
    # Status
    status = db.Column(db.String(20), default='pending')  # pending, completed, reviewed, rejected
    reviewed_by = db.Column(db.Integer, db.ForeignKey('annotators.id'), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    session = db.relationship('RecitationSession', backref='annotations')
    # Specify foreign_keys explicitly to avoid ambiguity
    reviewer = db.relationship('Annotator', foreign_keys=[reviewed_by], backref=db.backref('reviewed_annotations', lazy=True))
    
    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'annotator_id': self.annotator_id,
            'annotator_name': self.annotator.name if self.annotator else None,
            'is_correct': self.is_correct,
            'is_complete': self.is_complete,
            'has_proper_tashkeel': self.has_proper_tashkeel,
            'transcribed_text': self.transcribed_text,
            'corrected_text': self.corrected_text,
            'notes': self.notes,
            'audio_quality': self.audio_quality,
            'has_background_noise': self.has_background_noise,
            'is_clear': self.is_clear,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class AnnotationBatch(db.Model):
    """Model for managing batches of annotations (like GroundTruth jobs)"""
    __tablename__ = 'annotation_batches'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    # Batch configuration
    total_sessions = db.Column(db.Integer, default=0)
    completed_sessions = db.Column(db.Integer, default=0)
    priority = db.Column(db.String(20), default='normal')  # low, normal, high, urgent
    
    # Status
    status = db.Column(db.String(20), default='pending')  # pending, in_progress, completed, cancelled
    assigned_to = db.Column(db.Integer, db.ForeignKey('annotators.id'), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationship
    assigned_annotator = db.relationship('Annotator', foreign_keys=[assigned_to])
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'total_sessions': self.total_sessions,
            'completed_sessions': self.completed_sessions,
            'progress': (self.completed_sessions / self.total_sessions * 100) if self.total_sessions > 0 else 0,
            'priority': self.priority,
            'status': self.status,
            'assigned_to': self.assigned_to,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }

