import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, SafeAreaView,
} from 'react-native';
import api from '../services/api';
import { useUser } from '../context/UserContext';
import { colors, spacing, borderRadius, fonts } from '../utils/theme';

export default function ProgressScreen() {
  const { user } = useUser();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) loadData();
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const xp = stats?.xp || 0;
  const level = stats?.level || 1;
  const xpForNext = 500;
  const xpProgress = (xp % xpForNext) / xpForNext;
  const streak = stats?.streak || 0;
  const badges = stats?.badges || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Your Progress</Text>

        {/* Level & XP */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Level {level}</Text>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpProgress * 100}%` }]} />
          </View>
          <Text style={styles.xpText}>
            {xp % xpForNext} / {xpForNext} XP to next level
          </Text>
        </View>

        {/* Streak */}
        <View style={styles.card}>
          <View style={styles.streakRow}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <View>
              <Text style={styles.streakCount}>{streak} day streak</Text>
              <Text style={styles.streakSub}>Keep practicing daily!</Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        {badges.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Badges</Text>
            <View style={styles.badgeGrid}>
              {badges.map((badge, i) => (
                <View key={i} style={styles.badge}>
                  <Text style={styles.badgeIcon}>{badge.icon || '🏅'}</Text>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recent Sessions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Sessions</Text>
          {sessions.length === 0 ? (
            <Text style={styles.emptyText}>No sessions yet. Start practicing!</Text>
          ) : (
            sessions.slice(0, 10).map((s, i) => (
              <View key={i} style={styles.sessionRow}>
                <View>
                  <Text style={styles.sessionTitle}>
                    Chapter {s.chapter_number}:{s.verse_number}
                  </Text>
                  <Text style={styles.sessionDate}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.sessionAccuracy,
                    {
                      color: (s.accuracy || 0) >= 80 ? colors.success
                        : (s.accuracy || 0) >= 60 ? colors.warning
                        : colors.danger,
                    },
                  ]}
                >
                  {Math.round(s.accuracy || 0)}%
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    fontSize: 28,
    ...fonts.extraBold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    ...fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  xpBarBg: {
    height: 12,
    backgroundColor: colors.bgLight,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  xpText: { fontSize: 13, color: colors.textMuted },
  streakRow: { flexDirection: 'row', alignItems: 'center' },
  streakEmoji: { fontSize: 36, marginRight: spacing.md },
  streakCount: { fontSize: 20, ...fonts.bold, color: colors.textPrimary },
  streakSub: { fontSize: 14, color: colors.textSecondary },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  badge: {
    alignItems: 'center',
    width: 70,
  },
  badgeIcon: { fontSize: 28, marginBottom: 4 },
  badgeName: { fontSize: 11, color: colors.textSecondary, textAlign: 'center' },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  sessionTitle: { fontSize: 15, ...fonts.semiBold, color: colors.textPrimary },
  sessionDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sessionAccuracy: { fontSize: 20, ...fonts.bold },
  emptyText: { fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
});
