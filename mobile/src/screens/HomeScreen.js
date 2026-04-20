import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { colors, spacing, borderRadius, fonts } from '../utils/theme';

export default function HomeScreen({ navigation }) {
  const { user } = useUser();
  const displayName = user?.display_name || user?.username || 'Learner';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.logo}>IQRA</Text>
          <Text style={styles.tagline}>Learn to recite the Quran</Text>

          <Text style={styles.welcome}>
            Welcome back, <Text style={styles.welcomeBold}>{displayName}</Text>
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Practice')}
          >
            <Text style={styles.buttonText}>Continue Learning</Text>
          </TouchableOpacity>

          <View style={styles.quickLinks}>
            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => navigation.navigate('Quran')}
            >
              <Text style={styles.linkEmoji}>📖</Text>
              <Text style={styles.linkLabel}>Browse Quran</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => navigation.navigate('Curriculum')}
            >
              <Text style={styles.linkEmoji}>🎯</Text>
              <Text style={styles.linkLabel}>Curriculum</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => navigation.navigate('Progress')}
            >
              <Text style={styles.linkEmoji}>📊</Text>
              <Text style={styles.linkLabel}>Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  center: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
  },
  logo: {
    fontSize: 42,
    ...fonts.extraBold,
    color: colors.primary,
    letterSpacing: 8,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  welcome: {
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  welcomeBold: { ...fonts.bold, color: colors.primary },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 16,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.xl,
  },
  buttonText: { color: '#fff', fontSize: 17, ...fonts.bold },
  quickLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  linkCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.bgLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
  },
  linkEmoji: { fontSize: 24, marginBottom: spacing.xs },
  linkLabel: { fontSize: 12, color: colors.textSecondary, ...fonts.semiBold },
});
