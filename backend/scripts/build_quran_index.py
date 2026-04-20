"""
Build full Quran text index for verse position detection.
Fetches all 114 chapters via Al-Quran Cloud API and saves to quran_full_text.json.
Run once: python scripts/build_quran_index.py
"""
import sys
import os
import json
import re
import unicodedata
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from api.quran_api import QuranAPIService


def normalize_arabic(text):
    """Strip diacritics (tashkeel) for search comparison."""
    arabic_diacritics = re.compile(r'[\u064B-\u065F\u0670]')
    return arabic_diacritics.sub('', text).strip()


def build_index():
    output_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'quran_full_text.json')

    print("Fetching all 114 chapters from Al-Quran Cloud API...")
    chapters_meta = QuranAPIService.get_all_chapters()
    if not chapters_meta:
        print("ERROR: Could not fetch chapter list.")
        sys.exit(1)

    print(f"Found {len(chapters_meta)} chapters.")

    verses = []
    total_verse_count = 0

    for meta in chapters_meta:
        ch_num = meta['number']
        print(f"  Fetching chapter {ch_num} ({meta['english_name']})...")

        chapter = QuranAPIService.get_chapter(ch_num)
        if not chapter or 'verses' not in chapter:
            print(f"  WARNING: Could not fetch chapter {ch_num}, retrying in 2s...")
            time.sleep(2)
            chapter = QuranAPIService.get_chapter(ch_num)
            if not chapter or 'verses' not in chapter:
                print(f"  ERROR: Skipping chapter {ch_num} after retry.")
                continue

        ch_verses = chapter['verses']
        for v in ch_verses:
            verse_num = v['number_in_surah']
            text = v['text']
            verses.append({
                'chapter': ch_num,
                'verse': verse_num,
                'text': text,
                'text_normalized': normalize_arabic(text),
            })
            total_verse_count += 1

        # Be polite to the API
        time.sleep(0.3)

    # Add next_chapter / next_verse pointers
    for i, entry in enumerate(verses):
        if i + 1 < len(verses):
            entry['next_chapter'] = verses[i + 1]['chapter']
            entry['next_verse'] = verses[i + 1]['verse']
        else:
            entry['next_chapter'] = None
            entry['next_verse'] = None

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(verses, f, ensure_ascii=False, indent=1)

    print(f"\nDone! Saved {total_verse_count} verses to {output_path}")
    return total_verse_count


if __name__ == '__main__':
    count = build_index()
    if count < 6000:
        print(f"WARNING: Expected ~6236 verses but only got {count}. Some chapters may have failed.")
