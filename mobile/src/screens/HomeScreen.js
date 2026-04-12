import React from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TopNav from '../components/TopNav';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

export default function HomeScreen({ navigation }) {
  const { isAuthenticated } = useUser();
  const { theme } = useTheme();
  const s = createStyles(theme);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <TopNav variant="home" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.hero}>
          <Image
            source={require('../assets/logo.png')}
            style={s.logoImage}
            resizeMode="contain"
          />
          <Text style={s.arabicName}>اقرأ</Text>
          <Text style={s.tagline}>Learn to recite the Quran</Text>
        </View>

        <Pressable
          style={({ pressed }) => [s.primaryBtn, pressed && s.primaryBtnPressed]}
          onPress={() => navigation.navigate('Quran')}
        >
          <Ionicons name="book" size={20} color="#fff" />
          <Text style={s.primaryBtnText}>Open Quran</Text>
        </Pressable>

        <View style={s.grid}>
          <TouchableOpacity
            style={s.gridCard}
            onPress={() => navigation.navigate('Learn')}
          >
            <View style={[s.gridIcon, { backgroundColor: `${theme.colors.secondary}20` }]}>
              <Ionicons name="school-outline" size={24} color={theme.colors.secondary} />
            </View>
            <Text style={s.gridTitle}>Learn</Text>
            <Text style={s.gridDesc}>Guided curriculum</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.gridCard}
            onPress={() => navigation.navigate('Progress')}
          >
            <View style={[s.gridIcon, { backgroundColor: `${theme.colors.success}20` }]}>
              <Ionicons name="stats-chart-outline" size={24} color={theme.colors.success} />
            </View>
            <Text style={s.gridTitle}>Progress</Text>
            <Text style={s.gridDesc}>Track your journey</Text>
          </TouchableOpacity>
        </View>

        {!isAuthenticated && (
          <TouchableOpacity
            style={s.authCard}
            onPress={() => navigation.navigate('Login')}
          >
            <Ionicons name="person-add-outline" size={22} color={theme.colors.primary} />
            <View style={s.authInfo}>
              <Text style={s.authTitle}>Sign in to save progress</Text>
              <Text style={s.authDesc}>Sync across devices and unlock all features</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}

        <View style={{ height: theme.spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bgPrimary },
    scroll: { padding: theme.spacing.lg },
    hero: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    logoImage: {
      width: 90,
      height: 90,
      marginBottom: theme.spacing.sm,
    },
    arabicName: {
      fontSize: 34,
      ...theme.fonts.bold,
      color: theme.colors.primary,
      marginBottom: 4,
    },
    tagline: {
      fontSize: 15,
      color: theme.colors.textSecondary,
    },
    primaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: 16,
      gap: 10,
      marginBottom: theme.spacing.lg,
      transform: [{ scale: 1 }],
    },
    primaryBtnPressed: {
      opacity: 0.85,
      backgroundColor: theme.colors.primaryDark,
      transform: [{ scale: 0.97 }],
    },
    primaryBtnText: {
      color: '#fff',
      fontSize: 17,
      ...theme.fonts.bold,
    },
    grid: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    gridCard: {
      flex: 1,
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    gridIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    gridTitle: {
      fontSize: 16,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
      marginBottom: 2,
    },
    gridDesc: {
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    authCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    authInfo: { flex: 1 },
    authTitle: {
      fontSize: 15,
      ...theme.fonts.semiBold,
      color: theme.colors.textPrimary,
    },
    authDesc: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
  });
