import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopNav from '../components/TopNav';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const {
    gamificationEnabled,
    tajweedEnabled,
    updateSettings,
  } = useSettings();

  const s = createStyles(theme);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <TopNav />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Theme Section */}
        <Text style={s.sectionTitle}>Theme</Text>
        <View style={s.card}>
          <View style={s.themeRow}>
            <TouchableOpacity
              style={[s.themeOption, themeMode === 'light' && s.themeOptionSelected]}
              onPress={() => setThemeMode('light')}
            >
              <Ionicons
                name="sunny-outline"
                size={26}
                color={themeMode === 'light' ? theme.colors.primary : theme.colors.textMuted}
              />
              <Text style={[s.themeLabel, themeMode === 'light' && s.themeLabelSelected]}>
                Light
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.themeOption, themeMode === 'dark' && s.themeOptionSelected]}
              onPress={() => setThemeMode('dark')}
            >
              <Ionicons
                name="moon-outline"
                size={26}
                color={themeMode === 'dark' ? theme.colors.primary : theme.colors.textMuted}
              />
              <Text style={[s.themeLabel, themeMode === 'dark' && s.themeLabelSelected]}>
                Dark
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Experience Section */}
        <Text style={s.sectionTitle}>Experience</Text>
        <View style={s.card}>
          <View style={s.switchRow}>
            <View style={s.switchInfo}>
              <Text style={s.switchLabel}>Gamification</Text>
              <Text style={s.switchDesc}>XP, levels, streaks, and progress tracking</Text>
            </View>
            <Switch
              value={gamificationEnabled}
              onValueChange={(val) => updateSettings({ gamificationEnabled: val })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={s.divider} />
          <View style={s.switchRow}>
            <View style={s.switchInfo}>
              <Text style={s.switchLabel}>Tajweed Coloring</Text>
              <Text style={s.switchDesc}>Color-coded tajweed rules on Arabic text</Text>
            </View>
            <Switch
              value={tajweedEnabled}
              onValueChange={(val) => updateSettings({ tajweedEnabled: val })}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={s.note}>
          <Ionicons name="information-circle-outline" size={16} color={theme.colors.textMuted} />
          <Text style={s.noteText}>
            Mushaf layout, translation, and font settings are available within the Quran reader via the settings icon.
          </Text>
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
    themeRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    themeOption: {
      flex: 1,
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.md,
      borderWidth: 2,
      borderColor: 'transparent',
      backgroundColor: theme.colors.bgPrimary,
    },
    themeOptionSelected: {
      borderColor: theme.colors.primary,
    },
    themeLabel: {
      fontSize: 15,
      ...theme.fonts.bold,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.sm,
    },
    themeLabelSelected: {
      color: theme.colors.primary,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    switchInfo: { flex: 1, marginRight: theme.spacing.md },
    switchLabel: { fontSize: 15, ...theme.fonts.semiBold, color: theme.colors.textPrimary },
    switchDesc: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
    divider: {
      height: 1,
      backgroundColor: theme.colors.borderLight,
      marginVertical: theme.spacing.md,
    },
    note: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginTop: theme.spacing.lg,
      paddingHorizontal: theme.spacing.sm,
    },
    noteText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textMuted,
      lineHeight: 18,
    },
  });
