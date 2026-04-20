"""
Structured curriculum system for guided Quran learning.

Organizes lessons into levels (beginner, intermediate, advanced) with
clear objectives, prerequisite tracking, and progress milestones.
"""

# ── Lesson Definitions ──────────────────────────────────────────────

CURRICULUM = {
    # ── BEGINNER ─────────────────────────────────────────────────────
    'beginner': {
        'title': 'Foundation',
        'title_child': 'My First Steps',
        'description': 'Learn the essential short surahs and build confidence with basic pronunciation.',
        'lessons': [
            {
                'id': 'b1',
                'title': 'Al-Fatiha: The Opening',
                'title_child': 'The Opening Prayer',
                'description': 'The most recited surah in Islam. Master its seven verses.',
                'chapter': 1,
                'verses': None,  # None = entire surah
                'objectives': [
                    'Recite all 7 verses with 70%+ accuracy',
                    'Learn the meaning of Al-Fatiha',
                ],
                'prerequisites': [],
                'xp_reward': 100,
            },
            {
                'id': 'b2',
                'title': 'Al-Ikhlas: Purity of Faith',
                'title_child': 'Allah is One',
                'description': 'A short but powerful surah about the oneness of Allah.',
                'chapter': 112,
                'verses': None,
                'objectives': [
                    'Recite all 4 verses with 70%+ accuracy',
                    'Understand Ikhlas (sincerity)',
                ],
                'prerequisites': [],
                'xp_reward': 80,
            },
            {
                'id': 'b3',
                'title': 'Al-Falaq: The Daybreak',
                'title_child': 'Protection from Evil',
                'description': 'One of the two surahs of refuge (Al-Mu\'awwidhatayn).',
                'chapter': 113,
                'verses': None,
                'objectives': [
                    'Recite all 5 verses with 70%+ accuracy',
                ],
                'prerequisites': ['b1'],
                'xp_reward': 80,
            },
            {
                'id': 'b4',
                'title': 'An-Nas: Mankind',
                'title_child': 'Asking Allah for Help',
                'description': 'The final surah of the Quran, seeking refuge in Allah.',
                'chapter': 114,
                'verses': None,
                'objectives': [
                    'Recite all 6 verses with 70%+ accuracy',
                ],
                'prerequisites': ['b1'],
                'xp_reward': 80,
            },
            {
                'id': 'b5',
                'title': 'Al-Kawthar: Abundance',
                'title_child': 'A Gift from Allah',
                'description': 'The shortest surah in the Quran — only 3 verses.',
                'chapter': 108,
                'verses': None,
                'objectives': [
                    'Recite all 3 verses with 80%+ accuracy',
                ],
                'prerequisites': ['b2'],
                'xp_reward': 60,
            },
            {
                'id': 'b6',
                'title': 'Al-Asr: Time',
                'title_child': 'Don\'t Waste Time!',
                'description': 'A concise surah about the value of time and righteous deeds.',
                'chapter': 103,
                'verses': None,
                'objectives': [
                    'Recite all 3 verses with 80%+ accuracy',
                ],
                'prerequisites': ['b5'],
                'xp_reward': 60,
            },
            {
                'id': 'b7',
                'title': 'An-Nasr: Victory',
                'title_child': 'Allah\'s Help',
                'description': 'The last surah revealed to the Prophet (PBUH).',
                'chapter': 110,
                'verses': None,
                'objectives': [
                    'Recite all 3 verses with 80%+ accuracy',
                ],
                'prerequisites': ['b5'],
                'xp_reward': 60,
            },
            {
                'id': 'b8',
                'title': 'Al-Masad: The Palm Fiber',
                'title_child': 'A Warning Story',
                'description': 'Practice longer vowel sounds and emphatic letters.',
                'chapter': 111,
                'verses': None,
                'objectives': [
                    'Recite all 5 verses with 75%+ accuracy',
                ],
                'prerequisites': ['b3', 'b4'],
                'xp_reward': 80,
            },
        ],
    },

    # ── INTERMEDIATE ─────────────────────────────────────────────────
    'intermediate': {
        'title': 'Developing Fluency',
        'title_child': 'Level Up!',
        'description': 'Tackle medium-length surahs and refine tajweed pronunciation.',
        'lessons': [
            {
                'id': 'i1',
                'title': 'Al-Mulk: The Sovereignty (Part 1)',
                'title_child': 'The Kingdom — Part 1',
                'description': 'Begin memorizing the protective surah, verses 1-10.',
                'chapter': 67,
                'verses': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                'objectives': [
                    'Recite verses 1-10 with 75%+ accuracy',
                    'Apply ghunnah and idgham rules',
                ],
                'prerequisites': ['b8'],
                'xp_reward': 150,
            },
            {
                'id': 'i2',
                'title': 'Al-Mulk: The Sovereignty (Part 2)',
                'title_child': 'The Kingdom — Part 2',
                'description': 'Continue with verses 11-20.',
                'chapter': 67,
                'verses': [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
                'objectives': [
                    'Recite verses 11-20 with 75%+ accuracy',
                ],
                'prerequisites': ['i1'],
                'xp_reward': 150,
            },
            {
                'id': 'i3',
                'title': 'Al-Mulk: The Sovereignty (Part 3)',
                'title_child': 'The Kingdom — Part 3',
                'description': 'Complete the surah, verses 21-30.',
                'chapter': 67,
                'verses': [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
                'objectives': [
                    'Recite verses 21-30 with 75%+ accuracy',
                    'Recite the full surah from memory',
                ],
                'prerequisites': ['i2'],
                'xp_reward': 200,
            },
            {
                'id': 'i4',
                'title': 'Ar-Rahman: The Most Merciful (Part 1)',
                'title_child': 'Allah\'s Gifts — Part 1',
                'description': 'The beautiful surah of gratitude, verses 1-25.',
                'chapter': 55,
                'verses': list(range(1, 26)),
                'objectives': [
                    'Recite verses 1-25 with 75%+ accuracy',
                    'Master the refrain "Which of the favors of your Lord will you deny?"',
                ],
                'prerequisites': ['i1'],
                'xp_reward': 200,
            },
            {
                'id': 'i5',
                'title': 'Ar-Rahman: The Most Merciful (Part 2)',
                'title_child': 'Allah\'s Gifts — Part 2',
                'description': 'Complete Ar-Rahman, verses 26-78.',
                'chapter': 55,
                'verses': list(range(26, 79)),
                'objectives': [
                    'Recite verses 26-78 with 75%+ accuracy',
                ],
                'prerequisites': ['i4'],
                'xp_reward': 250,
            },
            {
                'id': 'i6',
                'title': 'Ya-Sin: The Heart of the Quran (Part 1)',
                'title_child': 'The Heart — Part 1',
                'description': 'Begin the surah known as the heart of the Quran, verses 1-25.',
                'chapter': 36,
                'verses': list(range(1, 26)),
                'objectives': [
                    'Recite verses 1-25 with 75%+ accuracy',
                    'Focus on madd (elongation) rules',
                ],
                'prerequisites': ['i3'],
                'xp_reward': 200,
            },
            {
                'id': 'i7',
                'title': 'Ya-Sin: The Heart of the Quran (Part 2)',
                'title_child': 'The Heart — Part 2',
                'description': 'Continue Ya-Sin, verses 26-55.',
                'chapter': 36,
                'verses': list(range(26, 56)),
                'objectives': [
                    'Recite verses 26-55 with 75%+ accuracy',
                ],
                'prerequisites': ['i6'],
                'xp_reward': 200,
            },
            {
                'id': 'i8',
                'title': 'Ya-Sin: The Heart of the Quran (Part 3)',
                'title_child': 'The Heart — Part 3',
                'description': 'Complete Ya-Sin, verses 56-83.',
                'chapter': 36,
                'verses': list(range(56, 84)),
                'objectives': [
                    'Recite verses 56-83 with 75%+ accuracy',
                    'Recite the full surah from memory',
                ],
                'prerequisites': ['i7'],
                'xp_reward': 250,
            },
        ],
    },

    # ── ADVANCED ─────────────────────────────────────────────────────
    'advanced': {
        'title': 'Mastery',
        'title_child': 'Expert Level',
        'description': 'Master long surahs with precise tajweed and memorization.',
        'lessons': [
            {
                'id': 'a1',
                'title': 'Al-Baqarah: Verses 1-25',
                'title_child': 'The Cow — Part 1',
                'description': 'The longest surah begins. Master the opening passage.',
                'chapter': 2,
                'verses': list(range(1, 26)),
                'objectives': [
                    'Recite verses 1-25 with 80%+ accuracy',
                    'Apply all noon sakinah and tanween rules',
                ],
                'prerequisites': ['i3'],
                'xp_reward': 300,
            },
            {
                'id': 'a2',
                'title': 'Al-Baqarah: Ayat al-Kursi',
                'title_child': 'The Throne Verse',
                'description': 'The greatest verse in the Quran (2:255). Perfect your recitation.',
                'chapter': 2,
                'verses': [255],
                'objectives': [
                    'Recite Ayat al-Kursi with 85%+ accuracy',
                    'Memorize with perfect tajweed',
                ],
                'prerequisites': ['a1'],
                'xp_reward': 200,
            },
            {
                'id': 'a3',
                'title': 'Al-Baqarah: Last Two Verses',
                'title_child': 'Special Verses',
                'description': 'Verses 285-286, recited for protection.',
                'chapter': 2,
                'verses': [285, 286],
                'objectives': [
                    'Recite both verses with 85%+ accuracy',
                ],
                'prerequisites': ['a1'],
                'xp_reward': 150,
            },
            {
                'id': 'a4',
                'title': 'Al-Kahf: The Cave (Part 1)',
                'title_child': 'The Cave Story — Part 1',
                'description': 'First 10 verses of the Friday surah — protection from Dajjal.',
                'chapter': 18,
                'verses': list(range(1, 11)),
                'objectives': [
                    'Recite verses 1-10 with 80%+ accuracy',
                ],
                'prerequisites': ['i8'],
                'xp_reward': 250,
            },
            {
                'id': 'a5',
                'title': 'Al-Kahf: The Cave (Part 2)',
                'title_child': 'The Cave Story — Part 2',
                'description': 'The story of the People of the Cave, verses 11-26.',
                'chapter': 18,
                'verses': list(range(11, 27)),
                'objectives': [
                    'Recite verses 11-26 with 80%+ accuracy',
                    'Practice waqf (stopping) rules',
                ],
                'prerequisites': ['a4'],
                'xp_reward': 250,
            },
            {
                'id': 'a6',
                'title': 'Maryam: Mary (Part 1)',
                'title_child': 'The Story of Maryam',
                'description': 'The story of Zakariyya and Maryam, verses 1-40.',
                'chapter': 19,
                'verses': list(range(1, 41)),
                'objectives': [
                    'Recite verses 1-40 with 80%+ accuracy',
                    'Master huroof muqatta\'at (disconnected letters)',
                ],
                'prerequisites': ['a4'],
                'xp_reward': 300,
            },
        ],
    },
}

# Quick lookup: lesson_id -> lesson dict
_LESSON_INDEX = {}
for _level, _data in CURRICULUM.items():
    for _lesson in _data['lessons']:
        _LESSON_INDEX[_lesson['id']] = {**_lesson, 'level': _level}


def get_curriculum():
    """Return the full curriculum structure."""
    return CURRICULUM


def get_lesson(lesson_id: str):
    """Return a single lesson by ID, or None."""
    return _LESSON_INDEX.get(lesson_id)


def get_lessons_for_level(level: str):
    """Return list of lessons for a given level."""
    level_data = CURRICULUM.get(level)
    if not level_data:
        return []
    return level_data['lessons']


def compute_user_progress(user_id: int, db_session) -> dict:
    """
    Compute which lessons a user has completed, which are unlocked, and
    which are locked based on prerequisite completion.

    Returns dict keyed by lesson_id with status: 'completed', 'unlocked', 'locked'.
    """
    from models import RecitationSession
    from sqlalchemy import func

    # Gather best accuracy per verse for this user
    sessions = (
        db_session.query(
            RecitationSession.verse_id,
            func.max(RecitationSession.accuracy_score).label('best')
        )
        .filter_by(user_id=user_id)
        .group_by(RecitationSession.verse_id)
        .all()
    )
    best_by_verse = {row.verse_id: row.best for row in sessions}

    result = {}
    completed_ids = set()

    # First pass: determine which lessons are completed
    for lesson_id, lesson in _LESSON_INDEX.items():
        chapter = lesson['chapter']
        lesson_verses = lesson.get('verses')
        # Extract accuracy threshold from objectives (default 70)
        threshold = _extract_threshold(lesson)

        if lesson_verses is None:
            # Whole surah – check if any verse from that chapter is practiced
            # We approximate: user must have practiced at least one verse above threshold
            completed = any(
                acc >= threshold
                for vid, acc in best_by_verse.items()
                if vid.startswith(f"{chapter}:")
            )
        else:
            # Specific verses
            completed = all(
                best_by_verse.get(f"{chapter}:{v}", 0) >= threshold
                for v in lesson_verses
            )

        if completed:
            completed_ids.add(lesson_id)

    # Second pass: determine unlock status
    for lesson_id, lesson in _LESSON_INDEX.items():
        prereqs = lesson.get('prerequisites', [])
        prereqs_met = all(pid in completed_ids for pid in prereqs)

        if lesson_id in completed_ids:
            status = 'completed'
        elif prereqs_met:
            status = 'unlocked'
        else:
            status = 'locked'

        # Calculate verse-level progress
        chapter = lesson['chapter']
        lesson_verses = lesson.get('verses')
        threshold = _extract_threshold(lesson)
        verses_total = 0
        verses_done = 0
        if lesson_verses:
            verses_total = len(lesson_verses)
            verses_done = sum(
                1 for v in lesson_verses
                if best_by_verse.get(f"{chapter}:{v}", 0) >= threshold
            )

        result[lesson_id] = {
            'status': status,
            'verses_completed': verses_done,
            'verses_total': verses_total,
        }

    return result


def _extract_threshold(lesson: dict) -> float:
    """Parse accuracy threshold from the first objective string, default 70."""
    for obj in lesson.get('objectives', []):
        # Look for patterns like "70%+" or "85%+"
        import re
        match = re.search(r'(\d+)%\+', obj)
        if match:
            return float(match.group(1))
    return 70.0
