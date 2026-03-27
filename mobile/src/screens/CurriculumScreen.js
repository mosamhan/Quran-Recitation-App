import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import { colors, spacing, borderRadius, fonts } from '../utils/theme';

const LEVEL_LABELS = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };

export default function CurriculumScreen() {
  const { user } = useUser();
  const [curriculum, setCurriculum] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) loadCurriculum();
  }, [user]);

  const loadCurriculum = async () => {
    try {
      const res = await api.getCurriculum(user.id);
      setCurriculum(res.data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const levels = curriculum?.levels || [];
  const currentLevel = levels.find((l) => l.level === selectedLevel);
  const lessons = currentLevel?.lessons || [];

  const getStatusStyle = (lesson) => {
    if (lesson.completed) return { bg: colors.success, label: 'Completed', icon: '✓' };
    if (lesson.unlocked) return { bg: colors.primary, label: 'Available', icon: '▶' };
    return { bg: colors.textMuted, label: 'Locked', icon: '🔒' };
  };

  const renderLesson = ({ item }) => {
    const status = getStatusStyle(item);
    return (
      <View style={[styles.lessonCard, !item.unlocked && styles.lessonLocked]}>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={styles.statusIcon}>{status.icon}</Text>
        </View>
        <View style={styles.lessonInfo}>
          <Text style={[styles.lessonTitle, !item.unlocked && styles.lessonTitleLocked]}>
            {item.title}
          </Text>
          <Text style={styles.lessonDesc}>{item.description}</Text>
          {item.progress != null && item.progress > 0 && (
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${item.progress}%` }]} />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Curriculum</Text>
        <View style={styles.tabs}>
          {[1, 2, 3].map((lv) => (
            <TouchableOpacity
              key={lv}
              style={[styles.tab, selectedLevel === lv && styles.tabActive]}
              onPress={() => setSelectedLevel(lv)}
            >
              <Text style={[styles.tabText, selectedLevel === lv && styles.tabTextActive]}>
                {LEVEL_LABELS[lv]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <FlatList
        data={lessons}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderLesson}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No lessons available for this level.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: spacing.lg, paddingBottom: 0 },
  title: {
    fontSize: 28,
    ...fonts.extraBold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.sm,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, ...fonts.semiBold, color: colors.textSecondary },
  tabTextActive: { color: '#fff' },
  list: { padding: spacing.lg },
  lessonCard: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  lessonLocked: { opacity: 0.5 },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statusIcon: { color: '#fff', fontSize: 16 },
  lessonInfo: { flex: 1 },
  lessonTitle: { fontSize: 16, ...fonts.semiBold, color: colors.textPrimary },
  lessonTitleLocked: { color: colors.textMuted },
  lessonDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  progressBarBg: {
    height: 6,
    backgroundColor: colors.bgLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    fontStyle: 'italic',
  },
});
