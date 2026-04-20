import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

let Audio;
try {
  Audio = require('expo-av').Audio;
} catch {
  Audio = null;
}

export default function ChapterDetailScreen({ route }) {
  const { chapter } = route.params;
  const { theme } = useTheme();
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingVerse, setPlayingVerse] = useState(null);
  const [sound, setSound] = useState(null);

  const s = createStyles(theme);

  useEffect(() => {
    loadVerses();
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, []);

  const loadVerses = async () => {
    try {
      const res = await api.getQuranChapter(chapter.id);
      setVerses(res.data.verses || res.data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const playAudio = async (verse) => {
    if (!Audio) return;
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      if (playingVerse === verse.verse_number) {
        setPlayingVerse(null);
        return;
      }
      const res = await api.getChapterAudio(chapter.id, verse.verse_number);
      const audioUrl = res.data.audio_url;
      if (audioUrl) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true }
        );
        setSound(newSound);
        setPlayingVerse(verse.verse_number);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setPlayingVerse(null);
          }
        });
      }
    } catch {
      setPlayingVerse(null);
    }
  };

  const renderVerse = ({ item }) => (
    <View style={s.verseCard}>
      <View style={s.verseHeader}>
        <View style={s.verseNum}>
          <Text style={s.verseNumText}>{item.verse_number}</Text>
        </View>
        <TouchableOpacity style={s.playBtn} onPress={() => playAudio(item)}>
          <Text style={s.playBtnText}>
            {playingVerse === item.verse_number ? '⏹' : '▶'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={s.arabicText}>{item.text_uthmani || item.text}</Text>
      {item.translation && (
        <Text style={s.translation}>{item.translation}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>{chapter.name_simple}</Text>
        <Text style={s.titleArabic}>{chapter.name_arabic}</Text>
        <Text style={s.meta}>
          {chapter.verses_count} verses • {chapter.revelation_place}
        </Text>
      </View>
      <FlatList
        data={verses}
        keyExtractor={(item) => String(item.verse_number || item.id)}
        renderItem={renderVerse}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bgPrimary },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    title: { fontSize: 22, ...theme.fonts.bold, color: theme.colors.textPrimary },
    titleArabic: { fontSize: 24, color: theme.colors.textSecondary, marginTop: 4 },
    meta: { fontSize: 13, color: theme.colors.textMuted, marginTop: theme.spacing.xs },
    list: { padding: theme.spacing.lg },
    verseCard: {
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 1,
    },
    verseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    verseNum: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.bgPrimary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    verseNumText: { fontSize: 13, ...theme.fonts.bold, color: theme.colors.primary },
    playBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playBtnText: { color: '#fff', fontSize: 14 },
    arabicText: {
      fontSize: theme.fonts.sizeArabic,
      lineHeight: theme.fonts.sizeArabic * 1.8,
      color: theme.colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
      marginBottom: theme.spacing.md,
    },
    translation: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 22,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
      paddingTop: theme.spacing.md,
    },
  });
