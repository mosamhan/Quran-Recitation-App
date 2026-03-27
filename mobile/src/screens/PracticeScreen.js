import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { Audio } from 'expo-av';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import { colors, spacing, borderRadius, fonts } from '../utils/theme';

export default function PracticeScreen() {
  const { user } = useUser();
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedVerse, setSelectedVerse] = useState(1);
  const [verseText, setVerseText] = useState('');
  const [results, setResults] = useState(null);
  const [wordStatuses, setWordStatuses] = useState([]);
  const streamingSessionRef = useRef(null);

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

      // Start streaming session on backend
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
    } catch (err) {
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

      // Finish streaming analysis
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
    if (accuracy >= 80) return colors.success;
    if (accuracy >= 60) return colors.warning;
    return colors.danger;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Verse selector */}
        <View style={styles.selectorRow}>
          <View style={styles.selector}>
            <Text style={styles.selectorLabel}>Chapter</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setSelectedChapter(Math.max(1, selectedChapter - 1))}
              >
                <Text style={styles.stepperText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{selectedChapter}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setSelectedChapter(Math.min(114, selectedChapter + 1))}
              >
                <Text style={styles.stepperText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.selector}>
            <Text style={styles.selectorLabel}>Verse</Text>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setSelectedVerse(Math.max(1, selectedVerse - 1))}
              >
                <Text style={styles.stepperText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{selectedVerse}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setSelectedVerse(selectedVerse + 1)}
              >
                <Text style={styles.stepperText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Arabic verse display */}
        <View style={styles.verseCard}>
          <Text style={styles.verseText}>{verseText || 'Loading verse...'}</Text>
          {wordStatuses.length > 0 && (
            <View style={styles.wordStatusRow}>
              {wordStatuses.map((ws, i) => (
                <View
                  key={i}
                  style={[
                    styles.wordDot,
                    {
                      backgroundColor:
                        ws.status === 'correct' ? colors.success
                          : ws.status === 'incorrect' ? colors.danger
                          : colors.border,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Record button */}
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <Text style={styles.recordIcon}>{isRecording ? '⏹' : '🎙'}</Text>
              <Text style={styles.recordLabel}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Results */}
        {results && (
          <View style={styles.resultsCard}>
            <Text style={styles.resultsTitle}>Results</Text>
            <View style={styles.accuracyRow}>
              <Text style={styles.accuracyLabel}>Accuracy</Text>
              <Text
                style={[
                  styles.accuracyValue,
                  { color: getAccuracyColor(results.accuracy || 0) },
                ]}
              >
                {Math.round(results.accuracy || 0)}%
              </Text>
            </View>
            {results.tajweed_feedback?.length > 0 && (
              <View style={styles.feedbackSection}>
                <Text style={styles.feedbackTitle}>Tajweed Feedback</Text>
                {results.tajweed_feedback.map((fb, i) => (
                  <View key={i} style={styles.feedbackItem}>
                    <Text style={styles.feedbackRule}>{fb.rule}</Text>
                    <Text style={styles.feedbackText}>{fb.message}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  selector: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  selectorLabel: {
    fontSize: 13,
    color: colors.textMuted,
    ...fonts.semiBold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperText: { fontSize: 18, ...fonts.bold, color: colors.primary },
  stepperValue: {
    fontSize: 18,
    ...fonts.bold,
    color: colors.textPrimary,
    marginHorizontal: spacing.lg,
    minWidth: 30,
    textAlign: 'center',
  },
  verseCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  verseText: {
    fontSize: 26,
    lineHeight: 48,
    color: colors.textPrimary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  wordStatusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    gap: 6,
  },
  wordDot: { width: 10, height: 10, borderRadius: 5 },
  recordButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.round,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  recordButtonActive: { backgroundColor: colors.danger },
  recordIcon: { fontSize: 32, marginBottom: spacing.xs },
  recordLabel: { color: '#fff', fontSize: 16, ...fonts.bold },
  resultsCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  resultsTitle: {
    fontSize: 20,
    ...fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  accuracyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  accuracyLabel: { fontSize: 16, color: colors.textSecondary },
  accuracyValue: { fontSize: 32, ...fonts.extraBold },
  feedbackSection: { borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: spacing.md },
  feedbackTitle: { fontSize: 16, ...fonts.semiBold, color: colors.textPrimary, marginBottom: spacing.sm },
  feedbackItem: { marginBottom: spacing.sm },
  feedbackRule: { fontSize: 14, ...fonts.bold, color: colors.primary },
  feedbackText: { fontSize: 14, color: colors.textSecondary },
});
