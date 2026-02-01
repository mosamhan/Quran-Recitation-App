"""
Sample Quran verses for practice
In production, this would be loaded from a database or API
"""

VERSES = [
    {
        'id': '1:1',
        'surah': 1,
        'ayah': 1,
        'text': 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        'translation': 'In the name of Allah, the Most Gracious, the Most Merciful',
        'tajweed_notes': 'Focus on the pronunciation of "الرحمن" and "الرحيم"'
    },
    {
        'id': '1:2',
        'surah': 1,
        'ayah': 2,
        'text': 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
        'translation': 'Praise be to Allah, the Lord of all the worlds',
        'tajweed_notes': 'Pay attention to the elongation in "الْحَمْدُ"'
    },
    {
        'id': '1:3',
        'surah': 1,
        'ayah': 3,
        'text': 'الرَّحْمَٰنِ الرَّحِيمِ',
        'translation': 'The Most Gracious, the Most Merciful',
        'tajweed_notes': 'Practice the proper pronunciation of "الرحمن"'
    },
    {
        'id': '1:4',
        'surah': 1,
        'ayah': 4,
        'text': 'مَالِكِ يَوْمِ الدِّينِ',
        'translation': 'Master of the Day of Judgment',
        'tajweed_notes': 'Focus on "يَوْمِ" and "الدِّينِ"'
    },
    {
        'id': '1:5',
        'surah': 1,
        'ayah': 5,
        'text': 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
        'translation': 'You alone we worship, and You alone we ask for help',
        'tajweed_notes': 'Practice the repetition of "إِيَّاكَ"'
    },
    {
        'id': '1:6',
        'surah': 1,
        'ayah': 6,
        'text': 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
        'translation': 'Guide us to the straight path',
        'tajweed_notes': 'Focus on "الصِّرَاطَ" pronunciation'
    },
    {
        'id': '1:7',
        'surah': 1,
        'ayah': 7,
        'text': 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
        'translation': 'The path of those upon whom You have bestowed favor, not of those who have evoked anger or of those who are astray',
        'tajweed_notes': 'Long verse - practice in sections, focus on "الْمَغْضُوبِ" and "الضَّالِّينَ"'
    }
]

def get_verse(verse_id):
    """Get a verse by ID"""
    for verse in VERSES:
        if verse['id'] == verse_id:
            return verse
    return None

def get_all_verses():
    """Get all verses"""
    return VERSES

def get_verses_by_surah(surah_number):
    """Get all verses from a specific surah"""
    return [v for v in VERSES if v['surah'] == surah_number]





