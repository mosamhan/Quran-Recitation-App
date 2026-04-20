import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopNav from '../components/TopNav';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

export default function ProgressScreen({ navigation }) {
  const { user, isAuthenticated } = useUser();
  const { theme } = useTheme();
  const { gamificationEnabled } = useSettings();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const s = createStyles(theme);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [gamRes, sessRes] = await Promise.all([
        api.getGamificationStats(user.id),
        api.getSessions(user.id),
      ]);
      setStats(gamRes.data);
      setSessions(sessRes.data.sessions || sessRes.data || []);
    } catch {
      // Silent fail
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

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <TopNav />
        <View style={s.authPromptContainer}>
          <Ionicons name="stats-chart-outline" size={64} color={theme.colors.textMuted} />
          <Text style={s.authTitle}>Track Your Progress</Text>
          <Text style={s.authDesc}>
            Sign in to save your recitation sessions, earn XP, and track your Quran learning journey.
          </Text>
          <TouchableOpacity
            style={s.authButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={s.authButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const streakData = stats?.streak || {};
  const xp = streakData.total_xp || 0;
  const level = streakData.level || 1;
  const xpForNext = streakData.xp_for_next_level || 500;
  const xpInLevel = streakData.xp_in_current_level || 0;
  const xpProgress = xpForNext > 0 ? xpInLevel / xpForNext : 0;
  const streak = streakData.current_streak || 0;
  const badges = stats?.badges || [];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <TopNav />
      <ScrollView contentContainerStyle={s.scroll}>

        {/* Level & XP */}
        {gamificationEnabled && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Level {level}</Text>
            <View style={s.xpBarBg}>
              <View style={[s.xpBarFill, { width: `${xpProgress * 100}%` }]} />
            </View>
            <Text style={s.xpText}>
              {xpInLevel} / {xpForNext} XP to next level
            </Text>
          </View>
        )}

        {/* Streak */}
        {gamificationEnabled && (
          <View style={s.card}>
            <View style={s.streakRow}>
              <Ionicons name="flame-outline" size={36} color={theme.colors.accent || theme.colors.primary} style={{ marginRight: theme.spacing.md }} />
              <View>
                <Text style={s.streakCount}>{streak} day streak</Text>
                <Text style={s.streakSub}>Keep practicing daily!</Text>
              </View>
            </View>
          </View>
        )}

        {/* Badges */}
        {gamificationEnabled && badges.length > 0 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Badges</Text>
            <View style={s.badgeGrid}>
              {badges.map((badge, i) => (
                <View key={i} style={s.badge}>
                  <Ionicons name="ribbon-outline" size={28} color={theme.colors.primary} style={{ marginBottom: 4 }} />
                  <Text style={s.badgeName}>{badge.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Sessions */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Recent Sessions</Text>
          {sessions.length === 0 ? (
            <Text style={s.emptyText}>No sessions yet. Start practicing!</Text>
          ) : (
            sessions.slice(0, 10).map((sess, i) => (
              <View key={i} style={s.sessionRow}>
                <View>
                  <Text style={s.sessionTitle}>
                    Chapter {sess.chapter_number}:{sess.verse_number}
                  </Text>
                  <Text style={s.sessionDate}>
                    {new Date(sess.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    s.sessionAccuracy,
                    {
                      color: (sess.accuracy || 0) >= 80 ? theme.colors.success
                        : (sess.accuracy || 0) >= 60 ? theme.colors.warning
                        : theme.colors.danger,
                    },
                  ]}
                >
                  {Math.round(sess.accuracy || 0)}%
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bgPrimary },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
    // Auth prompt for unauthenticated users
    authPromptContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.xl,
    },
    authEmoji: { fontSize: 64, marginBottom: theme.spacing.lg },
    authTitle: {
      fontSize: 22,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    authDesc: {
      fontSize: theme.fonts.sizeBase,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: theme.spacing.xl,
    },
    authButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: 14,
      paddingHorizontal: theme.spacing.xxl,
    },
    authButtonText: { color: '#fff', fontSize: 17, ...theme.fonts.bold },
    // Cards
    card: {
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 18,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
    },
    xpBarBg: {
      height: 12,
      backgroundColor: theme.colors.bgPrimary,
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: theme.spacing.sm,
    },
    xpBarFill: {
      height: '100%',
      backgroundColor: theme.colors.primary,
      borderRadius: 6,
    },
    xpText: { fontSize: 13, color: theme.colors.textMuted },
    streakRow: { flexDirection: 'row', alignItems: 'center' },
    streakEmoji: { fontSize: 36, marginRight: theme.spacing.md },
    streakCount: { fontSize: 20, ...theme.fonts.bold, color: theme.colors.textPrimary },
    streakSub: { fontSize: 14, color: theme.colors.textSecondary },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md },
    badge: { alignItems: 'center', width: 70 },
    badgeIcon: { fontSize: 28, marginBottom: 4 },
    badgeName: { fontSize: 11, color: theme.colors.textSecondary, textAlign: 'center' },
    sessionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    sessionTitle: { fontSize: 15, ...theme.fonts.semiBold, color: theme.colors.textPrimary },
    sessionDate: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
    sessionAccuracy: { fontSize: 20, ...theme.fonts.bold },
    emptyText: { fontSize: 14, color: theme.colors.textMuted, fontStyle: 'italic' },
  });
