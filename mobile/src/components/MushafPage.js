import React, { useState, useEffect, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

// In-memory cache keyed by page number
const pageCache = {};

async function fetchPage(pageNumber) {
  if (pageCache[pageNumber]) return pageCache[pageNumber];

  const res = await api.getVersesByPage(pageNumber);
  const verses = res.data.verses || [];
  if (verses.length === 0) throw new Error('No verses returned');

  // Flatten all words, tagging each with verse info
  const allWords = [];
  const surahStarts = []; // track surahs that start on this page

  verses.forEach((v) => {
    const [surah, verseNum] = v.verse_key.split(':').map(Number);
    if (verseNum === 1) {
      surahStarts.push({ surah, verseKey: v.verse_key });
    }
    (v.words || []).forEach((w) => {
      allWords.push({ ...w, surah, verseNum, verseKey: v.verse_key });
    });
  });

  // Group words by line_number
  const lineMap = {};
  allWords.forEach((w) => {
    const ln = w.line_number || 0;
    if (!lineMap[ln]) lineMap[ln] = [];
    lineMap[ln].push(w);
  });

  const lineNumbers = Object.keys(lineMap).map(Number).sort((a, b) => a - b);
  const lines = lineNumbers.map((ln) => ({ lineNumber: ln, words: lineMap[ln] }));

  const pageData = { page: pageNumber, lines, surahStarts };
  pageCache[pageNumber] = pageData;
  return pageData;
}

function prefetchPages(currentPage, startPage, endPage) {
  [currentPage - 1, currentPage + 1, currentPage + 2]
    .filter((p) => p >= startPage && p <= endPage && !pageCache[p])
    .forEach((p) => fetchPage(p).catch(() => {}));
}

// Surah names in Arabic for headers
const SURAH_NAMES = {
  1: 'الفاتحة', 2: 'البقرة', 3: 'آل عمران', 4: 'النساء', 5: 'المائدة',
  6: 'الأنعام', 7: 'الأعراف', 8: 'الأنفال', 9: 'التوبة', 10: 'يونس',
  11: 'هود', 12: 'يوسف', 13: 'الرعد', 14: 'إبراهيم', 15: 'الحجر',
  16: 'النحل', 17: 'الإسراء', 18: 'الكهف', 19: 'مريم', 20: 'طه',
  21: 'الأنبياء', 22: 'الحج', 23: 'المؤمنون', 24: 'النور', 25: 'الفرقان',
  26: 'الشعراء', 27: 'النمل', 28: 'القصص', 29: 'العنكبوت', 30: 'الروم',
  31: 'لقمان', 32: 'السجدة', 33: 'الأحزاب', 34: 'سبأ', 35: 'فاطر',
  36: 'يس', 37: 'الصافات', 38: 'ص', 39: 'الزمر', 40: 'غافر',
  41: 'فصلت', 42: 'الشورى', 43: 'الزخرف', 44: 'الدخان', 45: 'الجاثية',
  46: 'الأحقاف', 47: 'محمد', 48: 'الفتح', 49: 'الحجرات', 50: 'ق',
  51: 'الذاريات', 52: 'الطور', 53: 'النجم', 54: 'القمر', 55: 'الرحمن',
  56: 'الواقعة', 57: 'الحديد', 58: 'المجادلة', 59: 'الحشر', 60: 'الممتحنة',
  61: 'الصف', 62: 'الجمعة', 63: 'المنافقون', 64: 'التغابن', 65: 'الطلاق',
  66: 'التحريم', 67: 'الملك', 68: 'القلم', 69: 'الحاقة', 70: 'المعارج',
  71: 'نوح', 72: 'الجن', 73: 'المزمل', 74: 'المدثر', 75: 'القيامة',
  76: 'الإنسان', 77: 'المرسلات', 78: 'النبأ', 79: 'النازعات', 80: 'عبس',
  81: 'التكوير', 82: 'الانفطار', 83: 'المطففين', 84: 'الانشقاق', 85: 'البروج',
  86: 'الطارق', 87: 'الأعلى', 88: 'الغاشية', 89: 'الفجر', 90: 'البلد',
  91: 'الشمس', 92: 'الليل', 93: 'الضحى', 94: 'الشرح', 95: 'التين',
  96: 'العلق', 97: 'القدر', 98: 'البينة', 99: 'الزلزلة', 100: 'العاديات',
  101: 'القارعة', 102: 'التكاثر', 103: 'العصر', 104: 'الهمزة', 105: 'الفيل',
  106: 'قريش', 107: 'الماعون', 108: 'الكوثر', 109: 'الكافرون', 110: 'النصر',
  111: 'المسد', 112: 'الإخلاص', 113: 'الفلق', 114: 'الناس',
};

function MushafPage({
  pageNumber,
  surahNumber,
  playingVerse,
  selectedVerse,
  isPlaying,
  onVerseSelect,
  onVerseLongPress,
  arabicFontSize = 22,
  tajweedEnabled,
  renderTajweedSpans,
}) {
  const { theme, isDark } = useTheme();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const s = createStyles(theme, isDark, arabicFontSize);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPage(pageNumber)
      .then((data) => {
        if (!cancelled) {
          setPageData(data);
          prefetchPages(pageNumber, 1, 604);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.log('Mushaf page load error:', pageNumber, err.message);
          delete pageCache[pageNumber];
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [pageNumber, retryCount]);

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (error || !pageData) {
    return (
      <View style={s.centered}>
        <Text style={s.errorText}>Could not load page {pageNumber}</Text>
        <TouchableOpacity onPress={() => setRetryCount((c) => c + 1)} style={s.retryBtn}>
          <Text style={s.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check which lines start a new surah for header insertion
  const surahStartLines = {};
  pageData.surahStarts.forEach(({ surah }) => {
    // Find the line that contains verse 1 word 1 of this surah
    const line = pageData.lines.find((l) =>
      l.words.some((w) => w.surah === surah && w.verseNum === 1 && w.position === 1)
    );
    if (line) surahStartLines[line.lineNumber] = surah;
  });

  const renderSurahHeader = (surahNum) => (
    <View style={s.surahHeader}>
      <View style={s.surahHeaderLine} />
      <View style={s.surahHeaderContent}>
        <Text style={s.surahHeaderText}>
          سُورَةُ {SURAH_NAMES[surahNum] || surahNum}
        </Text>
      </View>
      <View style={s.surahHeaderLine} />
    </View>
  );

  const renderBismillah = () => (
    <View style={s.bismillah}>
      <Text style={s.bismillahText}>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ</Text>
    </View>
  );

  const renderLine = (line) => {
    const words = line.words;
    if (!words || words.length === 0) return null;

    // Check if surah header should appear above this line
    const surahNum = surahStartLines[line.lineNumber];
    const showHeader = surahNum !== undefined;
    // Show bismillah for all surahs except 1 (Al-Fatiha, has it in text) and 9 (At-Tawbah, no bismillah)
    const showBismillah = showHeader && surahNum !== 1 && surahNum !== 9;

    return (
      <View key={`line-${line.lineNumber}`}>
        {showHeader && renderSurahHeader(surahNum)}
        {showBismillah && renderBismillah()}

        <View style={s.textLine}>
          <Text style={s.lineText}>
            {words.map((w, wi) => {
              const isEnd = w.char_type_name === 'end';
              const isActive = playingVerse === w.verseNum;
              const isSelected = selectedVerse === w.verseNum && !playingVerse;

              if (isEnd) {
                return (
                  <Text key={`${line.lineNumber}-${wi}`} style={s.verseEnd}>
                    {' '}{w.text_uthmani || w.text}{' '}
                  </Text>
                );
              }

              return (
                <Text
                  key={`${line.lineNumber}-${wi}`}
                  style={[
                    s.word,
                    isActive && s.wordActive,
                    isSelected && s.wordSelected,
                  ]}
                  onPress={() => onVerseSelect?.(w.verseNum)}
                  onLongPress={() => onVerseLongPress?.(w.verseKey)}
                >
                  {w.text_uthmani || w.text}
                  {wi < words.length - 1 && words[wi + 1]?.char_type_name !== 'end' ? ' ' : ''}
                </Text>
              );
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={s.page}>
      {/* Top border — clean double line */}
      <View style={s.topBorder}>
        <View style={s.borderOuter} />
        <View style={s.borderInner} />
      </View>

      {/* Page content */}
      <View style={s.pageContent}>
        {pageData.lines.map((line) => renderLine(line))}
      </View>

      {/* Bottom border */}
      <View style={s.bottomBorder}>
        <View style={s.borderInner} />
        <View style={s.borderOuter} />
      </View>

      {/* Page number */}
      <Text style={s.pageNum}>{pageNumber}</Text>
    </View>
  );
}

export default memo(MushafPage);

const ACCENT = '#2ca4ab'; // Quran.com teal accent

const createStyles = (theme, isDark, arabicFontSize) =>
  StyleSheet.create({
    centered: {
      padding: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      fontSize: 14,
      color: theme.colors.textMuted,
    },
    retryBtn: {
      marginTop: 14,
      paddingVertical: 8,
      paddingHorizontal: 24,
      borderRadius: 8,
      backgroundColor: ACCENT + '18',
    },
    retryText: {
      color: ACCENT,
      fontSize: 14,
      ...theme.fonts.semiBold,
    },

    /* ── Page frame — clean, minimal ── */
    page: {
      backgroundColor: isDark ? theme.colors.bgCard : '#fff',
      marginHorizontal: 4,
      marginBottom: 20,
      borderRadius: 2,
    },

    /* ── Double-line borders (top & bottom) ── */
    topBorder: {
      paddingTop: 8,
      gap: 3,
    },
    bottomBorder: {
      paddingBottom: 8,
      gap: 3,
    },
    borderOuter: {
      height: 1.5,
      backgroundColor: isDark ? theme.colors.border : '#c8a96e',
      marginHorizontal: 8,
    },
    borderInner: {
      height: 0.75,
      backgroundColor: isDark ? theme.colors.borderLight : '#dcc9a0',
      marginHorizontal: 14,
    },

    /* ── Surah header — centered calligraphic text ── */
    surahHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 12,
      paddingHorizontal: 8,
    },
    surahHeaderLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? theme.colors.border : '#dcc9a0',
    },
    surahHeaderContent: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: isDark ? theme.colors.bgCard : '#fff',
      borderWidth: 1,
      borderColor: isDark ? theme.colors.border : '#dcc9a0',
      borderRadius: 20,
    },
    surahHeaderText: {
      fontSize: 18,
      color: isDark ? theme.colors.textPrimary : '#3d2e1a',
      ...theme.fonts.bold,
      textAlign: 'center',
      writingDirection: 'rtl',
    },

    /* ── Bismillah ── */
    bismillah: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    bismillahText: {
      fontSize: arabicFontSize - 2,
      color: isDark ? theme.colors.textSecondary : '#5a4a3a',
      textAlign: 'center',
      writingDirection: 'rtl',
    },

    /* ── Page content area ── */
    pageContent: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      minHeight: arabicFontSize * 2 * 15, // roughly 15 lines
    },

    /* ── Text lines ── */
    textLine: {
      minHeight: arabicFontSize * 2.2,
      justifyContent: 'center',
      paddingVertical: 0,
    },
    lineText: {
      fontSize: arabicFontSize,
      lineHeight: arabicFontSize * 2.2,
      color: isDark ? theme.colors.textPrimary : '#1a1a1a',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    word: {
      // Inherits from lineText
    },
    wordActive: {
      color: ACCENT,
      backgroundColor: ACCENT + '15',
      borderRadius: 2,
    },
    wordSelected: {
      backgroundColor: ACCENT + '0D',
    },
    verseEnd: {
      fontSize: arabicFontSize - 4,
      color: isDark ? theme.colors.textMuted : '#8a7a6a',
    },

    /* ── Page number ── */
    pageNum: {
      textAlign: 'center',
      fontSize: 13,
      color: isDark ? theme.colors.textMuted : '#999',
      paddingVertical: 8,
      letterSpacing: 1,
    },
  });
