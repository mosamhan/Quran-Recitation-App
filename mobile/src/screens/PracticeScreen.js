import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import TopNav from '../components/TopNav';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';

// Use a WAV/PCM config to avoid the iOS outputFormat string→int crash
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

export default function PracticeScreen({ route }) {
  const { user } = useUser();
  const { theme } = useTheme();
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(
    route?.params?.chapter?.number || route?.params?.chapter?.id || 1
  );
  const [selectedVerse, setSelectedVerse] = useState(
    route?.params?.verse?.number_in_surah || route?.params?.verse?.verse_number || 1
  );
  const [verseText, setVerseText] = useState('');
  const [verseWords, setVerseWords] = useState([]);
  const [wordStatuses, setWordStatuses] = useState([]);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const streamingSessionRef = useRef(null);

  const s = createStyles(theme);

  useEffect(() => {
    loadVerse();
  }, [selectedChapter, selectedVerse]);

  const loadVerse = async () => {
    try {
      const res = await api.getQuranChapter(selectedChapter);
      const verses = res.data.verses || res.data;
      const verse = verses.find(
        (v) => (v.number_in_surah || v.verse_number) === selectedVerse
      );
      if (verse) {
        const text = verse.text_uthmani || verse.text || '';
        setVerseText(text);
        const words = text.trim().split(/\s+/).filter(Boolean);
        setVerseWords(words);
        setWordStatuses(words.map(() => 'pending'));
        setResults(null);
        setProgress(0);
      }
    } catch {
      // Verse load failed
    }
  };

  const startRecording = async () => {
    if (!verseText) {
      Alert.alert('No Verse', 'Please wait for the verse to load.');
      return;
    }
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Microphone access is needed for recitation practice.');
        return;
      }

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      // Start streaming session on backend
      const verseId = `${selectedChapter}:${selectedVerse}`;
      const sessionRes = await api.startStreamingAnalysis({
        user_id: user?.id || 0,
        expected_text: verseText,
        verse_id: verseId,
      });
      streamingSessionRef.current = sessionRes.data.session_key;

      if (sessionRes.data.word_statuses) {
        setWordStatuses(sessionRes.data.word_statuses);
      }

      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      setResults(null);
      setProgress(0);
    } catch (err) {
      console.log('Recording start error:', err);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    setIsAnalyzing(true);

    try {
      await recorder.stop();
      const uri = recorder.uri;

      if (streamingSessionRef.current && uri) {
        // Read the audio file and convert to base64
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Send audio as a chunk for analysis first
        try {
          const chunkRes = await api.analyzeChunk({
            session_key: streamingSessionRef.current,
            audio_chunk: `data:audio/wav;base64,${base64Audio}`,
          });
          if (chunkRes.data.word_statuses) {
            setWordStatuses(chunkRes.data.word_statuses);
          }
          if (chunkRes.data.progress != null) {
            setProgress(chunkRes.data.progress);
          }
        } catch {
          // Chunk analysis failed, continue to finish
        }

        // Finish the session and get final results
        const verseId = `${selectedChapter}:${selectedVerse}`;
        const res = await api.finishStreamingAnalysis({
          session_key: streamingSessionRef.current,
          user_id: user?.id || 0,
          verse_id: verseId,
          audio_data: `data:audio/wav;base64,${base64Audio}`,
          platform: 'mobile',
        });

        setResults(res.data);
        updateWordStatusesFromResults(res.data);
        streamingSessionRef.current = null;
      }
    } catch (err) {
      console.log('Analysis error:', err);
      Alert.alert('Analysis Error', 'Could not analyze your recitation. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateWordStatusesFromResults = (data) => {
    if (!verseWords.length) return;

    const accuracy = data.accuracy || 0;
    const mistakes = data.mistakes || [];
    const mistakePositions = new Set(mistakes.map((m) => m.position));

    // If we have a transcription and decent accuracy, mark words
    if (accuracy > 0) {
      const newStatuses = verseWords.map((_, i) => {
        if (mistakePositions.has(i)) return 'incorrect';
        return accuracy > 20 ? 'correct' : 'pending';
      });
      setWordStatuses(newStatuses);
    }
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return theme.colors.success;
    if (accuracy >= 60) return theme.colors.warning;
    return theme.colors.danger;
  };

  const getWordColor = (status) => {
    switch (status) {
      case 'correct': return theme.colors.success;
      case 'incorrect': return theme.colors.danger;
      case 'current': return theme.colors.primary;
      default: return theme.colors.textMuted;
    }
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <TopNav title="Practice" />
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Verse selector */}
        <View style={s.selectorRow}>
          <View style={s.selector}>
            <Text style={s.selectorLabel}>Chapter</Text>
            <View style={s.stepperRow}>
              <TouchableOpacity
                style={s.stepperBtn}
                onPress={() => setSelectedChapter(Math.max(1, selectedChapter - 1))}
              >
                <Ionicons name="remove" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
              <Text style={s.stepperValue}>{selectedChapter}</Text>
              <TouchableOpacity
                style={s.stepperBtn}
                onPress={() => setSelectedChapter(Math.min(114, selectedChapter + 1))}
              >
                <Ionicons name="add" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.selector}>
            <Text style={s.selectorLabel}>Verse</Text>
            <View style={s.stepperRow}>
              <TouchableOpacity
                style={s.stepperBtn}
                onPress={() => setSelectedVerse(Math.max(1, selectedVerse - 1))}
              >
                <Ionicons name="remove" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
              <Text style={s.stepperValue}>{selectedVerse}</Text>
              <TouchableOpacity
                style={s.stepperBtn}
                onPress={() => setSelectedVerse(selectedVerse + 1)}
              >
                <Ionicons name="add" size={18} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Word-by-word verse display */}
        <View style={s.verseCard}>
          {verseWords.length > 0 ? (
            <View style={s.wordsContainer}>
              {verseWords.map((word, i) => (
                <Text
                  key={i}
                  style={[
                    s.verseWord,
                    { color: getWordColor(wordStatuses[i] || 'pending') },
                    wordStatuses[i] === 'incorrect' && s.wordIncorrect,
                    wordStatuses[i] === 'correct' && s.wordCorrect,
                  ]}
                >
                  {word}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={s.verseTextPlain}>Loading verse...</Text>
          )}

          {/* Progress bar during recording */}
          {(isRecording || progress > 0) && (
            <View style={s.progressSection}>
              <View style={s.progressBarBg}>
                <View style={[s.progressBarFill, { width: `${Math.min(progress, 100)}%` }]} />
              </View>
              <Text style={s.progressText}>{Math.round(progress)}% complete</Text>
            </View>
          )}

          {/* Word status legend */}
          {wordStatuses.some((ws) => ws !== 'pending') && (
            <View style={s.legendRow}>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: theme.colors.success }]} />
                <Text style={s.legendText}>Correct</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: theme.colors.danger }]} />
                <Text style={s.legendText}>Needs work</Text>
              </View>
              <View style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: theme.colors.textMuted }]} />
                <Text style={s.legendText}>Pending</Text>
              </View>
            </View>
          )}
        </View>

        {/* Record button */}
        <TouchableOpacity
          style={[s.recordButton, isRecording && s.recordButtonActive]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <View style={s.analyzingContent}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={s.recordLabel}>Analyzing with Whisper...</Text>
            </View>
          ) : (
            <>
              <Ionicons
                name={isRecording ? 'stop-circle-outline' : 'mic-outline'}
                size={40}
                color="#fff"
              />
              <Text style={s.recordLabel}>
                {isRecording ? 'Stop & Analyze' : 'Start Reciting'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Results */}
        {results && (
          <View style={s.resultsCard}>
            {/* Accuracy circle */}
            <View style={s.accuracyCircle}>
              <Text
                style={[
                  s.accuracyValue,
                  { color: getAccuracyColor(results.accuracy || 0) },
                ]}
              >
                {Math.round(results.accuracy || 0)}%
              </Text>
              <Text style={s.accuracyLabel}>Accuracy</Text>
            </View>

            {/* Feedback message */}
            {results.feedback && (
              <Text style={s.feedbackMessage}>{results.feedback}</Text>
            )}

            {/* Transcription comparison */}
            {results.transcription && (
              <View style={s.transcriptionSection}>
                <Text style={s.sectionTitle}>What we heard</Text>
                <Text style={s.transcriptionText}>{results.transcription}</Text>
              </View>
            )}

            {/* Mistakes */}
            {results.mistakes?.length > 0 && (
              <View style={s.mistakesSection}>
                <Text style={s.sectionTitle}>Corrections</Text>
                {results.mistakes.map((mistake, i) => (
                  <View key={i} style={s.mistakeCard}>
                    <View style={s.mistakeHeader}>
                      <View style={[s.mistakeTypeBadge, {
                        backgroundColor: mistake.type === 'tajweed'
                          ? (mistake.tajweed_color || theme.colors.warning)
                          : theme.colors.danger,
                      }]}>
                        <Text style={s.mistakeTypeText}>
                          {mistake.type === 'tajweed' ? 'Tajweed' :
                           mistake.type === 'omission' ? 'Missed' :
                           mistake.type === 'addition' ? 'Extra' : 'Pronunciation'}
                        </Text>
                      </View>
                      {mistake.tajweed_name && (
                        <Text style={s.tajweedName}>{mistake.tajweed_name}</Text>
                      )}
                    </View>
                    {mistake.correct && (
                      <View style={s.correctionRow}>
                        <Text style={s.correctionLabel}>Expected: </Text>
                        <Text style={s.correctionCorrect}>{mistake.correct}</Text>
                      </View>
                    )}
                    {mistake.incorrect && (
                      <View style={s.correctionRow}>
                        <Text style={s.correctionLabel}>You said: </Text>
                        <Text style={s.correctionIncorrect}>{mistake.incorrect}</Text>
                      </View>
                    )}
                    {mistake.suggestion && (
                      <Text style={s.suggestionText}>{mistake.suggestion}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Retry button */}
            <TouchableOpacity
              style={s.retryButton}
              onPress={() => {
                setResults(null);
                setWordStatuses(verseWords.map(() => 'pending'));
                setProgress(0);
              }}
            >
              <Ionicons name="refresh-outline" size={20} color={theme.colors.primary} />
              <Text style={s.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bgPrimary },
    scroll: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
    selectorRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.lg,
    },
    selector: { flex: 1, marginHorizontal: theme.spacing.xs },
    selectorLabel: {
      fontSize: theme.fonts.sizeSmall,
      color: theme.colors.textMuted,
      ...theme.fonts.semiBold,
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
    },
    stepperRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.sm,
    },
    stepperBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.bgPrimary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepperValue: {
      fontSize: 18,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
      marginHorizontal: theme.spacing.lg,
      minWidth: 30,
      textAlign: 'center',
    },
    // Word-by-word verse card
    verseCard: {
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.xl,
      marginBottom: theme.spacing.lg,
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    wordsContainer: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
    },
    verseWord: {
      fontSize: theme.fonts.sizeArabic,
      lineHeight: theme.fonts.sizeArabic * 2,
      writingDirection: 'rtl',
    },
    wordCorrect: {
      textDecorationLine: 'underline',
      textDecorationColor: theme.colors.success,
    },
    wordIncorrect: {
      textDecorationLine: 'underline',
      textDecorationColor: theme.colors.danger,
      textDecorationStyle: 'double',
    },
    verseTextPlain: {
      fontSize: theme.fonts.sizeArabic,
      color: theme.colors.textMuted,
      textAlign: 'center',
    },
    progressSection: { marginTop: theme.spacing.md },
    progressBarBg: {
      height: 6,
      backgroundColor: theme.colors.bgPrimary,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
    },
    progressText: {
      fontSize: 12,
      color: theme.colors.textMuted,
      textAlign: 'center',
      marginTop: 4,
    },
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginTop: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, color: theme.colors.textMuted },
    // Record button
    recordButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.xl,
      paddingVertical: theme.spacing.xl,
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    recordButtonActive: { backgroundColor: theme.colors.danger },
    recordLabel: { color: '#fff', fontSize: 16, ...theme.fonts.bold, marginTop: 4 },
    analyzingContent: { alignItems: 'center' },
    // Results
    resultsCard: {
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    accuracyCircle: {
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    accuracyValue: { fontSize: 48, ...theme.fonts.extraBold },
    accuracyLabel: { fontSize: 14, color: theme.colors.textMuted, marginTop: -4 },
    feedbackMessage: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: theme.spacing.md,
    },
    transcriptionSection: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
      paddingTop: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      fontSize: 14,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    transcriptionText: {
      fontSize: theme.fonts.sizeArabic - 4,
      color: theme.colors.textSecondary,
      textAlign: 'right',
      writingDirection: 'rtl',
      lineHeight: (theme.fonts.sizeArabic - 4) * 1.6,
    },
    // Mistakes
    mistakesSection: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
      paddingTop: theme.spacing.md,
    },
    mistakeCard: {
      backgroundColor: theme.colors.bgPrimary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    mistakeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.xs,
      gap: 8,
    },
    mistakeTypeBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
    },
    mistakeTypeText: { color: '#fff', fontSize: 11, ...theme.fonts.bold },
    tajweedName: { fontSize: 13, color: theme.colors.textSecondary, ...theme.fonts.semiBold },
    correctionRow: { flexDirection: 'row', marginTop: 2 },
    correctionLabel: { fontSize: 13, color: theme.colors.textMuted },
    correctionCorrect: {
      fontSize: 15,
      color: theme.colors.success,
      ...theme.fonts.semiBold,
    },
    correctionIncorrect: {
      fontSize: 15,
      color: theme.colors.danger,
      ...theme.fonts.semiBold,
    },
    suggestionText: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontStyle: 'italic',
      marginTop: 4,
    },
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
    },
    retryText: { fontSize: 16, color: theme.colors.primary, ...theme.fonts.bold },
  });
