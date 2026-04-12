"""
Gamification system - Badges, streaks, XP, and milestones.

XP is earned per practice session based on accuracy.
Streaks track consecutive days of practice.
Badges are awarded for milestones.
"""

from datetime import datetime, timedelta
from models import db, User, RecitationSession, Progress
from sqlalchemy import func

# ---------------------------------------------------------------------------
# Database models
# ---------------------------------------------------------------------------

class UserStreak(db.Model):
    """Track daily practice streaks."""
    __tablename__ = 'user_streaks'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    current_streak = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    last_practice_date = db.Column(db.Date, nullable=True)
    total_xp = db.Column(db.Integer, default=0)

    user = db.relationship('User', backref=db.backref('streak', uselist=False, lazy=True))

    def to_dict(self):
        return {
            'current_streak': self.current_streak,
            'longest_streak': self.longest_streak,
            'last_practice_date': self.last_practice_date.isoformat() if self.last_practice_date else None,
            'total_xp': self.total_xp,
            'level': self.get_level(),
            'xp_for_next_level': self.xp_for_next_level(),
            'xp_in_current_level': self.xp_in_current_level(),
        }

    def get_level(self):
        """Level up every 500 XP."""
        return (self.total_xp // 500) + 1

    def xp_for_next_level(self):
        """XP needed to reach the next level."""
        return self.get_level() * 500

    def xp_in_current_level(self):
        """XP accumulated within the current level."""
        return self.total_xp % 500


class UserBadge(db.Model):
    """Badges awarded to users for achievements."""
    __tablename__ = 'user_badges'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    badge_id = db.Column(db.String(50), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('badges', lazy=True))

    __table_args__ = (db.UniqueConstraint('user_id', 'badge_id', name='unique_user_badge'),)

    def to_dict(self):
        info = BADGE_DEFINITIONS.get(self.badge_id, {})
        return {
            'badge_id': self.badge_id,
            'earned_at': self.earned_at.isoformat(),
            **info,
        }


# ---------------------------------------------------------------------------
# Badge definitions
# ---------------------------------------------------------------------------

BADGE_DEFINITIONS = {
    # Session milestones
    'first_recitation': {
        'name': 'First Steps',
        'description': 'Complete your first recitation session',
        'icon': 'star',
        'category': 'milestone',
    },
    'sessions_10': {
        'name': 'Dedicated Learner',
        'description': 'Complete 10 practice sessions',
        'icon': 'fire',
        'category': 'milestone',
    },
    'sessions_50': {
        'name': 'Committed Reciter',
        'description': 'Complete 50 practice sessions',
        'icon': 'trophy',
        'category': 'milestone',
    },
    'sessions_100': {
        'name': 'Quran Scholar',
        'description': 'Complete 100 practice sessions',
        'icon': 'crown',
        'category': 'milestone',
    },

    # Accuracy badges
    'perfect_score': {
        'name': 'Perfect Recitation',
        'description': 'Score 100% accuracy on a verse',
        'icon': 'gem',
        'category': 'accuracy',
    },
    'accuracy_90': {
        'name': 'Sharp Reader',
        'description': 'Score 90%+ accuracy 5 times',
        'icon': 'bullseye',
        'category': 'accuracy',
    },

    # Streak badges
    'streak_3': {
        'name': 'Getting Started',
        'description': 'Practice 3 days in a row',
        'icon': 'flame',
        'category': 'streak',
    },
    'streak_7': {
        'name': 'One Week Strong',
        'description': 'Practice 7 days in a row',
        'icon': 'lightning',
        'category': 'streak',
    },
    'streak_30': {
        'name': 'Monthly Champion',
        'description': 'Practice 30 days in a row',
        'icon': 'medal',
        'category': 'streak',
    },

    # Memorization badges
    'memorized_1': {
        'name': 'First Memorization',
        'description': 'Memorize your first verse',
        'icon': 'book',
        'category': 'memorization',
    },
    'memorized_10': {
        'name': 'Growing Collection',
        'description': 'Memorize 10 verses',
        'icon': 'books',
        'category': 'memorization',
    },
    'memorized_50': {
        'name': 'Hafiz in Progress',
        'description': 'Memorize 50 verses',
        'icon': 'scroll',
        'category': 'memorization',
    },

    # XP / Level badges
    'level_5': {
        'name': 'Rising Star',
        'description': 'Reach level 5',
        'icon': 'rocket',
        'category': 'level',
    },
    'level_10': {
        'name': 'Experienced',
        'description': 'Reach level 10',
        'icon': 'sparkles',
        'category': 'level',
    },
}


# ---------------------------------------------------------------------------
# Core gamification logic
# ---------------------------------------------------------------------------

def get_or_create_streak(user_id: int) -> UserStreak:
    """Get or create a streak record for a user."""
    streak = UserStreak.query.filter_by(user_id=user_id).first()
    if not streak:
        streak = UserStreak(user_id=user_id)
        db.session.add(streak)
        db.session.commit()
    return streak


def record_practice(user_id: int, accuracy: float) -> dict:
    """
    Called after a practice session completes.
    Updates XP, streak, and checks for new badges.

    Returns a dict with xp_earned, new_badges, and streak info.
    """
    streak = get_or_create_streak(user_id)
    today = datetime.utcnow().date()

    # --- XP calculation ---
    # Base: 10 XP per session, bonus for accuracy
    xp_earned = 10 + int(accuracy * 0.4)  # max ~50 XP per session
    streak.total_xp += xp_earned

    # --- Streak update ---
    streak_continued = False
    if streak.last_practice_date is None:
        # First ever practice
        streak.current_streak = 1
    elif streak.last_practice_date == today:
        # Already practiced today, no streak change
        pass
    elif streak.last_practice_date == today - timedelta(days=1):
        # Consecutive day
        streak.current_streak += 1
        streak_continued = True
    else:
        # Streak broken
        streak.current_streak = 1

    streak.last_practice_date = today
    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak

    db.session.commit()

    # --- Check for new badges ---
    new_badges = check_and_award_badges(user_id, accuracy)

    return {
        'xp_earned': xp_earned,
        'total_xp': streak.total_xp,
        'level': streak.get_level(),
        'current_streak': streak.current_streak,
        'longest_streak': streak.longest_streak,
        'streak_continued': streak_continued,
        'new_badges': [b.to_dict() for b in new_badges],
    }


def check_and_award_badges(user_id: int, latest_accuracy: float) -> list:
    """Check all badge conditions and award any newly earned badges."""
    new_badges = []

    existing = {b.badge_id for b in UserBadge.query.filter_by(user_id=user_id).all()}

    def award(badge_id):
        if badge_id not in existing and badge_id in BADGE_DEFINITIONS:
            badge = UserBadge(user_id=user_id, badge_id=badge_id)
            db.session.add(badge)
            new_badges.append(badge)
            existing.add(badge_id)

    # Session count milestones
    session_count = RecitationSession.query.filter_by(user_id=user_id).count()
    if session_count >= 1:
        award('first_recitation')
    if session_count >= 10:
        award('sessions_10')
    if session_count >= 50:
        award('sessions_50')
    if session_count >= 100:
        award('sessions_100')

    # Accuracy badges
    if latest_accuracy >= 100:
        award('perfect_score')

    high_accuracy_count = RecitationSession.query.filter(
        RecitationSession.user_id == user_id,
        RecitationSession.accuracy_score >= 90
    ).count()
    if high_accuracy_count >= 5:
        award('accuracy_90')

    # Streak badges
    streak = get_or_create_streak(user_id)
    if streak.current_streak >= 3:
        award('streak_3')
    if streak.current_streak >= 7:
        award('streak_7')
    if streak.current_streak >= 30:
        award('streak_30')

    # Memorization badges
    memorized_count = Progress.query.filter_by(user_id=user_id, is_memorized=True).count()
    if memorized_count >= 1:
        award('memorized_1')
    if memorized_count >= 10:
        award('memorized_10')
    if memorized_count >= 50:
        award('memorized_50')

    # Level badges
    if streak.get_level() >= 5:
        award('level_5')
    if streak.get_level() >= 10:
        award('level_10')

    if new_badges:
        db.session.commit()

    return new_badges


def get_gamification_stats(user_id: int) -> dict:
    """Get complete gamification profile for a user."""
    streak = get_or_create_streak(user_id)
    badges = UserBadge.query.filter_by(user_id=user_id).order_by(UserBadge.earned_at.desc()).all()

    return {
        'streak': streak.to_dict(),
        'badges': [b.to_dict() for b in badges],
        'all_badges': BADGE_DEFINITIONS,
    }
