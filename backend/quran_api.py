"""
Quran API Service - Integration with Al-Quran Cloud API
Provides access to all chapters, verses, and audio recitations
"""
import requests
import re
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
                    chapters.append({
                        'number': chapter.get('number'),
                        'name': chapter.get('name'),
                        'name_arabic': chapter.get('name'),
                        'name_simple': chapter.get('englishName'),
                        'english_name': chapter.get('englishName'),
                        'english_name_translation': chapter.get('englishNameTranslation'),
                        'number_of_verses': chapter.get('numberOfAyahs'),
                        'revelation_type': chapter.get('revelationType'),
                        'revelation_order': chapter.get('revelationOrder')
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
                
                # Remove bismillah from all verses except verse 1 of Al-Fatiha (chapter 1)
                # Bismillah should only appear in Al-Fatiha verse 1
                if not (chapter_number == 1 and verse_in_surah == 1):
                    # Check if text starts with bismillah (various Unicode forms)
                    # Look for بِس or بِسۡ at the start
                    text_stripped = arabic_text.strip()
                    
                    # Check if it starts with bismillah indicators
                    if text_stripped.startswith('بِس') or text_stripped.startswith('بِسۡ'):
                        # Find where bismillah likely ends
                        # Bismillah typically ends before the actual verse content
                        # Look for common verse-starting patterns or remove first ~45-50 characters
                        
                        # Try to find the actual verse content by looking for:
                        # 1. Common verse starters after bismillah
                        # 2. Or remove first portion (bismillah is typically 40-50 chars)
                        
                        # For most chapters, verse 1 content starts after bismillah
                        # Try removing first 50 characters (typical bismillah length)
                        if len(text_stripped) > 50:
                            # Check if what remains looks like actual verse content
                            remaining = text_stripped[50:].strip()
                            if len(remaining) > 5:  # If there's substantial content left
                                arabic_text = remaining
                            else:
                                # Try 60 chars
                                remaining = text_stripped[60:].strip()
                                if len(remaining) > 5:
                                    arabic_text = remaining
                                else:
                                    # Last resort: remove first 45 chars
                                    arabic_text = text_stripped[45:].strip()
                        else:
                            # Text is short, might be just bismillah - try removing first 40 chars
                            if len(text_stripped) > 40:
                                arabic_text = text_stripped[40:].strip()
                    
                    # Remove any leading space or punctuation that might remain
                    arabic_text = arabic_text.lstrip(' \u060C\u061B\u061F\u0640\u200C\u200D\u200E\u200F\u00A0')
                
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
        
        # Default to alafasy if not found
        cdn_reciter = reciter_map.get(reciter, 'ar.alafasy')
        bitrate = 128  # Standard quality
        
        if verse_number:
            # Get the absolute ayah number from the API
            # The audio CDN requires the absolute verse number across the entire Quran
            try:
                verse_data = QuranAPIService.get_verse(chapter_number, verse_number)
                if verse_data and verse_data.get('number'):
                    absolute_ayah_number = verse_data['number']
                    return f"https://cdn.islamic.network/quran/audio/{bitrate}/{cdn_reciter}/{absolute_ayah_number}.mp3"
            except Exception as e:
                print(f"Error getting verse data for audio URL: {e}")
            
            # Fallback: Use chapter audio (plays entire chapter)
            return f"https://cdn.islamic.network/quran/audio-surah/{bitrate}/{cdn_reciter}/{chapter_number}.mp3"
        else:
            # For entire chapter
            return f"https://cdn.islamic.network/quran/audio-surah/{bitrate}/{cdn_reciter}/{chapter_number}.mp3"
    
    @staticmethod
    def get_available_reciters() -> List[Dict[str, str]]:
        """Get list of available reciters with working CDN audio"""
        # Only reciters with confirmed working audio on cdn.islamic.network
        # Tested and verified 2026-01-25
        reciter_names = {
            'alafasy': 'Mishary Rashid Alafasy',
            'abu_bakr_ash_shaatree': 'Abu Bakr Ash-Shaatree',
            'ahmed_ibn_ali_al_ajamy': 'Ahmed ibn Ali al-Ajamy',
            'hudhaify': 'Ali Al-Hudhaify',
            'husary': 'Mahmoud Khalil Al-Husary',
            'husary_mujawwad': 'Mahmoud Khalil Al-Husary (Mujawwad)',
            'maher_al_muaiqly': 'Maher Al Muaiqly',
            'muhammad_ayyoub': 'Muhammad Ayyoub',
            'muhammad_jibreel': 'Muhammad Jibreel',
        }
        
        return [
            {'id': reciter_id, 'name': name}
            for reciter_id, name in sorted(reciter_names.items(), key=lambda x: x[1])
        ]

