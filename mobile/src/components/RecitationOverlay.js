import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  ScrollView, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import {
  useAudioRecorder,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const RECORDING_OPTIONS = {
  extension: '.wav',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 128000,
  ios: {
    outputFormat: 'lpcm',
    audioQuality: 96,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  android: {
    outputFormat: 'default',
    audioEncoder: 'default',
  },
};

const WORD_COLORS = {
  correct: '#2ecc71',
  minor: '#f39c12',
  incorrect: '#e74c3c',
  current: '#3498db',
  pending: null,
};

/**
 * RecitationOverlay — bottom sheet for recitation recording & analysis.
 *
 * Props:
 *   mode        — "verse" (default, single verse) or "free" (auto-detect + follow)
 *   visible     — show/hide
 *   verseText   — expected verse text (verse mode only)
 *   chapterNumber, verseNumber — verse reference (verse mode only)
 *   onClose     — callback on dismiss
 *   onResults   — callback with results data
 */
export default function RecitationOverlay({
  mode = 'verse',
  visible,
  verseText,
  chapterNumber,
  verseNumber,
  onClose,
  onResults,
}) {
  const { theme } = useTheme();
  const { user } = useUser();
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [wordStatuses, setWordStatuses] = useState([]);
  const sessionKeyRef = useRef(null);
  const timerRef = useRef(null);
  const chunkIntervalRef = useRef(null);
  const lastChunkSizeRef = useRef(0);

  // Free mode state
  const [freeState, setFreeState] = useState('idle'); // idle | detecting | following | results
  const [freeVerseText, setFreeVerseText] = useState('');
  const [freeChapter, setFreeChapter] = useState(null);
  const [freeVerse, setFreeVerse] = useState(null);
  const [versesRecited, setVersesRecited] = useState(0);
  const [freeResults, setFreeResults] = useState(null);
  const [detectionStatus, setDetectionStatus] = useState('');
  const flashAnim = useRef(new Animated.Value(0)).current;

  const s = createStyles(theme);

  const isFree = mode === 'free';
  const displayText = isFree ? freeVerseText : verseText;
  const words = displayText ? displayText.trim().split(/\s+/).filter(Boolean) : [];

  // Reset state when overlay opens
  useEffect(() => {
    if (visible) {
      setElapsed(0);
      setIsRecording(false);
      setIsAnalyzing(false);
      sessionKeyRef.current = null;
      lastChunkSizeRef.current = 0;

      if (isFree) {
        setFreeState('idle');
        setFreeVerseText('');
        setFreeChapter(null);
        setFreeVerse(null);
        setVersesRecited(0);
        setFreeResults(null);
        setDetectionStatus('');
        setWordStatuses([]);
      } else {
        setWordStatuses(
          verseText ? verseText.trim().split(/\s+/).filter(Boolean).map(() => 'pending') : []
        );
      }
    }
    return () => {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    };
  }, [visible, verseText, mode]);

  // Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ─── Verse Mode Chunk ───
  const sendVerseChunk = async () => {
    try {
      const uri = recorder.uri;
      if (!uri || !sessionKeyRef.current) return;
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (base64Audio.length <= lastChunkSizeRef.current) return;
      lastChunkSizeRef.current = base64Audio.length;

      const chunkRes = await api.analyzeChunk({
        session_key: sessionKeyRef.current,
        audio_chunk: `data:audio/wav;base64,${base64Audio}`,
      });
      if (chunkRes.data.word_statuses) setWordStatuses(chunkRes.data.word_statuses);
    } catch {
      // silent
    }
  };

  // ─── Free Mode Chunk ───
  const sendFreeChunk = async () => {
    try {
      const uri = recorder.uri;
      if (!uri || !sessionKeyRef.current) return;
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (base64Audio.length <= lastChunkSizeRef.current) return;
      lastChunkSizeRef.current = base64Audio.length;

      const res = await api.sendFreeChunk({
        session_key: sessionKeyRef.current,
        audio_chunk: `data:audio/wav;base64,${base64Audio}`,
      });
      const d = res.data;

      if (d.state === 'detecting') {
        setFreeState('detecting');
        setDetectionStatus(
          d.candidates && d.candidates.length > 0
            ? `Listening... (${d.candidates.length} possible matches)`
            : 'Listening...'
        );
      } else if (d.state === 'following') {
        if (freeState !== 'following' || d.current_chapter !== freeChapter || d.current_verse !== freeVerse) {
          // New verse detected or advanced
          if (freeState === 'following') {
            // Verse advanced — flash animation
            setVersesRecited((p) => p + 1);
            Animated.sequence([
              Animated.timing(flashAnim, { toValue: 1, duration: 200, useNativeDriver: false }),
              Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
            ]).start();
          }
          setFreeVerseText(d.verse_text || '');
          setFreeChapter(d.current_chapter);
          setFreeVerse(d.current_verse);
        }
        setFreeState('following');
        if (d.word_statuses) setWordStatuses(d.word_statuses);
        setDetectionStatus(`Surah ${d.current_chapter}, Verse ${d.current_verse}`);
      } else if (d.state === 'finished') {
        // Auto-finished (e.g. end of Quran)
        await handleFreeStop();
      }
    } catch {
      // silent
    }
  };

  // ─── Start Recording ───
  const startRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      if (isFree) {
        const sessionRes = await api.startFreeRecitation({ user_id: user?.id || 0 });
        sessionKeyRef.current = sessionRes.data.session_key;
        setFreeState('detecting');
        setDetectionStatus('Recite from anywhere...');
      } else {
        const verseId = `${chapterNumber}:${verseNumber}`;
        const sessionRes = await api.startStreamingAnalysis({
          user_id: user?.id || 0,
          expected_text: verseText,
          verse_id: verseId,
        });
        sessionKeyRef.current = sessionRes.data.session_key;
        if (sessionRes.data.word_statuses) setWordStatuses(sessionRes.data.word_statuses);
      }

      lastChunkSizeRef.current = 0;
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      setElapsed(0);

      chunkIntervalRef.current = setInterval(
        isFree ? sendFreeChunk : sendVerseChunk,
        3000
      );
    } catch (err) {
      console.log('Recording start error:', err);
    }
  };

  // ─── Stop Recording (Free) ───
  const handleFreeStop = async () => {
    clearInterval(chunkIntervalRef.current);
    chunkIntervalRef.current = null;
    setIsRecording(false);
    setIsAnalyzing(true);

    try {
      await recorder.stop();
      if (sessionKeyRef.current) {
        const res = await api.finishFreeRecitation({
          session_key: sessionKeyRef.current,
        });
        setFreeResults(res.data);
        setFreeState('results');
        setVersesRecited(res.data.total_verses || 0);
        if (onResults) onResults(res.data);
        sessionKeyRef.current = null;
      }
    } catch (err) {
      console.log('Free finish error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Stop Recording (Verse) ───
  const handleVerseStop = async () => {
    clearInterval(chunkIntervalRef.current);
    chunkIntervalRef.current = null;
    setIsRecording(false);
    setIsAnalyzing(true);

    try {
      await recorder.stop();
      const uri = recorder.uri;

      if (sessionKeyRef.current && uri) {
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        try {
          const chunkRes = await api.analyzeChunk({
            session_key: sessionKeyRef.current,
            audio_chunk: `data:audio/wav;base64,${base64Audio}`,
          });
          if (chunkRes.data.word_statuses) setWordStatuses(chunkRes.data.word_statuses);
        } catch {
          // ignore
        }

        const verseId = `${chapterNumber}:${verseNumber}`;
        const res = await api.finishStreamingAnalysis({
          session_key: sessionKeyRef.current,
          user_id: user?.id || 0,
          verse_id: verseId,
          audio_data: `data:audio/wav;base64,${base64Audio}`,
          platform: 'mobile',
        });

        processVerseResults(res.data);
        if (onResults) onResults(res.data);
        sessionKeyRef.current = null;
      }
    } catch (err) {
      console.log('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stopRecording = () => (isFree ? handleFreeStop() : handleVerseStop());

  const processVerseResults = (data) => {
    if (!words.length) return;
    const accuracy = data.accuracy || 0;
    const mistakes = data.mistakes || [];
    const mistakeMap = {};
    mistakes.forEach((m) => {
      const severity = m.type === 'missing' || m.type === 'substitution' ? 'incorrect' : 'minor';
      mistakeMap[m.position] = severity;
    });
    if (accuracy > 0) {
      setWordStatuses(
        words.map((_, i) => {
          if (mistakeMap[i]) return mistakeMap[i];
          return accuracy > 20 ? 'correct' : 'pending';
        })
      );
    }
  };

  const getWordColor = (status) => WORD_COLORS[status] || theme.colors.textPrimary;

  if (!visible) return null;

  // ─── Free Mode Results View ───
  if (isFree && freeState === 'results' && freeResults) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Recitation Results</Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={22} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView style={s.resultsScroll} showsVerticalScrollIndicator={false}>
          <View style={s.resultsSummary}>
            <Text style={s.resultsBigNumber}>{freeResults.total_verses || 0}</Text>
            <Text style={s.resultsLabel}>Verses Recited</Text>
            <Text style={s.resultsAccuracy}>
              {Math.round(freeResults.total_accuracy || 0)}% Overall Accuracy
            </Text>
          </View>

          {(freeResults.verses_recited || []).map((v, i) => (
            <View key={i} style={s.resultRow}>
              <Text style={s.resultVerse}>{v.chapter}:{v.verse}</Text>
              <View style={s.resultBarBg}>
                <View style={[s.resultBar, { width: `${Math.min(v.accuracy, 100)}%` }]} />
              </View>
              <Text style={s.resultPct}>{Math.round(v.accuracy)}%</Text>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={s.doneBtn} onPress={onClose}>
          <Text style={s.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── Main Overlay ───
  const flashBg = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', `${WORD_COLORS.correct}30`],
  });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View style={s.timerRow}>
          <Ionicons
            name={isRecording ? 'radio-button-on' : 'mic-outline'}
            size={20}
            color={isRecording ? theme.colors.danger : theme.colors.textSecondary}
          />
          <Text style={[s.timer, isRecording && { color: theme.colors.danger }]}>
            {formatTime(elapsed)}
          </Text>
        </View>
        {isFree && freeState === 'following' && (
          <Text style={s.verseCounter}>
            {versesRecited > 0 ? `${versesRecited} verse${versesRecited !== 1 ? 's' : ''} done` : ''}
          </Text>
        )}
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <Ionicons name="close" size={22} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Detection status (free mode) */}
      {isFree && isRecording && (
        <View style={s.detectionBar}>
          <Ionicons
            name={freeState === 'detecting' ? 'search' : 'book'}
            size={16}
            color={freeState === 'following' ? WORD_COLORS.correct : theme.colors.primary}
          />
          <Text style={[
            s.detectionText,
            freeState === 'following' && { color: WORD_COLORS.correct },
          ]}>
            {detectionStatus}
          </Text>
        </View>
      )}

      <Animated.View style={[s.verseBox, isFree && { backgroundColor: flashBg }]}>
        {words.length > 0 ? (
          <Text style={s.verseTextWrap}>
            {words.map((word, i) => (
              <Text
                key={i}
                style={[
                  s.word,
                  {
                    color: getWordColor(wordStatuses[i]),
                    backgroundColor:
                      wordStatuses[i] && wordStatuses[i] !== 'pending'
                        ? `${getWordColor(wordStatuses[i])}18`
                        : 'transparent',
                  },
                ]}
              >
                {word}{' '}
              </Text>
            ))}
          </Text>
        ) : (
          isFree && (
            <Text style={s.placeholderText}>
              {isRecording ? 'Listening for your recitation...' : 'Tap Start to begin reciting from anywhere'}
            </Text>
          )
        )}
      </Animated.View>

      <View style={s.controls}>
        {isAnalyzing ? (
          <View style={s.analyzingRow}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text style={s.analyzingText}>Analyzing...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[s.recordBtn, isRecording && s.recordBtnActive]}
            onPress={isRecording ? stopRecording : startRecording}
          >
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={28} color="#fff" />
            <Text style={s.recordBtnText}>
              {isRecording ? 'Stop' : isFree ? 'Start Reciting' : 'Start Reciting'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: WORD_COLORS.correct }]} />
          <Text style={s.legendLabel}>Correct</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: WORD_COLORS.current }]} />
          <Text style={s.legendLabel}>Current</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: WORD_COLORS.incorrect }]} />
          <Text style={s.legendLabel}>Mistake</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.bgCard,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    headerTitle: {
      fontSize: 18,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
    },
    timerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    timer: {
      fontSize: 20,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
    },
    verseCounter: {
      fontSize: 13,
      color: WORD_COLORS.correct,
      ...theme.fonts.medium,
    },
    closeBtn: {
      padding: 4,
    },
    detectionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.bgPrimary,
      borderRadius: theme.borderRadius.sm,
      marginBottom: theme.spacing.sm,
    },
    detectionText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      ...theme.fonts.medium,
    },
    verseBox: {
      backgroundColor: theme.colors.bgPrimary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      minHeight: 80,
    },
    verseTextWrap: {
      fontSize: theme.fonts.sizeArabic,
      lineHeight: theme.fonts.sizeArabic * 2,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    word: {
      fontSize: theme.fonts.sizeArabic,
      lineHeight: theme.fonts.sizeArabic * 2,
      borderRadius: 4,
      overflow: 'hidden',
    },
    placeholderText: {
      fontSize: 16,
      color: theme.colors.textMuted,
      textAlign: 'center',
      paddingVertical: 20,
    },
    controls: {
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    recordBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.round,
      paddingVertical: 14,
      paddingHorizontal: 28,
      gap: 10,
    },
    recordBtnActive: {
      backgroundColor: theme.colors.danger,
    },
    recordBtnText: {
      color: '#fff',
      fontSize: 16,
      ...theme.fonts.bold,
    },
    analyzingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    analyzingText: {
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 20,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendLabel: {
      fontSize: 12,
      color: theme.colors.textMuted,
    },
    // Results view styles
    resultsScroll: {
      maxHeight: 300,
      marginBottom: theme.spacing.md,
    },
    resultsSummary: {
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    resultsBigNumber: {
      fontSize: 48,
      ...theme.fonts.bold,
      color: theme.colors.primary,
    },
    resultsLabel: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    resultsAccuracy: {
      fontSize: 18,
      ...theme.fonts.bold,
      color: WORD_COLORS.correct,
    },
    resultRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.border,
    },
    resultVerse: {
      width: 50,
      fontSize: 14,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
    },
    resultBarBg: {
      flex: 1,
      height: 8,
      backgroundColor: theme.colors.bgPrimary,
      borderRadius: 4,
      overflow: 'hidden',
    },
    resultBar: {
      height: 8,
      backgroundColor: WORD_COLORS.correct,
      borderRadius: 4,
    },
    resultPct: {
      width: 40,
      fontSize: 14,
      ...theme.fonts.medium,
      color: theme.colors.textSecondary,
      textAlign: 'right',
    },
    doneBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    doneBtnText: {
      color: '#fff',
      fontSize: 16,
      ...theme.fonts.bold,
    },
  });
