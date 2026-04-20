import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

let Audio;
try {
  Audio = require('expo-av').Audio;
} catch {
  Audio = null;
}

export default function PracticeScreen() {
  const { user } = useUser();
  const { theme } = useTheme();
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(1);
  const [verseText, setVerseText] = useState('');
  const [results, setResults] = useState(null);
  const [wordStatuses, setWordStatuses] = useState([]);
  const streamingSessionRef = useRef(null);

  const s = createStyles(theme);

  useEffect(() => {
    loadVerse();
  }, [selectedChapter, selectedVerse]);

  const loadVerse = async () => {
    try {
      const res = await api.getQuranChapter(selectedChapter);
      const verses = res.data.verses || res.data;
      const verse = verses.find((v) => v.verse_number === selectedVerse);
      if (verse) {
        setVerseText(verse.text_uthmani || verse.text || '');
      }
    } catch {
      // Verse load failed
    }
  };

  const startRecording = async () => {
    if (!Audio) {
      Alert.alert('Not Available', 'Audio recording requires a development build. Run `npx expo run:ios` to use this feature.');
      return;
    }
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Microphone access is needed for recitation practice.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const sessionRes = await api.startStreamingAnalysis({
        user_id: user?.id,
        chapter_number: selectedChapter,
        verse_number: selectedVerse,
      });
      streamingSessionRef.current = sessionRes.data.session_key;
      setWordStatuses(sessionRes.data.word_statuses || []);

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(rec);
      setIsRecording(true);
      setResults(null);
    } catch {
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsRecording(false);
    setIsAnalyzing(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (streamingSessionRef.current) {
        const res = await api.finishStreamingAnalysis({
          session_key: streamingSessionRef.current,
          audio_uri: uri,
        });
        setResults(res.data);
        setWordStatuses(res.data.word_statuses || []);
        streamingSessionRef.current = null;
      }
    } catch {
      Alert.alert('Analysis Error', 'Could not analyze your recitation.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return theme.colors.success;
    if (accuracy >= 60) return theme.colors.warning;
    return theme.colors.danger;
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.screenTitle}>Practice</Text>

        {/* Verse selector */}
        <View style={s.selectorRow}>
          <View style={s.selector}>
            <Text style={s.selectorLabel}>Chapter</Text>
            <View style={s.stepperRow}>
              <TouchableOpacity
                style={s.stepperBtn}
                onPress={() => setSelectedChapter(Math.max(1, selectedChapter - 1))}
              >
                <Text style={s.stepperText}>-</Text>
              </TouchableOpacity>
              <Text style={s.stepperValue}>{selectedChapter}</Text>
              <TouchableOpacity
                style={s.stepperBtn}
                onPress={() => setSelectedChapter(Math.min(114, selectedChapter + 1))}
              >
                <Text style={s.stepperText}>+</Text>
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
                <Text style={s.stepperText}>-</Text>
              </TouchableOpacity>
              <Text style={s.stepperValue}>{selectedVerse}</Text>
              <TouchableOpacity
                style={s.stepperBtn}
                onPress={() => setSelectedVerse(selectedVerse + 1)}
              >
                <Text style={s.stepperText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Arabic verse display */}
        <View style={s.verseCard}>
          <Text style={s.verseText}>{verseText || 'Loading verse...'}</Text>
          {wordStatuses.length > 0 && (
            <View style={s.wordStatusRow}>
              {wordStatuses.map((ws, i) => (
                <View
                  key={i}
                  style={[
                    s.wordDot,
                    {
                      backgroundColor:
                        ws.status === 'correct' ? theme.colors.success
                          : ws.status === 'incorrect' ? theme.colors.danger
                          : theme.colors.border,
                    },
                  ]}
                />
              ))}
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
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <Text style={s.recordIcon}>{isRecording ? '⏹' : '🎙'}</Text>
              <Text style={s.recordLabel}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Results */}
        {results && (
          <View style={s.resultsCard}>
            <Text style={s.resultsTitle}>Results</Text>
            <View style={s.accuracyRow}>
              <Text style={s.accuracyLabel}>Accuracy</Text>
              <Text
                style={[
                  s.accuracyValue,
                  { color: getAccuracyColor(results.accuracy || 0) },
                ]}
              >
                {Math.round(results.accuracy || 0)}%
              </Text>
            </View>
            {results.tajweed_feedback?.length > 0 && (
              <View style={s.feedbackSection}>
                <Text style={s.feedbackTitle}>Tajweed Feedback</Text>
                {results.tajweed_feedback.map((fb, i) => (
                  <View key={i} style={s.feedbackItem}>
                    <Text style={s.feedbackRule}>{fb.rule}</Text>
                    <Text style={s.feedbackText}>{fb.message}</Text>
                  </View>
                ))}
              </View>
            )}
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
    screenTitle: {
      fontSize: theme.fonts.sizeTitle,
      ...theme.fonts.extraBold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.lg,
    },
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
    stepperText: { fontSize: 18, ...theme.fonts.bold, color: theme.colors.primary },
    stepperValue: {
      fontSize: 18,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
      marginHorizontal: theme.spacing.lg,
      minWidth: 30,
      textAlign: 'center',
    },
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
    verseText: {
      fontSize: theme.fonts.sizeArabic,
      lineHeight: theme.fonts.sizeArabic * 1.8,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    wordStatusRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      marginTop: theme.spacing.md,
      gap: 6,
    },
    wordDot: { width: 10, height: 10, borderRadius: 5 },
    recordButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.round,
      paddingVertical: theme.spacing.lg,
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
    },
    recordButtonActive: { backgroundColor: theme.colors.danger },
    recordIcon: { fontSize: 32, marginBottom: theme.spacing.xs },
    recordLabel: { color: '#fff', fontSize: 16, ...theme.fonts.bold },
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
    resultsTitle: {
      fontSize: 20,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    accuracyRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    accuracyLabel: { fontSize: 16, color: theme.colors.textSecondary },
    accuracyValue: { fontSize: 32, ...theme.fonts.extraBold },
    feedbackSection: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
      paddingTop: theme.spacing.md,
    },
    feedbackTitle: {
      fontSize: 16,
      ...theme.fonts.semiBold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    feedbackItem: { marginBottom: theme.spacing.sm },
    feedbackRule: { fontSize: 14, ...theme.fonts.bold, color: theme.colors.primary },
    feedbackText: { fontSize: 14, color: theme.colors.textSecondary },
  });
