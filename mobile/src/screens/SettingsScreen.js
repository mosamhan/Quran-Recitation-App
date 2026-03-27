import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const AGE_THEMES = [
  { key: 'child', label: 'Child', ages: '5-12', emoji: '🌟', preview: '#FF6B9D' },
  { key: 'teen', label: 'Teen', ages: '13-17', emoji: '🚀', preview: '#667eea' },
  { key: 'adult', label: 'Adult', ages: '18+', emoji: '📚', preview: '#2c3e50' },
];

const TRANSLATIONS = [
  { key: 'en', label: 'English' },
  { key: 'ur', label: 'Urdu' },
  { key: 'fr', label: 'French' },
  { key: 'tr', label: 'Turkish' },
  { key: 'id', label: 'Indonesian' },
];

const MUSHAF_LAYOUTS = [
  { key: 'page', label: 'Page View', desc: 'Traditional mushaf layout' },
  { key: 'scroll', label: 'Scroll View', desc: 'Continuous scrolling' },
  { key: 'verse', label: 'Verse by Verse', desc: 'One verse at a time' },
];

export default function SettingsScreen({ navigation }) {
  const { user, logout, isAuthenticated } = useUser();
  const { theme, ageGroup, setAgeGroup } = useTheme();
  const [selectedTranslation, setSelectedTranslation] = useState('en');
  const [selectedLayout, setSelectedLayout] = useState('scroll');
  const [showTranslation, setShowTranslation] = useState(true);

  const s = createStyles(theme);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>Settings</Text>

        {/* ──── Account Section ──── */}
        <Text style={s.sectionTitle}>Account</Text>
        {isAuthenticated ? (
          <View style={s.card}>
            <View style={s.profileRow}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>
                  {(user?.display_name || user?.username || '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={s.profileInfo}>
                <Text style={s.profileName}>{user?.display_name || user?.username}</Text>
                <Text style={s.profileEmail}>{user?.email}</Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.row}>
              <Text style={s.label}>Username</Text>
              <Text style={s.value}>{user?.username}</Text>
            </View>
            <View style={s.row}>
              <Text style={s.label}>Experience</Text>
              <Text style={s.value}>{user?.experience_level || 'Not set'}</Text>
            </View>
            <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
              <Text style={s.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.card}>
            <Text style={s.authPrompt}>
              Sign in to save your progress across devices and unlock all features.
            </Text>
            <View style={s.authButtons}>
              <TouchableOpacity
                style={s.signInBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={s.signInText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.createBtn}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={s.createText}>Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ──── Theme Section ──── */}
        <Text style={s.sectionTitle}>Theme</Text>
        <View style={s.card}>
          <Text style={s.cardDesc}>Choose a visual style suited to your age group</Text>
          <View style={s.themeGrid}>
            {AGE_THEMES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[
                  s.themeCard,
                  ageGroup === t.key && { borderColor: t.preview },
                ]}
                onPress={() => setAgeGroup(t.key)}
              >
                <View style={[s.themePreview, { backgroundColor: t.preview }]} />
                <Text style={s.themeEmoji}>{t.emoji}</Text>
                <Text style={[
                  s.themeLabel,
                  ageGroup === t.key && { color: t.preview },
                ]}>
                  {t.label}
                </Text>
                <Text style={s.themeAges}>{t.ages}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ──── Mushaf Layout Section ──── */}
        <Text style={s.sectionTitle}>Mushaf Layout</Text>
        <View style={s.card}>
          {MUSHAF_LAYOUTS.map((layout) => (
            <TouchableOpacity
              key={layout.key}
              style={[
                s.optionRow,
                selectedLayout === layout.key && s.optionRowSelected,
              ]}
              onPress={() => setSelectedLayout(layout.key)}
            >
              <View style={s.optionInfo}>
                <Text style={[
                  s.optionLabel,
                  selectedLayout === layout.key && s.optionLabelSelected,
                ]}>
                  {layout.label}
                </Text>
                <Text style={s.optionDesc}>{layout.desc}</Text>
              </View>
              {selectedLayout === layout.key && (
                <Text style={s.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ──── Translation Section ──── */}
        <Text style={s.sectionTitle}>Translation</Text>
        <View style={s.card}>
          <View style={s.switchRow}>
            <Text style={s.switchLabel}>Show Translation</Text>
            <Switch
              value={showTranslation}
              onValueChange={setShowTranslation}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>
          {showTranslation && (
            <View style={s.translationList}>
              {TRANSLATIONS.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    s.translationChip,
                    selectedTranslation === t.key && s.translationChipSelected,
                  ]}
                  onPress={() => setSelectedTranslation(t.key)}
                >
                  <Text style={[
                    s.translationChipText,
                    selectedTranslation === t.key && s.translationChipTextSelected,
                  ]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ──── About Section ──── */}
        <Text style={s.sectionTitle}>About</Text>
        <View style={s.card}>
          <View style={s.row}>
            <Text style={s.label}>App Version</Text>
            <Text style={s.value}>1.0.0</Text>
          </View>
          <View style={s.rowLast}>
            <Text style={s.label}>Built with</Text>
            <Text style={s.value}>React Native + Expo</Text>
          </View>
        </View>

        <View style={{ height: theme.spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bgPrimary },
    scroll: { padding: theme.spacing.lg },
    title: {
      fontSize: theme.fonts.sizeTitle,
      ...theme.fonts.extraBold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
      fontSize: theme.fonts.sizeLarge,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    card: {
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    cardDesc: {
      fontSize: theme.fonts.sizeSmall,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
    },
    // Account
    profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    avatarText: { color: '#fff', fontSize: 22, ...theme.fonts.bold },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 18, ...theme.fonts.bold, color: theme.colors.textPrimary },
    profileEmail: { fontSize: 14, color: theme.colors.textSecondary },
    divider: {
      height: 1,
      backgroundColor: theme.colors.borderLight,
      marginBottom: theme.spacing.sm,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    rowLast: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    label: { fontSize: 15, color: theme.colors.textSecondary },
    value: { fontSize: 15, ...theme.fonts.semiBold, color: theme.colors.textPrimary },
    logoutBtn: {
      marginTop: theme.spacing.md,
      padding: 14,
      borderRadius: theme.borderRadius.md,
      backgroundColor: 'rgba(231,76,60,0.1)',
      alignItems: 'center',
    },
    logoutText: { color: theme.colors.danger, fontSize: 16, ...theme.fonts.bold },
    authPrompt: {
      fontSize: theme.fonts.sizeBase,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.md,
      lineHeight: 22,
    },
    authButtons: { flexDirection: 'row', gap: theme.spacing.sm },
    signInBtn: {
      flex: 1,
      padding: 14,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
    },
    signInText: { color: '#fff', fontSize: 16, ...theme.fonts.bold },
    createBtn: {
      flex: 1,
      padding: 14,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1.5,
      borderColor: theme.colors.primary,
      alignItems: 'center',
    },
    createText: { color: theme.colors.primary, fontSize: 16, ...theme.fonts.bold },
    // Theme picker
    themeGrid: { flexDirection: 'row', gap: theme.spacing.sm },
    themeCard: {
      flex: 1,
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: 'transparent',
      backgroundColor: theme.colors.bgPrimary,
    },
    themePreview: {
      width: '100%',
      height: 6,
      borderRadius: 3,
      marginBottom: theme.spacing.sm,
    },
    themeEmoji: { fontSize: 28, marginBottom: 4 },
    themeLabel: { fontSize: 14, ...theme.fonts.bold, color: theme.colors.textPrimary },
    themeAges: { fontSize: 11, color: theme.colors.textMuted },
    // Mushaf layout
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
      marginBottom: 4,
    },
    optionRowSelected: { backgroundColor: theme.colors.bgPrimary },
    optionInfo: { flex: 1 },
    optionLabel: { fontSize: 15, ...theme.fonts.semiBold, color: theme.colors.textPrimary },
    optionLabelSelected: { color: theme.colors.primary },
    optionDesc: { fontSize: 12, color: theme.colors.textMuted },
    checkmark: { fontSize: 18, color: theme.colors.primary, ...theme.fonts.bold },
    // Translation
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    switchLabel: { fontSize: 15, ...theme.fonts.semiBold, color: theme.colors.textPrimary },
    translationList: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    translationChip: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: theme.borderRadius.round,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    translationChipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    translationChipText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      ...theme.fonts.semiBold,
    },
    translationChipTextSelected: { color: '#fff' },
  });
