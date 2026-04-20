import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const EXPERIENCE_LEVELS = [
  { key: 'beginner', label: 'Beginner', desc: 'Just starting to learn Quran recitation' },
  { key: 'intermediate', label: 'Intermediate', desc: 'Can read Arabic and know some Tajweed rules' },
  { key: 'advanced', label: 'Advanced', desc: 'Comfortable with recitation, refining Tajweed' },
];

export default function OnboardingScreen({ navigation }) {
  const { updateProfile } = useUser();
  const { theme } = useTheme();
  const [experienceLevel, setExperienceLevel] = useState('');
  const [loading, setLoading] = useState(false);

  const s = createStyles(theme);

  const handleFinish = async () => {
    if (!experienceLevel) {
      Alert.alert('Select Experience', 'Please select your experience level.');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({
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

        <TouchableOpacity
          style={[s.button, loading && s.buttonDisabled]}
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
    content: { flex: 1, padding: theme.spacing.lg, justifyContent: 'center' },
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
    cardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.bgSecondary,
    },
    levelLabel: {
      fontSize: 17,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    cardLabelSelected: { color: theme.colors.primary },
    levelDesc: { fontSize: 14, color: theme.colors.textSecondary },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: 16,
      alignItems: 'center',
      marginTop: theme.spacing.lg,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: 17, ...theme.fonts.bold },
  });
