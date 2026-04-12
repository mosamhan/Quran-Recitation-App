"""
Demographic information model for data collection
"""
from models import db
from datetime import datetime

class DemographicInformation(db.Model):
    """Model for storing user demographic information for ML data collection"""
    __tablename__ = 'demographic_information'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    
    # Demographic fields (all optional to encourage completion)
    gender = db.Column(db.String(20), nullable=True)  # male, female, other, prefer_not_to_say
    age_range = db.Column(db.String(20), nullable=True)  # under_18, 18-25, 26-35, 36-50, over_50
    ethnicity = db.Column(db.String(100), nullable=True)
    native_language = db.Column(db.String(50), nullable=True)  # Language they speak at home
    qiraah_style = db.Column(db.String(50), nullable=True)  # Recitation style (Hafs, Warsh, etc.)
    arabic_proficiency = db.Column(db.String(20), nullable=True)  # beginner, intermediate, advanced, native
    
    # Learning context
    years_studying_quran = db.Column(db.Integer, nullable=True)
    has_formal_tajweed_training = db.Column(db.Boolean, nullable=True)
    
    # Privacy and consent
    consent_for_ml_training = db.Column(db.Boolean, default=False, nullable=False)  # Consent to use recordings for ML
    consent_given_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref='demographic', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'gender': self.gender,
            'age_range': self.age_range,
            'ethnicity': self.ethnicity,
            'native_language': self.native_language,
            'qiraah_style': self.qiraah_style,
            'arabic_proficiency': self.arabic_proficiency,
            'years_studying_quran': self.years_studying_quran,
            'has_formal_tajweed_training': self.has_formal_tajweed_training,
            'consent_for_ml_training': self.consent_for_ml_training,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }



