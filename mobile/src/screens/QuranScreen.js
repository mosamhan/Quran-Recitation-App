import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView, TextInput,
} from 'react-native';
import api from '../services/api';
import { colors, spacing, borderRadius, fonts } from '../utils/theme';

export default function QuranScreen({ navigation }) {
  const [chapters, setChapters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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
      // Silent fail — list stays empty
    } finally {
      setLoading(false);
    }
  };

  const renderChapter = ({ item }) => (
    <TouchableOpacity
      style={styles.chapterCard}
      onPress={() => navigation.navigate('ChapterDetail', { chapter: item })}
    >
      <View style={styles.chapterNum}>
        <Text style={styles.chapterNumText}>{item.id}</Text>
      </View>
      <View style={styles.chapterInfo}>
        <Text style={styles.chapterName}>{item.name_simple}</Text>
        <Text style={styles.chapterMeta}>
          {item.verses_count} verses • {item.revelation_place}
        </Text>
      </View>
      <Text style={styles.chapterArabic}>{item.name_arabic}</Text>
    </TouchableOpacity>
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
        <Text style={styles.title}>Quran</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search chapters..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderChapter}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: spacing.lg, paddingBottom: spacing.md },
  title: {
    fontSize: 28,
    ...fonts.extraBold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  chapterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  chapterNum: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  chapterNumText: { fontSize: 14, ...fonts.bold, color: colors.primary },
  chapterInfo: { flex: 1 },
  chapterName: { fontSize: 16, ...fonts.semiBold, color: colors.textPrimary },
  chapterMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  chapterArabic: { fontSize: 18, color: colors.textSecondary },
});
