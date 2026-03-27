import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

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
  const { theme, setAgeGroup: setThemeAgeGroup } = useTheme();
  const [step, setStep] = useState(1);
  const [ageGroup, setAgeGroup] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [loading, setLoading] = useState(false);

  const s = createStyles(theme);

  const handleNext = () => {
    if (!ageGroup) {
      Alert.alert('Select Age Group', 'Please select your age group to continue.');
      return;
    }
    setThemeAgeGroup(ageGroup);
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
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save your preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.handleBar} />

      {/* Progress dots */}
      <View style={s.progress}>
        <View style={[s.dot, step >= 1 && s.dotActive]} />
        <View style={s.progressLine} />
        <View style={[s.dot, step >= 2 && s.dotActive]} />
      </View>

      {step === 1 ? (
        <View style={s.content}>
          <Text style={s.title}>How old are you?</Text>
          <Text style={s.subtitle}>We'll personalize your learning experience</Text>

          <View style={s.grid}>
            {AGE_GROUPS.map((ag) => (
              <TouchableOpacity
                key={ag.key}
                style={[s.card, ageGroup === ag.key && s.cardSelected]}
                onPress={() => setAgeGroup(ag.key)}
              >
                <Text style={s.cardEmoji}>{ag.emoji}</Text>
                <Text style={[s.cardLabel, ageGroup === ag.key && s.cardLabelSelected]}>
                  {ag.label}
                </Text>
                <Text style={s.cardDesc}>{ag.ages}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.button} onPress={handleNext}>
            <Text style={s.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.content}>
          <Text style={s.title}>Your Experience</Text>
          <Text style={s.subtitle}>What best describes your Quran recitation level?</Text>

          {EXPERIENCE_LEVELS.map((lv) => (
            <TouchableOpacity
              key={lv.key}
              style={[s.levelCard, experienceLevel === lv.key && s.cardSelected]}
              onPress={() => setExperienceLevel(lv.key)}
            >
              <Text style={[s.levelLabel, experienceLevel === lv.key && s.cardLabelSelected]}>
                {lv.label}
              </Text>
              <Text style={s.levelDesc}>{lv.desc}</Text>
            </TouchableOpacity>
          ))}

          <View style={s.buttonRow}>
            <TouchableOpacity style={s.backButton} onPress={() => setStep(1)}>
              <Text style={s.backButtonText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.button, { flex: 1 }, loading && s.buttonDisabled]}
              onPress={handleFinish}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.buttonText}>Get Started</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bgPrimary },
    handleBar: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
      alignSelf: 'center',
      marginTop: 12,
    },
    progress: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.md,
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.border,
    },
    dotActive: { backgroundColor: theme.colors.primary },
    progressLine: {
      width: 40,
      height: 2,
      backgroundColor: theme.colors.border,
      marginHorizontal: theme.spacing.sm,
    },
    content: { flex: 1, padding: theme.spacing.lg },
    title: {
      fontSize: theme.fonts.sizeTitle,
      ...theme.fonts.extraBold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    grid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xl,
    },
    card: {
      flex: 1,
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginHorizontal: theme.spacing.xs,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    cardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.bgSecondary,
    },
    cardEmoji: { fontSize: 36, marginBottom: theme.spacing.sm },
    cardLabel: {
      fontSize: 16,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    cardLabelSelected: { color: theme.colors.primary },
    cardDesc: { fontSize: 12, color: theme.colors.textSecondary },
    levelCard: {
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 2,
      borderColor: 'transparent',
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    levelLabel: {
      fontSize: 17,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    levelDesc: { fontSize: 14, color: theme.colors.textSecondary },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: 16,
      alignItems: 'center',
      marginTop: theme.spacing.sm,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: 17, ...theme.fonts.bold },
    buttonRow: {
      flexDirection: 'row',
      marginTop: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    backButton: {
      borderRadius: theme.borderRadius.md,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.xl,
    },
    backButtonText: { fontSize: 17, color: theme.colors.textSecondary, ...theme.fonts.bold },
  });
