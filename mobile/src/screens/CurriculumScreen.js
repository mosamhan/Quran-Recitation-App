import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopNav from '../components/TopNav';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const LEVEL_LABELS = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };

export default function CurriculumScreen() {
  const { user } = useUser();
  const { theme } = useTheme();
  const [curriculum, setCurriculum] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  const s = createStyles(theme);

  useEffect(() => {
    loadCurriculum();
  }, [user]);

  const loadCurriculum = async () => {
    try {
      const res = await api.getCurriculum(user?.id);
      setCurriculum(res.data);
    } catch {
      // Silent fail — works without account too
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const levels = curriculum?.levels || [];
  const currentLevel = levels.find((l) => l.level === selectedLevel);
  const lessons = currentLevel?.lessons || [];

  const getStatusStyle = (lesson) => {
    if (lesson.completed) return { bg: theme.colors.success, icon: 'checkmark' };
    if (lesson.unlocked) return { bg: theme.colors.primary, icon: 'play' };
    return { bg: theme.colors.textMuted, icon: 'lock-closed-outline' };
  };

  const renderLesson = ({ item }) => {
    const status = getStatusStyle(item);
    return (
      <View style={[s.lessonCard, !item.unlocked && s.lessonLocked]}>
        <View style={[s.statusBadge, { backgroundColor: status.bg }]}>
          <Ionicons name={status.icon} size={18} color="#fff" />
        </View>
        <View style={s.lessonInfo}>
          <Text style={[s.lessonTitle, !item.unlocked && s.lessonTitleLocked]}>
            {item.title}
          </Text>
          <Text style={s.lessonDesc}>{item.description}</Text>
          {item.progress != null && item.progress > 0 && (
            <View style={s.progressBarBg}>
              <View style={[s.progressBarFill, { width: `${item.progress}%` }]} />
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <TopNav />
      <View style={s.header}>
        <View style={s.tabs}>
          {[1, 2, 3].map((lv) => (
            <TouchableOpacity
              key={lv}
              style={[s.tab, selectedLevel === lv && s.tabActive]}
              onPress={() => setSelectedLevel(lv)}
            >
              <Text style={[s.tabText, selectedLevel === lv && s.tabTextActive]}>
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
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={s.emptyText}>No lessons available for this level.</Text>
        }
      />
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bgPrimary },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: theme.spacing.lg, paddingBottom: 0 },
    tabs: {
      flexDirection: 'row',
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.md,
      padding: 4,
      marginBottom: theme.spacing.md,
    },
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      alignItems: 'center',
      borderRadius: theme.borderRadius.sm,
    },
    tabActive: { backgroundColor: theme.colors.primary },
    tabText: { fontSize: 14, ...theme.fonts.semiBold, color: theme.colors.textSecondary },
    tabTextActive: { color: '#fff' },
    list: { padding: theme.spacing.lg },
    lessonCard: {
      flexDirection: 'row',
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      alignItems: 'center',
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
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
      marginRight: theme.spacing.md,
    },
    statusIcon: { color: '#fff', fontSize: 16 },
    lessonInfo: { flex: 1 },
    lessonTitle: { fontSize: 16, ...theme.fonts.semiBold, color: theme.colors.textPrimary },
    lessonTitleLocked: { color: theme.colors.textMuted },
    lessonDesc: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
    progressBarBg: {
      height: 6,
      backgroundColor: theme.colors.bgPrimary,
      borderRadius: 3,
      overflow: 'hidden',
      marginTop: theme.spacing.sm,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 3,
    },
    emptyText: {
      fontSize: 14,
      color: theme.colors.textMuted,
      textAlign: 'center',
      marginTop: theme.spacing.xl,
      fontStyle: 'italic',
    },
  });
