import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopNav from '../components/TopNav';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

export default function QuranScreen({ navigation }) {
  const { theme } = useTheme();
  const { gamificationEnabled } = useSettings();
  const [chapters, setChapters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const s = createStyles(theme);

  useEffect(() => {
    loadChapters();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(chapters);
    } else {
      const q = search.toLowerCase();
      setFiltered(
        chapters.filter(
          (c) =>
            (c.name_simple || c.english_name || '').toLowerCase().includes(q) ||
            c.name_arabic?.includes(q) ||
            String(c.number || c.id).includes(q)
        )
      );
    }
  }, [search, chapters]);

  const loadChapters = async () => {
    try {
      const res = await api.getQuranChapters();
      setChapters(res.data.chapters || res.data);
      setFiltered(res.data.chapters || res.data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const LEVEL_LABELS = ['', 'Beginner', 'Easy', 'Medium', 'Hard', 'Advanced'];
  const LEVEL_COLORS = ['', theme.colors.success, '#2ecc71', theme.colors.warning, '#e67e22', theme.colors.danger];

  const renderChapter = ({ item }) => {
    const level = item.difficulty_level || 3;
    return (
      <TouchableOpacity
        style={s.chapterCard}
        onPress={() => navigation.navigate('ChapterDetail', { chapter: item })}
      >
        <View style={s.chapterNum}>
          <Text style={s.chapterNumText}>{item.number || item.id}</Text>
        </View>
        <View style={s.chapterInfo}>
          <Text style={s.chapterName}>{item.name_simple || item.english_name}</Text>
          <Text style={s.chapterMeta}>
            {item.number_of_verses || item.verses_count} verses  ·  {item.revelation_type || item.revelation_place}
          </Text>
          {gamificationEnabled && (
            <View style={s.levelRow}>
              <View style={[s.levelDot, { backgroundColor: LEVEL_COLORS[level] }]} />
              <Text style={[s.levelText, { color: LEVEL_COLORS[level] }]}>
                {LEVEL_LABELS[level]}
              </Text>
              <Text style={s.xpText}>{item.xp_per_verse || 10} XP/verse</Text>
            </View>
          )}
        </View>
        <Text style={s.chapterArabic}>{item.name_arabic}</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <TopNav />
      <View style={s.searchWrap}>
        <Ionicons name="search-outline" size={18} color={theme.colors.textMuted} style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Search surahs..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item, index) => String(item.number || item.id || index)}
        renderItem={renderChapter}
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
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.md,
      marginHorizontal: theme.spacing.lg,
      marginVertical: theme.spacing.sm,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    searchIcon: { marginRight: 8 },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: theme.fonts.sizeBase,
      color: theme.colors.textPrimary,
    },
    list: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
    chapterCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 1,
    },
    chapterNum: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.colors.bgPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    chapterNumText: { fontSize: 14, ...theme.fonts.bold, color: theme.colors.primary },
    chapterInfo: { flex: 1 },
    chapterName: { fontSize: 16, ...theme.fonts.semiBold, color: theme.colors.textPrimary },
    chapterMeta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
    chapterArabic: { fontSize: 17, color: theme.colors.textSecondary },
    levelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    },
    levelDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 5,
    },
    levelText: {
      fontSize: 11,
      ...theme.fonts.semiBold,
    },
    xpText: {
      fontSize: 11,
      color: theme.colors.textMuted,
      marginLeft: 8,
    },
  });
