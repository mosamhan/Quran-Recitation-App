"""
N-gram search index for Quran verse position detection.
Loads quran_full_text.json and provides fast lookup from transcribed Arabic text
to the most likely verse the user is reciting.
"""
import json
import os
import re
import difflib
from collections import defaultdict
from typing import List, Dict, Any, Optional, Tuple


# Arabic diacritics pattern for normalization
_DIACRITICS = re.compile(r'[\u064B-\u065F\u0670]')


def _normalize(text: str) -> str:
    """Strip diacritics and extra whitespace for comparison."""
    return ' '.join(_DIACRITICS.sub('', text).split())


class QuranIndex:
    """In-memory search index over all Quran verses."""

    def __init__(self):
        self._verses: List[Dict[str, Any]] = []
        # verse lookup: (chapter, verse_num) -> index in self._verses
        self._lookup: Dict[Tuple[int, int], int] = {}
        # n-gram inverted index: ngram_string -> set of verse indices
        self._bigrams: Dict[str, set] = defaultdict(set)
        self._trigrams: Dict[str, set] = defaultdict(set)
        self._loaded = False

    def load(self, path: str = None):
        """Load verse data and build indices."""
        if self._loaded:
            return

        if path is None:
            path = os.path.join(
                os.path.dirname(__file__), '..', 'data', 'quran_full_text.json'
            )

        if not os.path.exists(path):
            print(f"QuranIndex: {path} not found. Run scripts/build_quran_index.py first.")
            return

        with open(path, 'r', encoding='utf-8') as f:
            self._verses = json.load(f)

        # Build lookup and n-gram indices
        for idx, entry in enumerate(self._verses):
            key = (entry['chapter'], entry['verse'])
            self._lookup[key] = idx

            # Build word-level n-grams from normalized text
            words = _normalize(entry.get('text_normalized', entry['text'])).split()
            for i in range(len(words)):
                if i + 1 < len(words):
                    bigram = f"{words[i]} {words[i+1]}"
                    self._bigrams[bigram].add(idx)
                if i + 2 < len(words):
                    trigram = f"{words[i]} {words[i+1]} {words[i+2]}"
                    self._trigrams[trigram].add(idx)

        self._loaded = True
        print(f"QuranIndex: Loaded {len(self._verses)} verses, "
              f"{len(self._bigrams)} bigrams, {len(self._trigrams)} trigrams.")

    def search(self, transcription: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for the verse most likely matching a transcribed text fragment.

        Returns list of candidates sorted by score (descending):
        [{chapter, verse, score, confidence, verse_text, verse_text_normalized}]
        """
        if not self._loaded or not transcription:
            return []

        query_norm = _normalize(transcription)
        query_words = query_norm.split()

        if len(query_words) < 2:
            return []

        # Collect candidate verses from n-gram hits
        candidate_scores: Dict[int, float] = defaultdict(float)

        # Trigram hits (weighted higher)
        for i in range(len(query_words) - 2):
            trigram = f"{query_words[i]} {query_words[i+1]} {query_words[i+2]}"
            for idx in self._trigrams.get(trigram, set()):
                candidate_scores[idx] += 3.0

        # Bigram hits
        for i in range(len(query_words) - 1):
            bigram = f"{query_words[i]} {query_words[i+1]}"
            for idx in self._bigrams.get(bigram, set()):
                candidate_scores[idx] += 1.0

        if not candidate_scores:
            return []

        # Score refinement: LCS ratio for top candidates
        # Only refine the top 20 by n-gram score to keep it fast
        top_candidates = sorted(candidate_scores.items(), key=lambda x: -x[1])[:20]

        results = []
        for idx, ngram_score in top_candidates:
            entry = self._verses[idx]
            verse_norm = _normalize(entry.get('text_normalized', entry['text']))

            # Longest common subsequence ratio
            lcs_ratio = difflib.SequenceMatcher(None, query_norm, verse_norm).ratio()

            # Longest contiguous match (number of matching characters)
            match = difflib.SequenceMatcher(None, query_norm, verse_norm).find_longest_match(
                0, len(query_norm), 0, len(verse_norm)
            )
            contiguous_ratio = match.size / max(len(query_norm), 1)

            # Combined score: n-gram hits + LCS + contiguous match
            combined = ngram_score + (lcs_ratio * 10) + (contiguous_ratio * 5)

            results.append({
                'chapter': entry['chapter'],
                'verse': entry['verse'],
                'score': round(combined, 2),
                'confidence': round(lcs_ratio, 3),
                'verse_text': entry['text'],
                'verse_text_normalized': verse_norm,
            })

        # Sort by combined score descending
        results.sort(key=lambda x: -x['score'])

        # Bismillah ambiguity: if top result has low confidence and many candidates
        # from different chapters have similar scores, signal ambiguity
        if results and results[0]['confidence'] < 0.3 and len(results) > 5:
            # Check if top candidates span many chapters (bismillah scenario)
            chapters_seen = set(r['chapter'] for r in results[:10])
            if len(chapters_seen) > 5:
                # Don't commit to a single verse yet
                for r in results:
                    r['confidence'] = min(r['confidence'], 0.2)

        return results[:top_k]

    def get_verse_text(self, chapter: int, verse: int) -> Optional[str]:
        """Get the Arabic text of a specific verse."""
        idx = self._lookup.get((chapter, verse))
        if idx is not None:
            return self._verses[idx]['text']
        return None

    def get_next_verse(self, chapter: int, verse: int) -> Optional[Tuple[int, int, str]]:
        """
        Get the next verse after (chapter, verse).
        Returns (next_chapter, next_verse, next_text) or None if last verse.
        """
        idx = self._lookup.get((chapter, verse))
        if idx is None:
            return None

        entry = self._verses[idx]
        next_ch = entry.get('next_chapter')
        next_v = entry.get('next_verse')
        if next_ch is None or next_v is None:
            return None

        next_idx = self._lookup.get((next_ch, next_v))
        if next_idx is None:
            return None

        return (next_ch, next_v, self._verses[next_idx]['text'])

    def get_verse_count(self, chapter: int) -> int:
        """Get the total number of verses in a chapter."""
        count = 0
        for entry in self._verses:
            if entry['chapter'] == chapter:
                count += 1
            elif entry['chapter'] > chapter:
                break
        return count


# Module-level singleton — loaded lazily
_index = QuranIndex()


def get_index() -> QuranIndex:
    """Get the shared QuranIndex instance, loading if needed."""
    if not _index._loaded:
        _index.load()
    return _index
