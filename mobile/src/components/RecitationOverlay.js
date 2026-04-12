import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
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

export default function RecitationOverlay({
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
  const s = createStyles(theme);

  const words = verseText ? verseText.trim().split(/\s+/).filter(Boolean) : [];

  useEffect(() => {
    if (visible && words.length > 0) {
      setWordStatuses(words.map(() => 'pending'));
      setElapsed(0);
      setIsRecording(false);
      setIsAnalyzing(false);
      sessionKeyRef.current = null;
      lastChunkSizeRef.current = 0;
    }
    return () => {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    };
  }, [visible, verseText]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
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

  const sendChunkForAnalysis = async () => {
    try {
      const uri = recorder.uri;
      if (!uri || !sessionKeyRef.current) return;

      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Only send if we have new audio data
      if (base64Audio.length <= lastChunkSizeRef.current) return;
      lastChunkSizeRef.current = base64Audio.length;

      const chunkRes = await api.analyzeChunk({
        session_key: sessionKeyRef.current,
        audio_chunk: `data:audio/wav;base64,${base64Audio}`,
      });

      if (chunkRes.data.word_statuses) {
        setWordStatuses(chunkRes.data.word_statuses);
      }
    } catch {
      // Chunk analysis failed silently — don't interrupt recording
    }
  };

  const startRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) return;

      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      const verseId = `${chapterNumber}:${verseNumber}`;
      const sessionRes = await api.startStreamingAnalysis({
        user_id: user?.id || 0,
        expected_text: verseText,
        verse_id: verseId,
      });
      sessionKeyRef.current = sessionRes.data.session_key;
      if (sessionRes.data.word_statuses) {
        setWordStatuses(sessionRes.data.word_statuses);
      }

      lastChunkSizeRef.current = 0;
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
      setElapsed(0);

      // Send audio chunks every 3 seconds for real-time word tracking
      chunkIntervalRef.current = setInterval(sendChunkForAnalysis, 3000);
    } catch (err) {
      console.log('Recording start error:', err);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
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
          if (chunkRes.data.word_statuses) {
            setWordStatuses(chunkRes.data.word_statuses);
          }
        } catch {
          // Chunk analysis failed
        }

        const verseId = `${chapterNumber}:${verseNumber}`;
        const res = await api.finishStreamingAnalysis({
          session_key: sessionKeyRef.current,
          user_id: user?.id || 0,
          verse_id: verseId,
          audio_data: `data:audio/wav;base64,${base64Audio}`,
          platform: 'mobile',
        });

        processResults(res.data);
        if (onResults) onResults(res.data);
        sessionKeyRef.current = null;
      }
    } catch (err) {
      console.log('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processResults = (data) => {
    if (!words.length) return;
    const accuracy = data.accuracy || 0;
    const mistakes = data.mistakes || [];

    const mistakeMap = {};
    mistakes.forEach((m) => {
      const severity = m.type === 'missing' || m.type === 'substitution' ? 'incorrect' : 'minor';
      mistakeMap[m.position] = severity;
    });

    if (accuracy > 0) {
      const newStatuses = words.map((_, i) => {
        if (mistakeMap[i]) return mistakeMap[i];
        return accuracy > 20 ? 'correct' : 'pending';
      });
      setWordStatuses(newStatuses);
    }
  };

  const getWordColor = (status) => {
    return WORD_COLORS[status] || theme.colors.textPrimary;
  };

  if (!visible) return null;

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
        <TouchableOpacity onPress={onClose} style={s.closeBtn}>
          <Ionicons name="close" size={22} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={s.verseBox}>
        <Text style={s.verseTextWrap}>
          {words.map((word, i) => (
            <Text
              key={i}
              style={[
                s.word,
                {
                  color: getWordColor(wordStatuses[i]),
                  backgroundColor: wordStatuses[i] && wordStatuses[i] !== 'pending'
                    ? `${getWordColor(wordStatuses[i])}18`
                    : 'transparent',
                },
              ]}
            >
              {word}{' '}
            </Text>
          ))}
        </Text>
      </View>

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
            <Ionicons
              name={isRecording ? 'stop' : 'mic'}
              size={28}
              color="#fff"
            />
            <Text style={s.recordBtnText}>
              {isRecording ? 'Stop' : 'Start Reciting'}
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
    closeBtn: {
      padding: 4,
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
  });
