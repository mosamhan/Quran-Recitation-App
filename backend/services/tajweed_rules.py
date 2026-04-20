"""
Tajweed Rules Engine - Identifies tajweed rules in Arabic/Quranic text
and provides educational feedback on pronunciation.

Core tajweed categories covered:
1. Noon Sakinah & Tanween rules (Idhar, Idgham, Iqlab, Ikhfa)
2. Meem Sakinah rules (Idgham Shafawi, Ikhfa Shafawi, Idhar Shafawi)
3. Qalqalah (echoing on certain letters)
4. Madd (elongation rules)
5. Ghunnah (nasalization)
6. Lam rules (Shamsiyyah / Qamariyyah)
"""

import re
from typing import List, Dict, Any, Optional

# ---------------------------------------------------------------------------
# Arabic character constants
# ---------------------------------------------------------------------------

# Diacritical marks
SUKUN = '\u0652'       # ْ
FATHAH = '\u064E'      # َ
KASRAH = '\u0650'      # ِ
DAMMAH = '\u064F'      # ُ
TANWEEN_FATH = '\u064B'  # ً
TANWEEN_KASR = '\u064D'  # ٍ
TANWEEN_DAMM = '\u064C'  # ٌ
SHADDAH = '\u0651'     # ّ

TANWEEN = {TANWEEN_FATH, TANWEEN_KASR, TANWEEN_DAMM}

# Core letters
NOON = '\u0646'   # ن
MEEM = '\u0645'   # م
BA = '\u0628'     # ب
LAM = '\u0644'    # ل
ALIF = '\u0627'   # ا
WAW = '\u0648'    # و
YA = '\u064A'     # ي

# Qalqalah letters: ق ط ب ج د
QALQALAH_LETTERS = {'\u0642', '\u0637', '\u0628', '\u062C', '\u062F'}

# Noon Sakinah / Tanween rule letter groups
# Idhar (clear) letters: throat letters ء ه ع ح غ خ
IDHAR_LETTERS = {'\u0621', '\u0647', '\u0639', '\u062D', '\u063A', '\u062E'}

# Idgham letters split into two groups
# With ghunnah: ي ن م و  (YNMW)
IDGHAM_GHUNNAH_LETTERS = {YA, NOON, MEEM, WAW}
# Without ghunnah: ل ر
IDGHAM_NO_GHUNNAH_LETTERS = {LAM, '\u0631'}
IDGHAM_LETTERS = IDGHAM_GHUNNAH_LETTERS | IDGHAM_NO_GHUNNAH_LETTERS

# Iqlab: only when followed by ب
IQLAB_LETTER = BA

# Ikhfa letters: everything NOT in idhar, idgham, or iqlab
IKHFA_LETTERS = {
    '\u062A',  # ت
    '\u062B',  # ث
    '\u062C',  # ج
    '\u062F',  # د
    '\u0630',  # ذ
    '\u0632',  # ز
    '\u0633',  # س
    '\u0634',  # ش
    '\u0635',  # ص
    '\u0636',  # ض
    '\u0637',  # ط
    '\u0638',  # ظ
    '\u0641',  # ف
    '\u0642',  # ق
    '\u0643',  # ك
}

# Shamsiyyah letters (assimilate with lam of ال)
SHAMS_LETTERS = {
    '\u062A', '\u062B', '\u062F', '\u0630', '\u0631', '\u0632',
    '\u0633', '\u0634', '\u0635', '\u0636', '\u0637', '\u0638',
    '\u0644', '\u0646',
}

# Madd letters (elongation carriers)
MADD_LETTERS = {ALIF, WAW, YA}


# ---------------------------------------------------------------------------
# Rule definitions: id, name, arabic_name, color, description
# ---------------------------------------------------------------------------

TAJWEED_RULE_DEFS = {
    'ghunnah': {
        'name': 'Ghunnah',
        'arabic_name': 'غنّة',
        'color': '#FF7043',
        'description': 'Nasalization held for 2 counts through the nose.',
    },
    'idhar': {
        'name': 'Idhar',
        'arabic_name': 'إظهار',
        'color': '#66BB6A',
        'description': 'Clear pronunciation of Noon Sakinah/Tanween before throat letters.',
    },
    'idgham_ghunnah': {
        'name': 'Idgham with Ghunnah',
        'arabic_name': 'إدغام بغنّة',
        'color': '#42A5F5',
        'description': 'Merging Noon Sakinah/Tanween into the next letter with nasalization.',
    },
    'idgham_no_ghunnah': {
        'name': 'Idgham without Ghunnah',
        'arabic_name': 'إدغام بلا غنّة',
        'color': '#AB47BC',
        'description': 'Merging Noon Sakinah/Tanween into Lam or Ra without nasalization.',
    },
    'iqlab': {
        'name': 'Iqlab',
        'arabic_name': 'إقلاب',
        'color': '#26A69A',
        'description': 'Converting Noon Sakinah/Tanween to Meem sound before Ba.',
    },
    'ikhfa': {
        'name': 'Ikhfa',
        'arabic_name': 'إخفاء',
        'color': '#FFA726',
        'description': 'Hiding the Noon Sakinah/Tanween with a nasal sound.',
    },
    'ikhfa_shafawi': {
        'name': 'Ikhfa Shafawi',
        'arabic_name': 'إخفاء شفوي',
        'color': '#EC407A',
        'description': 'Hiding Meem Sakinah before Ba with nasalization.',
    },
    'idgham_shafawi': {
        'name': 'Idgham Shafawi',
        'arabic_name': 'إدغام شفوي',
        'color': '#7E57C2',
        'description': 'Merging Meem Sakinah into another Meem.',
    },
    'idhar_shafawi': {
        'name': 'Idhar Shafawi',
        'arabic_name': 'إظهار شفوي',
        'color': '#9CCC65',
        'description': 'Clear pronunciation of Meem Sakinah before letters other than Ba and Meem.',
    },
    'qalqalah': {
        'name': 'Qalqalah',
        'arabic_name': 'قلقلة',
        'color': '#EF5350',
        'description': 'Echoing/bouncing sound on the letters Qaf, Taa, Ba, Jeem, Dal when they have Sukun.',
    },
    'madd_natural': {
        'name': 'Madd Tabee\'i',
        'arabic_name': 'مدّ طبيعي',
        'color': '#5C6BC0',
        'description': 'Natural elongation of 2 counts on Alif, Waw, or Ya.',
    },
    'madd_extended': {
        'name': 'Madd Far\'i',
        'arabic_name': 'مدّ فرعي',
        'color': '#29B6F6',
        'description': 'Extended elongation (4-6 counts) due to Hamzah or Sukun after a Madd letter.',
    },
    'lam_shamsiyyah': {
        'name': 'Lam Shamsiyyah',
        'arabic_name': 'لام شمسية',
        'color': '#FFCA28',
        'description': 'The Lam in "Al-" is silent and the following letter is doubled.',
    },
    'lam_qamariyyah': {
        'name': 'Lam Qamariyyah',
        'arabic_name': 'لام قمرية',
        'color': '#78909C',
        'description': 'The Lam in "Al-" is clearly pronounced.',
    },
}


def get_rule_info(rule_id: str) -> Dict[str, Any]:
    """Get full info for a tajweed rule by id."""
    return TAJWEED_RULE_DEFS.get(rule_id, {})


def get_all_rules() -> Dict[str, Dict[str, Any]]:
    """Return all tajweed rule definitions."""
    return TAJWEED_RULE_DEFS


# ---------------------------------------------------------------------------
# Helper: strip diacritics for base-letter extraction
# ---------------------------------------------------------------------------

_DIACRITICS_RE = re.compile(r'[\u064B-\u065F\u0670]')

def _strip_diacritics(text: str) -> str:
    return _DIACRITICS_RE.sub('', text)

def _base_letter(char: str) -> str:
    """Return the base Arabic letter stripping any attached diacritics."""
    return _DIACRITICS_RE.sub('', char)


# ---------------------------------------------------------------------------
# Core detection: scan text and return a list of rule occurrences
# Each occurrence: { rule_id, start, end, text_segment, rule_info }
# ---------------------------------------------------------------------------

def detect_tajweed_rules(text: str) -> List[Dict[str, Any]]:
    """
    Scan Arabic text and detect tajweed rule occurrences.

    Returns a list of dicts, each with:
      - rule_id: str
      - start: int  (char index in original text)
      - end: int
      - text_segment: str  (the substring that triggers the rule)
      - rule_info: dict  (from TAJWEED_RULE_DEFS)
    """
    if not text:
        return []

    rules_found: List[Dict[str, Any]] = []

    # We scan character-by-character looking for triggers
    i = 0
    length = len(text)

    while i < length:
        char = text[i]
        base = _base_letter(char)

        # --- Noon Sakinah / Tanween rules ---
        is_noon_sakin = (base == NOON and i + 1 < length and text[i + 1] == SUKUN)
        is_tanween = (char in TANWEEN or (i > 0 and text[i] in TANWEEN))

        if is_noon_sakin or is_tanween:
            # Find the next meaningful letter (skip spaces, diacritics)
            j = i + (2 if is_noon_sakin else 1)
            while j < length and (text[j] in (' ', '\u200B') or text[j] in TANWEEN or _DIACRITICS_RE.match(text[j])):
                j += 1

            if j < length:
                next_base = _base_letter(text[j])

                if next_base in IDHAR_LETTERS:
                    rule_id = 'idhar'
                elif next_base in IDGHAM_GHUNNAH_LETTERS:
                    rule_id = 'idgham_ghunnah'
                elif next_base in IDGHAM_NO_GHUNNAH_LETTERS:
                    rule_id = 'idgham_no_ghunnah'
                elif next_base == IQLAB_LETTER:
                    rule_id = 'iqlab'
                elif next_base in IKHFA_LETTERS:
                    rule_id = 'ikhfa'
                else:
                    rule_id = None

                if rule_id:
                    end_idx = j + 1
                    # Include the diacritics after the next letter
                    while end_idx < length and _DIACRITICS_RE.match(text[end_idx]):
                        end_idx += 1
                    rules_found.append({
                        'rule_id': rule_id,
                        'start': i,
                        'end': end_idx,
                        'text_segment': text[i:end_idx],
                        'rule_info': TAJWEED_RULE_DEFS[rule_id],
                    })

        # --- Meem Sakinah rules ---
        is_meem_sakin = (base == MEEM and i + 1 < length and text[i + 1] == SUKUN)

        if is_meem_sakin:
            j = i + 2
            while j < length and (text[j] in (' ', '\u200B') or _DIACRITICS_RE.match(text[j])):
                j += 1

            if j < length:
                next_base = _base_letter(text[j])
                if next_base == BA:
                    rule_id = 'ikhfa_shafawi'
                elif next_base == MEEM:
                    rule_id = 'idgham_shafawi'
                else:
                    rule_id = 'idhar_shafawi'

                end_idx = j + 1
                while end_idx < length and _DIACRITICS_RE.match(text[end_idx]):
                    end_idx += 1
                rules_found.append({
                    'rule_id': rule_id,
                    'start': i,
                    'end': end_idx,
                    'text_segment': text[i:end_idx],
                    'rule_info': TAJWEED_RULE_DEFS[rule_id],
                })

        # --- Qalqalah ---
        if base in QALQALAH_LETTERS:
            # Qalqalah applies when the letter has sukun or is at end of word/verse
            has_sukun = (i + 1 < length and text[i + 1] == SUKUN)
            at_end = (i == length - 1) or (i + 1 < length and text[i + 1] in (' ', '\n'))
            # Also at end after a diacritic
            if not has_sukun and not at_end and i + 1 < length:
                k = i + 1
                while k < length and _DIACRITICS_RE.match(text[k]):
                    k += 1
                at_end = (k >= length or text[k] == ' ')

            if has_sukun or at_end:
                end_idx = i + 2 if has_sukun else i + 1
                rules_found.append({
                    'rule_id': 'qalqalah',
                    'start': i,
                    'end': min(end_idx, length),
                    'text_segment': text[i:min(end_idx, length)],
                    'rule_info': TAJWEED_RULE_DEFS['qalqalah'],
                })

        # --- Madd (elongation) ---
        if base in MADD_LETTERS and i > 0:
            prev_base = _base_letter(text[i - 1]) if i - 1 >= 0 else ''
            # Natural madd: alif after fathah, waw after dammah, ya after kasrah
            is_natural_madd = False
            if base == ALIF and i >= 2 and text[i - 1] == FATHAH:
                is_natural_madd = True
            elif base == WAW and i >= 2 and text[i - 1] == DAMMAH:
                is_natural_madd = True
            elif base == YA and i >= 2 and text[i - 1] == KASRAH:
                is_natural_madd = True

            if is_natural_madd:
                # Check if followed by hamzah or sukun (extended madd)
                j = i + 1
                while j < length and _DIACRITICS_RE.match(text[j]):
                    j += 1
                if j < length and _base_letter(text[j]) in {'\u0621', '\u0623', '\u0625', '\u0626', '\u0624'}:
                    rule_id = 'madd_extended'
                elif j < length and j + 1 < length and text[j + 1] == SUKUN:
                    rule_id = 'madd_extended'
                else:
                    rule_id = 'madd_natural'

                rules_found.append({
                    'rule_id': rule_id,
                    'start': i,
                    'end': i + 1,
                    'text_segment': text[i],
                    'rule_info': TAJWEED_RULE_DEFS[rule_id],
                })

        # --- Lam of Al- (ال) ---
        if base == LAM and i >= 1:
            prev_base = _base_letter(text[i - 1])
            if prev_base == ALIF:
                # Check the letter after lam
                j = i + 1
                while j < length and _DIACRITICS_RE.match(text[j]):
                    j += 1
                if j < length:
                    next_base = _base_letter(text[j])
                    if next_base in SHAMS_LETTERS:
                        rule_id = 'lam_shamsiyyah'
                    else:
                        rule_id = 'lam_qamariyyah'
                    rules_found.append({
                        'rule_id': rule_id,
                        'start': i - 1,
                        'end': j + 1,
                        'text_segment': text[i - 1:j + 1],
                        'rule_info': TAJWEED_RULE_DEFS[rule_id],
                    })

        # --- Ghunnah (shaddah on noon or meem) ---
        if base in {NOON, MEEM} and i + 1 < length and text[i + 1] == SHADDAH:
            rules_found.append({
                'rule_id': 'ghunnah',
                'start': i,
                'end': i + 2,
                'text_segment': text[i:i + 2],
                'rule_info': TAJWEED_RULE_DEFS['ghunnah'],
            })

        i += 1

    # Deduplicate overlapping rules (keep the more specific one)
    return _deduplicate_rules(rules_found)


def _deduplicate_rules(rules: List[Dict]) -> List[Dict]:
    """Remove duplicate/overlapping rule detections, preferring more specific rules."""
    if not rules:
        return rules

    # Sort by start position, then by specificity (shorter spans are more specific)
    rules.sort(key=lambda r: (r['start'], r['end'] - r['start']))

    deduped = []
    for rule in rules:
        # Check if this overlaps with the last added rule
        if deduped and rule['start'] < deduped[-1]['end'] and rule['rule_id'] == deduped[-1]['rule_id']:
            continue  # Skip duplicate
        deduped.append(rule)

    return deduped


# ---------------------------------------------------------------------------
# Classify a mistake with tajweed context
# ---------------------------------------------------------------------------

def classify_tajweed_mistake(correct_text: str, incorrect_text: str, position: int) -> Dict[str, Any]:
    """
    Given a mistake (correct vs incorrect text at a position), determine
    if a tajweed rule was violated and return enriched mistake info.
    """
    # Detect rules in the correct text around the mistake position
    rules_in_correct = detect_tajweed_rules(correct_text)

    # Find rules that overlap with the mistake position
    relevant_rules = [
        r for r in rules_in_correct
        if r['start'] <= position < r['end']
    ]

    if relevant_rules:
        rule = relevant_rules[0]
        return {
            'is_tajweed': True,
            'rule_id': rule['rule_id'],
            'rule_name': rule['rule_info']['name'],
            'rule_arabic': rule['rule_info']['arabic_name'],
            'rule_description': rule['rule_info']['description'],
            'rule_color': rule['rule_info']['color'],
            'suggestion': _tajweed_suggestion(rule['rule_id'], correct_text, incorrect_text),
        }

    return {
        'is_tajweed': False,
        'rule_id': None,
        'suggestion': None,
    }


def _tajweed_suggestion(rule_id: str, correct: str, incorrect: str) -> str:
    """Generate a tajweed-specific suggestion for a mistake."""
    suggestions = {
        'ghunnah': f'Hold the nasalization (ghunnah) for 2 counts on "{correct}".',
        'idhar': f'Pronounce the Noon clearly before the throat letter in "{correct}".',
        'idgham_ghunnah': f'Merge the Noon into the next letter with nasalization in "{correct}".',
        'idgham_no_ghunnah': f'Merge the Noon fully into the next letter without nasalization in "{correct}".',
        'iqlab': f'Convert the Noon sound to Meem before the Ba in "{correct}".',
        'ikhfa': f'Hide the Noon with a light nasal sound in "{correct}".',
        'ikhfa_shafawi': f'Hide the Meem before Ba with nasalization in "{correct}".',
        'idgham_shafawi': f'Merge the Meem into the next Meem in "{correct}".',
        'idhar_shafawi': f'Pronounce the Meem clearly in "{correct}".',
        'qalqalah': f'Add an echoing bounce to the letter in "{correct}".',
        'madd_natural': f'Elongate the sound for 2 counts in "{correct}".',
        'madd_extended': f'Elongate the sound for 4-6 counts in "{correct}".',
        'lam_shamsiyyah': f'The Lam is silent here — double the next letter in "{correct}".',
        'lam_qamariyyah': f'Pronounce the Lam clearly in "{correct}".',
    }
    return suggestions.get(rule_id, f'Review the tajweed rule for "{correct}".')
