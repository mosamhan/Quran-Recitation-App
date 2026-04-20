import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopNav from '../components/TopNav';
import AudioPlayerBar from '../components/AudioPlayerBar';
import MushafSettingsSheet from '../components/MushafSettingsSheet';
import RecitationOverlay from '../components/RecitationOverlay';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import MushafPage from '../components/MushafPage';
import TafsirSheet from '../components/TafsirSheet';
import { getSurahPageRange } from '../data/quranMeta';

// Tajweed CSS class → color mapping (matches Quran.com <tajweed class=...> markup)
const TAJWEED_CLASS_COLORS = {
  ham_wasl: '#AAAAAA',           // gray – hamzat al-wasl (silent)
  laam_shamsiyah: '#AAAAAA',     // gray – laam shamsiyyah (silent)
  madda_normal: '#1abc9c',       // teal – normal madd
  madda_permissible: '#1abc9c',  // teal – permissible madd
  madda_necessary: '#e74c3c',    // red – necessary madd (6 counts)
  madda_obligatory: '#e67e22',   // orange – obligatory madd
  qalqalah: '#e74c3c',           // red – echoing
  ghunnah: '#2ecc71',            // green – nasalization
  idghaam_ghunnah: '#3498db',    // blue – assimilation with ghunna
  idghaam_no_ghunnah: '#3498db', // blue – assimilation without ghunna
  ikhfa_shafawi: '#9b59b6',     // purple – oral hiding
  ikhfa: '#9b59b6',             // purple – hiding
  iqlab: '#e67e22',             // orange – conversion
  // Fallback for local detection
  ghunna: '#2ecc71',
  idgham: '#3498db',
  madd: '#1abc9c',
};

// In-memory verse cache keyed by "chapter:translationId"
const verseCache = {};

export default function ChapterDetailScreen({ route, navigation }) {
  const { chapter } = route.params;
  const { theme, isDark } = useTheme();
  const {
    showTranslation,
    showArabicVerse,
    mushafLayout,
    arabicFontSize,
    tajweedEnabled,
    showTransliteration,
    showWordByWord,
    translationSource,
    wordHighlightEnabled,
  } = useSettings();

  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingVerse, setPlayingVerse] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reciters, setReciters] = useState([]);
  const [selectedReciter, setSelectedReciter] = useState('alafasy');
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const [showMushafSettings, setShowMushafSettings] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [fabMode, setFabMode] = useState('listen');
  const [showRecitationOverlay, setShowRecitationOverlay] = useState(false);
  const [recitationMode, setRecitationMode] = useState('verse'); // 'verse' or 'free'
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const playbackSpeedRef = useRef(1);
  const [currentMushafPage, setCurrentMushafPage] = useState(null);
  const [activeWord, setActiveWord] = useState(null); // { verse, position }
  const [showTafsir, setShowTafsir] = useState(false);
  const [tafsirVerseKey, setTafsirVerseKey] = useState(null);
  const [audioSegments, setAudioSegments] = useState(null); // verse_timings array

  const soundRef = useRef(null);
  const flatListRef = useRef(null);
  const playingVerseRef = useRef(null);
  const isPlayingRef = useRef(false);
  const isLoadingAudioRef = useRef(false);
  const versesRef = useRef([]);
  const wordTrackingRef = useRef(null); // interval ID for word tracking
  const audioSegmentsRef = useRef(null);

  const verseNum = (v) => v.verse_number || v.number_in_surah || v.number;
  const s = createStyles(theme, isDark, arabicFontSize);
  const chapterNumber = chapter.number || chapter.id;
  const chapterName = chapter.name_simple || chapter.english_name;
  const totalVerses = chapter.number_of_verses || chapter.verses_count || verses.length;

  useEffect(() => {
    loadVerses();
    loadReciters();
    return () => {
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current.remove();
      }
      if (wordTrackingRef.current) clearInterval(wordTrackingRef.current);
    };
  }, []);

  // Reload verses when translation source changes
  useEffect(() => {
    if (verses.length > 0) loadVerses();
  }, [translationSource]);

  useEffect(() => {
    versesRef.current = verses;
  }, [verses]);

  const loadVerses = async () => {
    try {
      const translationId = api.TRANSLATION_IDS[translationSource] || 20;
      const cacheKey = `${chapterNumber}:${translationId}`;

      // Return cached data instantly if available
      if (verseCache[cacheKey]) {
        setVerses(verseCache[cacheKey]);
        setLoading(false);
        // Preload audio in background
        const rid = api.QURAN_COM_RECITERS[selectedReciter] || 7;
        if (!audioSegmentsRef.current) loadAudioSegments(rid).catch(() => null);
        return;
      }

      // Fetch ALL data in parallel — words, translations, tajweed, and audio segments
      const reciterId = api.QURAN_COM_RECITERS[selectedReciter] || 7;
      const [wordsResult, translationResult, tajweedResult] = await Promise.all([
        // Words (paginated — fetch first page, then remaining in parallel)
        (async () => {
          const firstRes = await api.getVersesWithWords(chapterNumber, {
            page: 1, perPage: 50, translationId,
          });
          const firstData = firstRes.data;
          const totalPages = firstData.pagination?.total_pages || 1;
          let allVerses = firstData.verses || [];

          if (totalPages > 1) {
            const pagePromises = [];
            for (let p = 2; p <= totalPages; p++) {
              pagePromises.push(
                api.getVersesWithWords(chapterNumber, { page: p, perPage: 50, translationId })
                  .then((res) => ({ page: p, verses: res.data.verses || [] }))
              );
            }
            const pages = await Promise.all(pagePromises);
            pages.sort((a, b) => a.page - b.page);
            for (const pg of pages) allVerses = allVerses.concat(pg.verses);
          }
          return allVerses;
        })(),
        // Verse-level translations
        api.getTranslations(translationId, chapterNumber)
          .then((res) => res.data.translations || [])
          .catch(() => []),
        // Tajweed markup (fetch even if disabled — it's small and avoids reload)
        api.getTajweedVerses(chapterNumber)
          .then((res) => {
            const map = {};
            (res.data.verses || []).forEach((v) => { map[v.verse_key] = v.text_uthmani_tajweed; });
            return map;
          })
          .catch(() => ({})),
        // Preload audio segments in background (don't block verse display)
        loadAudioSegments(reciterId).catch(() => null),
      ]);

      // Merge translations + tajweed into verse data
      const enrichedVerses = wordsResult.map((v, i) => {
        let transText = translationResult[i]?.text || '';
        transText = transText.replace(/<[^>]+>/g, '');
        return {
          ...v,
          translation: transText || null,
          tajweed_text: tajweedResult[v.verse_key] || null,
        };
      });

      verseCache[cacheKey] = enrichedVerses;
      setVerses(enrichedVerses);
    } catch (err) {
      console.log('Verse load error:', err);
      // Fallback to local backend
      try {
        const res = await api.getQuranChapter(chapterNumber);
        setVerses(res.data.verses || res.data);
      } catch {
        // Silent fail
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReciters = async () => {
    try {
      const res = await api.getQuranComReciters();
      setReciters(res.data.recitations || []);
    } catch {
      // Fallback to local backend
      try {
        const res = await api.getReciters();
        setReciters(res.data.reciters || res.data || []);
      } catch {
        // Use default reciter
      }
    }
  };

  const loadAudioSegments = async (reciterId) => {
    try {
      const res = await api.getAudioSegments(reciterId, chapterNumber);
      const audioFile = res.data.audio_files?.[0];
      if (audioFile) {
        audioSegmentsRef.current = audioFile;
        setAudioSegments(audioFile);
        return audioFile;
      }
    } catch {
      // Segments not available
    }
    return null;
  };

  const setPlayingState = (val) => {
    isPlayingRef.current = val;
    setIsPlaying(val);
  };

  /**
   * Start word-level tracking using audio segments.
   * Polls the player's currentTime and updates activeWord + playingVerse.
   */
  const startWordTracking = (segmentData) => {
    if (wordTrackingRef.current) clearInterval(wordTrackingRef.current);
    if (!segmentData?.verse_timings || !wordHighlightEnabled) return;

    wordTrackingRef.current = setInterval(() => {
      const player = soundRef.current;
      if (!player || !isPlayingRef.current) return;

      const currentMs = (player.currentTime || 0) * 1000;
      const timings = segmentData.verse_timings;

      // Find current verse
      for (let i = 0; i < timings.length; i++) {
        const vt = timings[i];
        if (currentMs >= vt.timestamp_from && currentMs < vt.timestamp_to) {
          const [, verseStr] = vt.verse_key.split(':');
          const verseNumber = parseInt(verseStr, 10);

          // Update verse if changed
          if (playingVerseRef.current !== verseNumber) {
            playingVerseRef.current = verseNumber;
            setPlayingVerse(verseNumber);
            scrollToVerse(verseNumber);
          }

          // Find current word within verse segments
          if (vt.segments && wordHighlightEnabled) {
            const relativeMs = currentMs - vt.timestamp_from;
            let foundWord = null;
            for (const seg of vt.segments) {
              if (seg.length >= 3) {
                const [wordPos, startMs, endMs] = seg;
                if (relativeMs >= startMs - vt.timestamp_from && relativeMs < endMs - vt.timestamp_from) {
                  foundWord = { verse: verseNumber, position: wordPos };
                  break;
                }
              }
            }
            // Try with absolute timestamps
            if (!foundWord) {
              for (const seg of vt.segments) {
                if (seg.length >= 3) {
                  const [wordPos, startMs, endMs] = seg;
                  if (currentMs >= startMs && currentMs < endMs) {
                    foundWord = { verse: verseNumber, position: wordPos };
                    break;
                  }
                }
              }
            }
            setActiveWord(foundWord);
          }
          break;
        }
      }
    }, 50); // Poll every 50ms for smooth tracking
  };

  const stopWordTracking = () => {
    if (wordTrackingRef.current) {
      clearInterval(wordTrackingRef.current);
      wordTrackingRef.current = null;
    }
    setActiveWord(null);
  };

  const playVerse = useCallback(async (verseNumber) => {
    if (isLoadingAudioRef.current) return;
    try {
      // Stop any current player
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current.remove();
        soundRef.current = null;
      }
      stopWordTracking();

      // If same verse is playing, toggle off
      if (playingVerseRef.current === verseNumber && isPlayingRef.current) {
        playingVerseRef.current = null;
        setPlayingVerse(null);
        setPlayingState(false);
        return;
      }
      isLoadingAudioRef.current = true;

      // Determine reciter ID for Quran.com API
      const reciterId = api.QURAN_COM_RECITERS[selectedReciter] || 7;

      // Load audio segments if not already loaded
      let segmentData = audioSegmentsRef.current;
      if (!segmentData) {
        segmentData = await loadAudioSegments(reciterId);
      }

      let audioUrl;
      let seekTo = 0;

      if (segmentData?.audio_url) {
        // Use chapter-level audio with seeking
        audioUrl = segmentData.audio_url;
        // Find the timestamp for this verse
        const verseTiming = segmentData.verse_timings?.find(
          (vt) => vt.verse_key === `${chapterNumber}:${verseNumber}`
        );
        if (verseTiming) {
          seekTo = verseTiming.timestamp_from / 1000; // convert to seconds
        }
      } else {
        // Fallback: per-verse audio from local backend
        try {
          const res = await api.getChapterAudio(chapterNumber, verseNumber, selectedReciter);
          audioUrl = res.data.audio_url;
        } catch {
          // Try Quran.com per-verse audio
          const verseRes = await api.getVerseAudioUrls(reciterId, chapterNumber);
          const verseAudio = verseRes.data.audio_files?.find(
            (af) => af.verse_key === `${chapterNumber}:${verseNumber}`
          );
          if (verseAudio) {
            audioUrl = api.buildAudioUrl(verseAudio.url);
          }
        }
      }

      isLoadingAudioRef.current = false;
      if (!audioUrl) return;

      await setAudioModeAsync({ playsInSilentMode: true });
      const player = createAudioPlayer({ uri: audioUrl });
      soundRef.current = player;
      playingVerseRef.current = verseNumber;
      setPlayingVerse(verseNumber);
      setPlayingState(true);

      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          stopWordTracking();
          playingVerseRef.current = null;
          setPlayingState(false);
          setPlayingVerse(null);
          player.remove();
          soundRef.current = null;
        }
      });

      if (playbackSpeedRef.current !== 1) {
        player.rate = playbackSpeedRef.current;
      }

      // Seek to verse start if using chapter audio
      if (seekTo > 0) {
        player.seekTo(seekTo);
      }

      player.play();

      // Start word-level tracking
      if (segmentData && wordHighlightEnabled) {
        startWordTracking(segmentData);
      }
    } catch (err) {
      console.log('Audio error:', err);
      isLoadingAudioRef.current = false;
      playingVerseRef.current = null;
      setPlayingVerse(null);
      setPlayingState(false);
    }
  }, [selectedReciter, chapterNumber, totalVerses, wordHighlightEnabled]);

  const handlePlayPause = () => {
    if (!soundRef.current) return;
    if (isPlayingRef.current) {
      soundRef.current.pause();
      setPlayingState(false);
    } else {
      soundRef.current.play();
      setPlayingState(true);
    }
  };

  const handleNext = () => {
    const current = playingVerseRef.current;
    if (current && current < totalVerses) {
      playVerse(current + 1);
      scrollToVerse(current + 1);
    }
  };

  const handlePrevious = () => {
    const current = playingVerseRef.current;
    if (current && current > 1) {
      playVerse(current - 1);
      scrollToVerse(current - 1);
    }
  };

  const handleClose = () => {
    stopWordTracking();
    if (soundRef.current) {
      soundRef.current.pause();
      soundRef.current.remove();
      soundRef.current = null;
    }
    playingVerseRef.current = null;
    setPlayingVerse(null);
    setPlayingState(false);
  };

  const handleSpeedChange = (speed) => {
    playbackSpeedRef.current = speed;
    setPlaybackSpeed(speed);
    if (soundRef.current) {
      soundRef.current.rate = speed;
    }
  };

  const handleStartPlay = () => {
    const verse = selectedVerse || 1;
    playVerse(verse);
    scrollToVerse(verse);
  };

  const handleRecite = () => {
    if (showRecitationOverlay) {
      setShowRecitationOverlay(false);
    } else {
      // If a verse is selected, use verse mode; otherwise free mode
      if (selectedVerse) {
        setRecitationMode('verse');
      } else {
        setRecitationMode('free');
      }
      const verse = selectedVerse || 1;
      setSelectedVerse(verse);
      setShowRecitationOverlay(true);
      handleClose();
    }
  };

  const scrollToVerse = (verseNumber) => {
    const index = versesRef.current.findIndex((v) => verseNum(v) === verseNumber);
    if (index >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index, animated: true, viewPosition: 0.3 });
    }
  };

  const handleVerseSelect = (verseNumber) => {
    setSelectedVerse(verseNumber);
  };

  const openTafsir = (verseKey) => {
    // Accept either a verse_key string like "2:5" or a verse number
    const key = typeof verseKey === 'string' && verseKey.includes(':')
      ? verseKey
      : `${chapterNumber}:${verseKey}`;
    setTafsirVerseKey(key);
    setShowTafsir(true);
  };

  const getSelectedVerseText = () => {
    const v = versesRef.current.find((verse) => verseNum(verse) === selectedVerse);
    return v ? (v.text_uthmani || v.text || '') : '';
  };

  const getReciterLabel = () => {
    const reciterId = api.QURAN_COM_RECITERS[selectedReciter];
    const r = reciters.find((rc) =>
      rc.id === reciterId || rc.id === selectedReciter || rc.identifier === selectedReciter
    );
    return r?.reciter_name || r?.name || selectedReciter;
  };

  /**
   * Parse Quran.com tajweed markup: <tajweed class=rule_name>text</tajweed>
   * into colored <Text> spans for React Native.
   */
  const renderTajweedMarkup = (tajweedHtml) => {
    if (!tajweedHtml) return null;
    const parts = [];
    let remaining = tajweedHtml;
    let key = 0;

    // Match <tajweed class=...>...</tajweed> and <span class=end>...</span>
    // Handles quoted/unquoted attributes and nested content
    const tagRegex = /<(?:tajweed|rule)\s+class="?([^">]+)"?>([^<]*(?:<(?!\/(?:tajweed|rule)>)[^<]*)*)<\/(?:tajweed|rule)>|<span\s+class="?end"?>([^<]*)<\/span>/g;
    let lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(remaining)) !== null) {
      // Add text before this tag
      if (match.index > lastIndex) {
        const between = remaining.slice(lastIndex, match.index).replace(/<[^>]+>/g, '');
        if (between) parts.push(<Text key={key++}>{between}</Text>);
      }
      if (match[3] !== undefined) {
        // Verse end marker
        parts.push(
          <Text key={key++} style={{ fontSize: arabicFontSize - 6, color: theme.colors.textMuted }}>
            {match[3]}
          </Text>
        );
      } else {
        // Tajweed rule — strip any nested HTML from inner text
        const ruleClass = match[1];
        const ruleText = match[2].replace(/<[^>]+>/g, '');
        const color = TAJWEED_CLASS_COLORS[ruleClass];
        parts.push(
          <Text key={key++} style={color ? { color } : undefined}>
            {ruleText}
          </Text>
        );
      }
      lastIndex = match.index + match[0].length;
    }
    // Remaining text — strip any leftover HTML
    if (lastIndex < remaining.length) {
      const tail = remaining.slice(lastIndex).replace(/<[^>]+>/g, '');
      if (tail) parts.push(<Text key={key++}>{tail}</Text>);
    }
    return parts;
  };

  // Render tajweed spans (for MushafPage component — uses plain text fallback)
  const renderTajweedSpans = (text) => {
    // Simple inline coloring for mushaf page words (no API markup available)
    return [<Text key="plain">{text}</Text>];
  };

  /**
   * Render verse Arabic text — either with API tajweed or plain.
   * Supports word-level highlighting when `activeWord` matches.
   */
  const renderVerseArabic = (item) => {
    const vn = verseNum(item);
    const isActive = playingVerse === vn;

    // If verse has word-level data from Quran.com API, render word-by-word
    if (item.words && item.words.length > 0) {
      return (
        <Text style={s.arabicText}>
          {item.words.map((w, wi) => {
            if (w.char_type_name === 'end') {
              return (
                <Text key={wi} style={s.verseEndMarker}>
                  {' '}{w.text_uthmani || w.text}{' '}
                </Text>
              );
            }
            const isWordActive = activeWord
              && activeWord.verse === vn
              && activeWord.position === w.position;

            return (
              <Text
                key={wi}
                style={[
                  isWordActive && s.wordHighlight,
                  isActive && !isWordActive && s.wordDimmed,
                ]}
              >
                {tajweedEnabled && w.text_uthmani_tajweed
                  ? renderTajweedMarkup(w.text_uthmani_tajweed)
                  : (w.text_uthmani || w.text)}
                {wi < item.words.length - 1 ? ' ' : ''}
              </Text>
            );
          })}
        </Text>
      );
    }

    // Fallback: verse-level tajweed from API or plain text
    if (tajweedEnabled && item.tajweed_text) {
      return (
        <Text style={s.arabicText}>
          {renderTajweedMarkup(item.tajweed_text)}
        </Text>
      );
    }

    return <Text style={s.arabicText}>{item.text_uthmani || item.text || ''}</Text>;
  };

  /**
   * Render word-by-word translation row (English meaning under each Arabic word)
   */
  const renderWordByWord = (item) => {
    if (!item.words) return null;
    const words = item.words.filter((w) => w.char_type_name === 'word');
    return (
      <View style={s.wbwContainer}>
        {words.map((w, wi) => (
          <View key={wi} style={s.wbwWord}>
            <Text style={s.wbwArabic}>{w.text_uthmani || w.text}</Text>
            {showWordByWord && w.translation?.text && (
              <Text style={s.wbwTranslation}>{w.translation.text}</Text>
            )}
            {showTransliteration && w.transliteration?.text && (
              <Text style={s.wbwTransliteration}>{w.transliteration.text}</Text>
            )}
          </View>
        ))}
      </View>
    );
  };

  /**
   * Get verse-level translation text.
   * Quran.com embeds it in words or as a separate translations array.
   */
  const getVerseTranslation = (item) => {
    // Prefer our pre-cleaned translation field (HTML already stripped)
    if (item.translation) return item.translation;
    // Fallback: verse-level translations array from Quran.com (strip HTML)
    if (item.translations && item.translations.length > 0) {
      return (item.translations[0].text || '').replace(/<[^>]+>/g, '');
    }
    return null;
  };

  /* ── Translation layout (default): verse cards with Arabic + translation ── */
  const renderTranslationVerse = ({ item }) => {
    const vn = verseNum(item);
    const isActive = playingVerse === vn;
    const isSelected = selectedVerse === vn;
    const translationText = getVerseTranslation(item);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handleVerseSelect(vn)}
        style={[
          s.verseCard,
          isActive && s.verseCardActive,
          isSelected && !isActive && s.verseCardSelected,
        ]}
      >
        <View style={s.verseHeader}>
          <View style={[s.verseBadge, isActive && s.verseBadgeActive]}>
            <Text style={[s.verseBadgeText, isActive && { color: '#fff' }]}>
              {chapterNumber}:{vn}
            </Text>
          </View>
          <View style={s.verseActions}>
            {isActive && (
              <Ionicons
                name={isPlaying ? 'volume-high' : 'pause'}
                size={14}
                color={theme.colors.primary}
              />
            )}
            <TouchableOpacity
              onPress={() => openTafsir(vn)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="book-outline" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
        {showArabicVerse && renderVerseArabic(item)}
        {(showWordByWord || showTransliteration) && renderWordByWord(item)}
        {showTranslation && translationText && (
          <Text style={s.translation}>{translationText}</Text>
        )}
      </TouchableOpacity>
    );
  };

  /* ── Book layout: mushaf pages via Quran.com API ── */
  const renderBookLayout = () => {
    const { startPage, endPage } = getSurahPageRange(chapterNumber);
    const activePage = currentMushafPage || startPage;
    const totalPages = endPage - startPage + 1;
    const pageIndex = activePage - startPage + 1;

    return (
    <ScrollView
      contentContainerStyle={[s.bookScrollContainer, { paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <MushafPage
        pageNumber={activePage}
        surahNumber={chapterNumber}
        playingVerse={playingVerse}
        selectedVerse={selectedVerse}
        isPlaying={isPlaying}
        onVerseSelect={handleVerseSelect}
        onVerseLongPress={openTafsir}
        arabicFontSize={arabicFontSize}
        tajweedEnabled={tajweedEnabled}
        renderTajweedSpans={renderTajweedSpans}
      />

      {/* Page navigation — below the page, clean and minimal */}
      {totalPages > 1 && (
        <View style={s.pageNav}>
          <TouchableOpacity
            onPress={() => setCurrentMushafPage(Math.max(startPage, activePage - 1))}
            disabled={activePage <= startPage}
            style={s.pageNavBtn}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={activePage <= startPage ? theme.colors.textMuted : theme.colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={s.pageNavLabel}>
            {pageIndex} / {totalPages}
          </Text>
          <TouchableOpacity
            onPress={() => setCurrentMushafPage(Math.min(endPage, activePage + 1))}
            disabled={activePage >= endPage}
            style={s.pageNavBtn}
          >
            <Ionicons
              name="chevron-forward"
              size={18}
              color={activePage >= endPage ? theme.colors.textMuted : theme.colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Translations below mushaf page */}
      {showTranslation && (
        <View style={s.mushafTranslations}>
          {verses.map((item, i) => {
            const vn = verseNum(item);
            const trans = getVerseTranslation(item);
            return trans ? (
              <TouchableOpacity
                key={vn || i}
                onPress={() => openTafsir(vn)}
                activeOpacity={0.7}
              >
                <Text style={s.mushafTransText}>
                  <Text style={s.mushafTransNum}>{vn}. </Text>
                  {trans}
                </Text>
              </TouchableOpacity>
            ) : null;
          })}
        </View>
      )}
    </ScrollView>
    );
  };

  /* ── Quran Text layout: resizable Arabic text, no page frame ── */
  const renderQuranTextLayout = () => (
    <ScrollView
      contentContainerStyle={[s.quranTextScroll, { paddingBottom: 120 }]}
      showsVerticalScrollIndicator={false}
    >
      {chapterNumber !== 1 && chapterNumber !== 9 && (
        <Text style={s.quranBismillah}>
          بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ
        </Text>
      )}
      {verses.map((item, i) => {
        const vn = verseNum(item);
        const isActive = playingVerse === vn;
        const isSelected = selectedVerse === vn;
        return (
          <TouchableOpacity
            key={vn || i}
            activeOpacity={0.7}
            onPress={() => handleVerseSelect(vn)}
            style={[
              s.quranVerseBlock,
              isActive && s.quranVerseBlockActive,
              isSelected && !isActive && s.quranVerseBlockSelected,
            ]}
          >
            {showArabicVerse && (
              <View>
                {renderVerseArabic({ ...item, _style: s.quranArabic })}
              </View>
            )}
            {(showWordByWord || showTransliteration) && renderWordByWord(item)}
            {showTranslation && (() => {
              const trans = getVerseTranslation(item);
              return trans ? <Text style={s.quranTranslation}>{trans}</Text> : null;
            })()}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <TopNav
        showBack
        onBack={() => navigation.goBack()}
      />

      {/* Chapter info bar */}
      <View style={s.chapterHeader}>
        <Text style={s.chapterArabic}>{chapter.name_arabic}</Text>
        <Text style={s.chapterMeta}>
          {totalVerses} verses  ·  {chapter.revelation_type || chapter.revelation_place}
        </Text>
      </View>

      {/* Layout body */}
      {mushafLayout === 'book' ? (
        renderBookLayout()
      ) : mushafLayout === 'quran' ? (
        renderQuranTextLayout()
      ) : (
        <FlatList
          ref={flatListRef}
          data={verses}
          keyExtractor={(item, index) => String(verseNum(item) ?? item.id ?? index)}
          renderItem={renderTranslationVerse}
          contentContainerStyle={[s.list, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          onScrollToIndexFailed={() => {}}
          initialNumToRender={10}
          maxToRenderPerBatch={15}
          windowSize={7}
          removeClippedSubviews={true}
        />
      )}

      {/* Recitation overlay */}
      <RecitationOverlay
        mode={recitationMode}
        visible={showRecitationOverlay}
        verseText={getSelectedVerseText()}
        chapterNumber={chapterNumber}
        verseNumber={selectedVerse}
        onClose={() => setShowRecitationOverlay(false)}
        onResults={() => {}}
      />

      {/* Audio bar with integrated play button */}
      {!showRecitationOverlay && (
        <AudioPlayerBar
          versePlaying={playingVerse}
          totalVerses={totalVerses}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onClose={handleClose}
          onStartPlay={handleStartPlay}
          reciterName={getReciterLabel()}
          mode={fabMode}
          onRecite={handleRecite}
          isReciting={showRecitationOverlay}
          playbackSpeed={playbackSpeed}
          onSpeedChange={handleSpeedChange}
          onOpenSettings={() => setShowMushafSettings(true)}
          onOpenReciterPicker={() => setShowReciterPicker(true)}
          onSetMode={(m) => setFabMode(m)}
        />
      )}

      {/* Tafsir sheet */}
      <TafsirSheet
        visible={showTafsir}
        verseKey={tafsirVerseKey}
        onClose={() => setShowTafsir(false)}
      />

      {/* Mushaf settings bottom sheet */}
      <MushafSettingsSheet
        visible={showMushafSettings}
        onClose={() => setShowMushafSettings(false)}
      />

      {/* Reciter picker modal */}
      <Modal
        visible={showReciterPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReciterPicker(false)}
      >
        <TouchableOpacity
          style={s.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReciterPicker(false)}
        >
          <View style={s.modalContent}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Select Reciter</Text>
            {reciters.length === 0 ? (
              <Text style={s.emptyText}>No reciters available</Text>
            ) : (
              <FlatList
                data={reciters}
                keyExtractor={(item) => String(item.id || item.identifier)}
                renderItem={({ item }) => {
                  // Find internal key that maps to this reciter's Quran.com ID
                  const qcId = item.id;
                  const internalKey = Object.entries(api.QURAN_COM_RECITERS)
                    .find(([, v]) => v === qcId)?.[0] || String(qcId);
                  const isSelected = internalKey === selectedReciter
                    || qcId === api.QURAN_COM_RECITERS[selectedReciter];
                  const label = item.reciter_name || item.name;
                  const style_label = item.style ? ` (${item.style})` : '';
                  return (
                    <TouchableOpacity
                      style={[s.reciterItem, isSelected && s.reciterItemActive]}
                      onPress={() => {
                        setSelectedReciter(internalKey);
                        // Reset audio segments so they reload for new reciter
                        audioSegmentsRef.current = null;
                        setAudioSegments(null);
                        setShowReciterPicker(false);
                      }}
                    >
                      <Text style={[s.reciterName, isSelected && s.reciterNameActive]}>
                        {label}{style_label}
                      </Text>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                }}
                style={s.reciterList}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme, isDark, arabicFontSize) => {
  // Use theme colors instead of hard-coded gold/orange
  const markerColor = theme.colors.textMuted;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bgPrimary },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chapterHeader: {
      alignItems: 'center',
      paddingVertical: theme.spacing.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
      backgroundColor: theme.colors.bgCard,
    },
    chapterArabic: { fontSize: 22, color: theme.colors.textPrimary, marginBottom: 2 },
    chapterMeta: { fontSize: 12, color: theme.colors.textMuted },

    /* ── Translation layout ── */
    list: { padding: theme.spacing.lg },
    verseCard: {
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 1.5,
      borderColor: 'transparent',
    },
    verseCardActive: { borderColor: theme.colors.primary },
    verseCardSelected: {
      borderColor: theme.colors.accent || theme.colors.secondary,
      borderStyle: 'dashed',
    },
    verseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    verseBadge: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: theme.colors.bgPrimary,
    },
    verseBadgeActive: { backgroundColor: theme.colors.primary },
    verseBadgeText: {
      fontSize: 12,
      ...theme.fonts.bold,
      color: theme.colors.textMuted,
    },
    verseActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    playingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    arabicText: {
      fontSize: arabicFontSize,
      lineHeight: arabicFontSize * 1.9,
      color: theme.colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
      marginBottom: theme.spacing.sm,
    },
    translation: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 22,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
      paddingTop: theme.spacing.sm,
    },

    /* ── Word-level highlighting ── */
    wordHighlight: {
      color: theme.colors.primary,
      backgroundColor: theme.colors.primary + '25',
      borderRadius: 2,
    },
    wordDimmed: {
      opacity: 0.5,
    },
    verseEndMarker: {
      fontSize: arabicFontSize - 6,
      color: theme.colors.textMuted,
    },

    /* ── Word-by-word display ── */
    wbwContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      marginVertical: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
    },
    wbwWord: {
      alignItems: 'center',
      minWidth: 50,
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    wbwArabic: {
      fontSize: arabicFontSize - 4,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    wbwTranslation: {
      fontSize: 10,
      color: theme.colors.primary,
      textAlign: 'center',
      marginTop: 2,
    },
    wbwTransliteration: {
      fontSize: 9,
      color: theme.colors.textMuted,
      textAlign: 'center',
      fontStyle: 'italic',
      marginTop: 1,
    },

    /* ── Book (mushaf) layout ── */
    bookScrollContainer: {
      padding: theme.spacing.sm,
    },
    pageNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginBottom: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    pageNavBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: theme.colors.bgCard,
    },
    pageNavLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      ...theme.fonts.semiBold,
    },
    mushafTranslations: {
      marginTop: theme.spacing.md,
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
    },
    mushafTransText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 22,
      marginBottom: theme.spacing.sm,
    },
    mushafTransNum: {
      ...theme.fonts.bold,
      color: markerColor,
    },

    /* ── Quran Text layout ── */
    quranTextScroll: {
      padding: theme.spacing.lg,
    },
    quranBismillah: {
      fontSize: arabicFontSize,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      writingDirection: 'rtl',
      marginBottom: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
    },
    quranVerseBlock: {
      marginBottom: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    quranVerseBlockActive: {
      backgroundColor: theme.colors.primary + '10',
      borderRadius: 8,
      paddingHorizontal: theme.spacing.sm,
    },
    quranVerseBlockSelected: {
      backgroundColor: (theme.colors.accent || theme.colors.secondary) + '10',
      borderRadius: 8,
      paddingHorizontal: theme.spacing.sm,
    },
    quranArabic: {
      fontSize: arabicFontSize + 2,
      lineHeight: (arabicFontSize + 2) * 2,
      color: theme.colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
      marginBottom: theme.spacing.sm,
    },
    quranVerseNum: {
      fontSize: arabicFontSize - 6,
      color: theme.colors.primary,
    },
    quranTranslation: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      lineHeight: 24,
    },

    /* ── Modals ── */
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.bgCard,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: theme.spacing.lg,
      maxHeight: '60%',
    },
    modalHandle: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
    },
    modalTitle: {
      fontSize: 18,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    reciterList: { maxHeight: 300 },
    reciterItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.sm,
    },
    reciterItemActive: {
      backgroundColor: theme.colors.bgPrimary,
    },
    reciterName: {
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    reciterNameActive: {
      color: theme.colors.primary,
      ...theme.fonts.semiBold,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textMuted,
      textAlign: 'center',
      marginVertical: theme.spacing.lg,
    },
  });
};
