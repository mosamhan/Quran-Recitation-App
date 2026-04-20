import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
let Audio;
try {
  Audio = require('expo-av').Audio;
} catch {
  Audio = null;
}
import api from '../services/api';
import { colors, spacing, borderRadius, fonts } from '../utils/theme';

export default function ChapterDetailScreen({ route }) {
  const { chapter } = route.params;
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingVerse, setPlayingVerse] = useState(null);
  const [sound, setSound] = useState(null);

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
      // Audio not available
      setPlayingVerse(null);
    }
  };

  const renderVerse = ({ item }) => (
    <View style={styles.verseCard}>
      <View style={styles.verseHeader}>
        <View style={styles.verseNum}>
          <Text style={styles.verseNumText}>{item.verse_number}</Text>
        </View>
        <TouchableOpacity
          style={styles.playBtn}
          onPress={() => playAudio(item)}
        >
          <Text style={styles.playBtnText}>
            {playingVerse === item.verse_number ? '⏹' : '▶'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.arabicText}>{item.text_uthmani || item.text}</Text>
      {item.translation && (
        <Text style={styles.translation}>{item.translation}</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{chapter.name_simple}</Text>
        <Text style={styles.titleArabic}>{chapter.name_arabic}</Text>
        <Text style={styles.meta}>
          {chapter.verses_count} verses • {chapter.revelation_place}
        </Text>
      </View>
      <FlatList
        data={verses}
        keyExtractor={(item) => String(item.verse_number || item.id)}
        renderItem={renderVerse}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  title: { fontSize: 22, ...fonts.bold, color: colors.textPrimary },
  titleArabic: { fontSize: 24, color: colors.textSecondary, marginTop: 4 },
  meta: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },
  list: { padding: spacing.lg },
  verseCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  verseNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseNumText: { fontSize: 13, ...fonts.bold, color: colors.primary },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnText: { color: '#fff', fontSize: 14 },
  arabicText: {
    fontSize: 24,
    lineHeight: 44,
    color: colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  translation: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
});
