import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { colors, spacing, borderRadius, fonts } from '../utils/theme';

const AGE_GROUPS = [
  { key: 'child', label: 'Child', ages: 'Ages 5-12', emoji: '🌟' },
  { key: 'teen', label: 'Teen', ages: 'Ages 13-17', emoji: '🚀' },
  { key: 'adult', label: 'Adult', ages: 'Ages 18+', emoji: '📚' },
];

const EXPERIENCE_LEVELS = [
  { key: 'beginner', label: 'Beginner', desc: 'Just starting to learn Quran recitation' },
  { key: 'intermediate', label: 'Intermediate', desc: 'Can read Arabic and know some Tajweed rules' },
  { key: 'advanced', label: 'Advanced', desc: 'Comfortable with recitation, refining Tajweed' },
];

export default function OnboardingScreen({ navigation }) {
  const { updateProfile } = useUser();
  const [step, setStep] = useState(1);
  const [ageGroup, setAgeGroup] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (!ageGroup) {
      Alert.alert('Select Age Group', 'Please select your age group to continue.');
      return;
    }
    setStep(2);
  };

  const handleFinish = async () => {
    if (!experienceLevel) {
      Alert.alert('Select Experience', 'Please select your experience level.');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
        age_group: ageGroup,
        experience_level: experienceLevel,
        onboarding_completed: true,
      });
      navigation.replace('Main');
    } catch {
      Alert.alert('Error', 'Could not save your preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress dots */}
      <View style={styles.progress}>
        <View style={[styles.dot, step >= 1 && styles.dotActive]} />
        <View style={styles.progressLine} />
        <View style={[styles.dot, step >= 2 && styles.dotActive]} />
      </View>

      {step === 1 ? (
        <View style={styles.content}>
          <Text style={styles.title}>How old are you?</Text>
          <Text style={styles.subtitle}>We'll personalize your learning experience</Text>

          <View style={styles.grid}>
            {AGE_GROUPS.map((ag) => (
              <TouchableOpacity
                key={ag.key}
                style={[styles.card, ageGroup === ag.key && styles.cardSelected]}
                onPress={() => setAgeGroup(ag.key)}
              >
                <Text style={styles.cardEmoji}>{ag.emoji}</Text>
                <Text style={[styles.cardLabel, ageGroup === ag.key && styles.cardLabelSelected]}>
                  {ag.label}
                </Text>
                <Text style={styles.cardDesc}>{ag.ages}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.title}>Your Experience</Text>
          <Text style={styles.subtitle}>What best describes your Quran recitation level?</Text>

          {EXPERIENCE_LEVELS.map((lv) => (
            <TouchableOpacity
              key={lv.key}
              style={[styles.levelCard, experienceLevel === lv.key && styles.cardSelected]}
              onPress={() => setExperienceLevel(lv.key)}
            >
              <Text style={[styles.levelLabel, experienceLevel === lv.key && styles.cardLabelSelected]}>
                {lv.label}
              </Text>
              <Text style={styles.levelDesc}>{lv.desc}</Text>
            </TouchableOpacity>
          ))}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { flex: 1 }, loading && styles.buttonDisabled]}
              onPress={handleFinish}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Get Started</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  content: { flex: 1, padding: spacing.lg },
  title: {
    fontSize: 28,
    ...fonts.extraBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  card: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#f0f3ff',
  },
  cardEmoji: { fontSize: 36, marginBottom: spacing.sm },
  cardLabel: {
    fontSize: 16,
    ...fonts.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardLabelSelected: { color: colors.primary },
  cardDesc: { fontSize: 12, color: colors.textSecondary },
  levelCard: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  levelLabel: {
    fontSize: 17,
    ...fonts.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  levelDesc: { fontSize: 14, color: colors.textSecondary },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: 16,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, ...fonts.bold },
  buttonRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    borderRadius: borderRadius.md,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
  },
  backButtonText: { fontSize: 17, color: colors.textSecondary, ...fonts.bold },
});
