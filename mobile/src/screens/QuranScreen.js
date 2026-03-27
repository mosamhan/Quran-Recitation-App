import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

export default function QuranScreen({ navigation }) {
  const { theme } = useTheme();
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
            c.name_simple?.toLowerCase().includes(q) ||
            c.name_arabic?.includes(q) ||
            String(c.id).includes(q)
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

  const renderChapter = ({ item }) => (
    <TouchableOpacity
      style={s.chapterCard}
      onPress={() => navigation.navigate('ChapterDetail', { chapter: item })}
    >
      <View style={s.chapterNum}>
        <Text style={s.chapterNumText}>{item.id}</Text>
      </View>
      <View style={s.chapterInfo}>
        <Text style={s.chapterName}>{item.name_simple}</Text>
        <Text style={s.chapterMeta}>
          {item.verses_count} verses • {item.revelation_place}
        </Text>
      </View>
      <Text style={s.chapterArabic}>{item.name_arabic}</Text>
    </TouchableOpacity>
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
        <Text style={s.title}>Quran</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search chapters..."
          placeholderTextColor={theme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
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
    header: { padding: theme.spacing.lg, paddingBottom: theme.spacing.md },
    title: {
      fontSize: theme.fonts.sizeTitle,
      ...theme.fonts.extraBold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    searchInput: {
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.md,
      padding: 14,
      fontSize: theme.fonts.sizeBase,
      color: theme.colors.textPrimary,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.bgPrimary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    chapterNumText: { fontSize: 14, ...theme.fonts.bold, color: theme.colors.primary },
    chapterInfo: { flex: 1 },
    chapterName: { fontSize: 16, ...theme.fonts.semiBold, color: theme.colors.textPrimary },
    chapterMeta: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
    chapterArabic: { fontSize: 18, color: theme.colors.textSecondary },
  });
