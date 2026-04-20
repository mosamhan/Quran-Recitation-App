"""
Quran API Service - Integration with Al-Quran Cloud API
Provides access to all chapters, verses, and audio recitations
"""
import requests
import re
import unicodedata
from typing import List, Dict, Any, Optional

# Al-Quran Cloud API base URL
QURAN_API_BASE = "https://api.alquran.cloud/v1"

# Available reciters (audio identifiers)
RECITERS = {
    'abdul_basit_murattal': 1,
    'abdul_basit_mujawwad': 2,
    'abdullah_basfar': 3,
    'abdurrahmaan_sudais': 4,
    'abu_bakr_ash_shaatree': 5,
    'ahmed_ibn_ali_al_ajamy': 6,
    'alafasy': 7,
    'ali_jaber': 8,
    'hani_ar_rifai': 9,
    'husary': 10,
    'husary_mujawwad': 11,
    'maher_al_muaiqly': 12,
    'minshawi': 13,
    'minshawi_murattal': 14,
    'muhammad_ayyoub': 15,
    'muhammad_jibreel': 16,
    'saad_al_ghamdi': 17,
    'salaah_bukhatir': 18,
    'yasser_ad_dussary': 19
}

# Chapter difficulty levels (1-5) and XP rewards
# Based on verse count, verse length complexity, and traditional learning order
# Level 1: Short surahs commonly memorized first (Juz Amma basics)
# Level 2: Medium-short surahs (rest of Juz Amma, early Juz Tabarak)
# Level 3: Medium surahs with moderate tajweed complexity
# Level 4: Longer surahs with complex tajweed patterns
# Level 5: Longest and most complex surahs
CHAPTER_LEVELS = {
    # Juz Amma short surahs – Level 1 (beginner)
    112: 1, 113: 1, 114: 1, 1: 1, 108: 1, 110: 1, 111: 1, 109: 1,
    107: 1, 106: 1, 105: 1, 104: 1, 103: 1, 102: 1, 101: 1, 97: 1,
    # Juz Amma medium surahs – Level 2
    100: 2, 99: 2, 98: 2, 96: 2, 95: 2, 94: 2, 93: 2, 92: 2,
    91: 2, 90: 2, 89: 2, 88: 2, 87: 2, 86: 2, 85: 2, 84: 2,
    83: 2, 82: 2, 81: 2, 80: 2, 79: 2, 78: 2,
    # Medium surahs – Level 3
    77: 3, 76: 3, 75: 3, 74: 3, 73: 3, 72: 3, 71: 3, 70: 3,
    69: 3, 68: 3, 67: 3, 66: 3, 65: 3, 64: 3, 63: 3, 62: 3,
    61: 3, 60: 3, 59: 3, 58: 3, 57: 3, 56: 3, 55: 3, 54: 3,
    53: 3, 52: 3, 51: 3, 50: 3, 49: 3, 48: 3, 47: 3, 46: 3,
    44: 3, 36: 3,
    # Longer surahs – Level 4
    45: 4, 43: 4, 42: 4, 41: 4, 40: 4, 39: 4, 38: 4, 37: 4,
    35: 4, 34: 4, 33: 4, 32: 4, 31: 4, 30: 4, 29: 4, 28: 4,
    27: 4, 26: 4, 25: 4, 24: 4, 23: 4, 22: 4, 21: 4, 20: 4,
    19: 4, 18: 4, 17: 4, 16: 4, 15: 4, 14: 4, 13: 4, 12: 4,
    11: 4, 10: 4,
    # Longest / most complex surahs – Level 5
    2: 5, 3: 5, 4: 5, 5: 5, 6: 5, 7: 5, 8: 5, 9: 5,
}

# XP per verse based on chapter level
XP_PER_VERSE = {1: 5, 2: 8, 3: 12, 4: 18, 5: 25}

def get_chapter_level(chapter_number):
    """Get difficulty level (1-5) for a chapter"""
    return CHAPTER_LEVELS.get(chapter_number, 3)

def get_chapter_xp_per_verse(chapter_number):
    """Get XP reward per verse for a chapter"""
    level = get_chapter_level(chapter_number)
    return XP_PER_VERSE.get(level, 10)


class QuranAPIService:
    """Service for fetching Quran data from Al-Quran Cloud API"""
    
    @staticmethod
    def get_all_chapters() -> List[Dict[str, Any]]:
        """Get all 114 chapters (Surahs) of the Quran"""
        try:
            response = requests.get(f"{QURAN_API_BASE}/surah", timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') == 'OK' and 'data' in data:
                chapters = []
                for chapter in data['data']:
                    ch_num = chapter.get('number')
                    chapters.append({
                        'number': ch_num,
                        'name': chapter.get('name'),
                        'name_arabic': chapter.get('name'),
                        'name_simple': chapter.get('englishName'),
                        'english_name': chapter.get('englishName'),
                        'english_name_translation': chapter.get('englishNameTranslation'),
                        'number_of_verses': chapter.get('numberOfAyahs'),
                        'revelation_type': chapter.get('revelationType'),
                        'revelation_order': chapter.get('revelationOrder'),
                        'difficulty_level': get_chapter_level(ch_num),
                        'xp_per_verse': get_chapter_xp_per_verse(ch_num),
                    })
                return chapters
            return []
        except Exception as e:
            print(f"Error fetching chapters: {e}")
            return []
    
    @staticmethod
    def get_chapter(chapter_number: int, translation: str = 'en.sahih') -> Optional[Dict[str, Any]]:
        """Get a specific chapter with all its verses"""
        try:
            # Get Arabic text
            response = requests.get(
                f"{QURAN_API_BASE}/surah/{chapter_number}",
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') != 'OK' or 'data' not in data:
                return None
            
            chapter_data = data['data']
            
            # Get translation
            translation_data = None
            try:
                trans_response = requests.get(
                    f"{QURAN_API_BASE}/surah/{chapter_number}/{translation}",
                    timeout=10
                )
                if trans_response.status_code == 200:
                    trans_data = trans_response.json()
                    if trans_data.get('status') == 'OK':
                        translation_data = trans_data.get('data')
            except:
                pass  # Translation is optional
            
            verses = []
            
            for ayah in chapter_data.get('ayahs', []):
                verse_num = ayah.get('number')
                arabic_text = ayah.get('text', '')
                verse_in_surah = ayah.get('numberInSurah')
                
                # Remove bismillah from verse 1 of every surah except Al-Fatiha (ch 1)
                # and At-Tawbah (ch 9, which has no bismillah).
                # The API prepends bismillah to verse 1 text.
                if verse_in_surah == 1 and chapter_number != 1 and chapter_number != 9:
                    text_stripped = arabic_text.strip()
                    if text_stripped.startswith('\u0628\u0650') or text_stripped.startswith('\u0628\u0650\u0633'):
                        # Strip diacritics and format chars to match base letters
                        base = ''.join(c for c in text_stripped if unicodedata.category(c) not in ('Mn', 'Cf'))
                        # Normalize alef wasla (ٱ U+0671) to regular alef (ا U+0627) for matching
                        base_norm = base.replace('\u0671', '\u0627')
                        # Find end of bismillah by matching الرحيم / الرحیم
                        for marker in ['الرحیم', 'الرحيم']:
                            idx = base_norm.find(marker)
                            if idx != -1:
                                base_pos = idx + len(marker)
                                # Map base position back to original text position
                                base_count = 0
                                orig_pos = 0
                                for orig_pos, c in enumerate(text_stripped):
                                    if unicodedata.category(c) not in ('Mn', 'Cf'):
                                        base_count += 1
                                    if base_count >= base_pos:
                                        orig_pos += 1
                                        break
                                # Skip any trailing diacritics after the marker
                                while orig_pos < len(text_stripped) and unicodedata.category(text_stripped[orig_pos]) in ('Mn', 'Cf'):
                                    orig_pos += 1
                                arabic_text = text_stripped[orig_pos:].strip()
                                break
                
                # Find corresponding translation
                translation_text = ''
                if translation_data:
                    for trans_ayah in translation_data.get('ayahs', []):
                        if trans_ayah.get('number') == verse_num:
                            translation_text = trans_ayah.get('text', '')
                            # Also remove bismillah from translation if present (except Al-Fatiha verse 1)
                            if not (chapter_number == 1 and verse_in_surah == 1):
                                # Remove bismillah translation (various formats)
                                translation_text = re.sub(r'^In the name of Allah[^.]*\.\s*', '', translation_text, flags=re.IGNORECASE).strip()
                            break
                
                verses.append({
                    'number': verse_num,
                    'number_in_surah': verse_in_surah,
                    'text': arabic_text,
                    'translation': translation_text,
                    'juz': ayah.get('juz'),
                    'manzil': ayah.get('manzil'),
                    'page': ayah.get('page'),
                    'ruku': ayah.get('ruku'),
                    'hizb_quarter': ayah.get('hizbQuarter')
                })
            
            return {
                'number': chapter_data.get('number'),
                'name': chapter_data.get('name'),
                'name_arabic': chapter_data.get('name'),
                'name_simple': chapter_data.get('englishName'),
                'english_name': chapter_data.get('englishName'),
                'english_name_translation': chapter_data.get('englishNameTranslation'),
                'number_of_verses': chapter_data.get('numberOfAyahs'),
                'revelation_type': chapter_data.get('revelationType'),
                'difficulty_level': get_chapter_level(chapter_number),
                'xp_per_verse': get_chapter_xp_per_verse(chapter_number),
                'verses': verses
            }
        except Exception as e:
            print(f"Error fetching chapter {chapter_number}: {e}")
            return None
    
    @staticmethod
    def get_verse(chapter_number: int, verse_number: int, translation: str = 'en.sahih') -> Optional[Dict[str, Any]]:
        """Get a specific verse"""
        try:
            # Get Arabic text
            response = requests.get(
                f"{QURAN_API_BASE}/ayah/{chapter_number}:{verse_number}",
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            if data.get('status') != 'OK' or 'data' not in data:
                return None
            
            verse_data = data['data']
            
            # Get translation
            translation_text = ''
            try:
                trans_response = requests.get(
                    f"{QURAN_API_BASE}/ayah/{chapter_number}:{verse_number}/{translation}",
                    timeout=10
                )
                if trans_response.status_code == 200:
                    trans_data = trans_response.json()
                    if trans_data.get('status') == 'OK' and 'data' in trans_data:
                        translation_text = trans_data['data'].get('text', '')
            except:
                pass
            
            return {
                'number': verse_data.get('number'),
                'number_in_surah': verse_data.get('numberInSurah'),
                'surah_number': verse_data.get('surah', {}).get('number'),
                'surah_name': verse_data.get('surah', {}).get('name'),
                'text': verse_data.get('text', ''),
                'translation': translation_text,
                'juz': verse_data.get('juz'),
                'page': verse_data.get('page')
            }
        except Exception as e:
            print(f"Error fetching verse {chapter_number}:{verse_number}: {e}")
            return None
    
    @staticmethod
    def get_audio_url(chapter_number: int, verse_number: int = None, reciter: str = 'alafasy') -> Optional[str]:
        """
        Get audio URL for a chapter or specific verse
        
        Uses Al-Quran Cloud CDN format
        """
        # Map reciter names to Al-Quran Cloud CDN format (ar.reciter_name)
        # Only includes reciters with confirmed working CDN audio
        # Tested 2026-01-25: these 9 reciters have working verse-by-verse audio
        # Al-Quran Cloud CDN reciters (verse-by-verse via absolute ayah number)
        alquran_cloud_map = {
            'alafasy': 'ar.alafasy',
            'abu_bakr_ash_shaatree': 'ar.shaatree',
            'ahmed_ibn_ali_al_ajamy': 'ar.ahmedajamy',
            'abdurrahmaan_sudais': 'ar.abdurrahmaansudais',
            'abdul_samad': 'ar.abdulsamad',
            'abdullah_basfar': 'ar.abdullahbasfar',
            'hani_rifai': 'ar.hanirifai',
            'hudhaify': 'ar.hudhaify',
            'husary': 'ar.husary',
            'husary_mujawwad': 'ar.husarymujawwad',
            'ibrahim_akhdar': 'ar.ibrahimakhbar',
            'maher_al_muaiqly': 'ar.mahermuaiqly',
            'muhammad_ayyoub': 'ar.muhammadayyoub',
            'muhammad_jibreel': 'ar.muhammadjibreel',
            'saood_shuraym': 'ar.saoodshuraym',
            'ayman_sowaid': 'ar.aymanswoaid',
        }

        # EveryAyah CDN reciters (verse-by-verse via SSSAAA format)
        everyayah_map = {
            'yasser_ad_dussary': 'Yasser_Ad-Dussary_128kbps',
            'abdul_basit_murattal': 'Abdul_Basit_Murattal_192kbps',
            'minshawi_murattal': 'Minshawy_Murattal_128kbps',
            'nasser_alqatami': 'Nasser_Alqatami_128kbps',
        }

        if verse_number:
            try:
                verse_data = QuranAPIService.get_verse(chapter_number, verse_number)
                if not verse_data or not verse_data.get('number'):
                    return f"https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/{chapter_number}.mp3"

                absolute_ayah_number = verse_data['number']

                # Check EveryAyah CDN first (for reciters not on Al-Quran Cloud)
                if reciter in everyayah_map:
                    folder = everyayah_map[reciter]
                    sss = str(chapter_number).zfill(3)
                    aaa = str(verse_number).zfill(3)
                    return f"https://everyayah.com/data/{folder}/{sss}{aaa}.mp3"

                # Al-Quran Cloud CDN
                cdn_reciter = alquran_cloud_map.get(reciter, 'ar.alafasy')
                return f"https://cdn.islamic.network/quran/audio/128/{cdn_reciter}/{absolute_ayah_number}.mp3"
            except Exception as e:
                print(f"Error getting verse data for audio URL: {e}")
                return f"https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/{chapter_number}.mp3"
        else:
            cdn_reciter = alquran_cloud_map.get(reciter, 'ar.alafasy')
            return f"https://cdn.islamic.network/quran/audio-surah/128/{cdn_reciter}/{chapter_number}.mp3"
    
    @staticmethod
    def get_available_reciters() -> List[Dict[str, str]]:
        """Get list of available reciters with working CDN audio"""
        reciter_names = {
            'alafasy': 'Mishary Rashid Alafasy',
            'abu_bakr_ash_shaatree': 'Abu Bakr Ash-Shaatree',
            'ahmed_ibn_ali_al_ajamy': 'Ahmed ibn Ali al-Ajamy',
            'abdul_basit_murattal': 'Abdul Basit (Murattal)',
            'abdul_samad': 'Abdul Samad',
            'abdurrahmaan_sudais': 'Abdur-Rahman As-Sudais',
            'abdullah_basfar': 'Abdullah Basfar',
            'hani_rifai': 'Hani Ar-Rifai',
            'hudhaify': 'Ali Al-Hudhaify',
            'husary': 'Mahmoud Khalil Al-Husary',
            'husary_mujawwad': 'Mahmoud Khalil Al-Husary (Mujawwad)',
            'ibrahim_akhdar': 'Ibrahim Akhdar',
            'maher_al_muaiqly': 'Maher Al Muaiqly',
            'minshawi_murattal': 'Mohamed Siddiq Al-Minshawi (Murattal)',
            'muhammad_ayyoub': 'Muhammad Ayyoub',
            'muhammad_jibreel': 'Muhammad Jibreel',
            'nasser_alqatami': 'Nasser Al-Qatami',
            'saood_shuraym': "Sa'ud Ash-Shuraym",
            'yasser_ad_dussary': 'Yasser Ad-Dossari',
        }

        return [
            {'id': reciter_id, 'name': name}
            for reciter_id, name in sorted(reciter_names.items(), key=lambda x: x[1])
        ]

