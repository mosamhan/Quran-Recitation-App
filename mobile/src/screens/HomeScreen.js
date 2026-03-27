import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

export default function HomeScreen({ navigation }) {
  const { user } = useUser();
  const { theme } = useTheme();
  const displayName = user?.display_name || user?.username || 'Learner';
  const s = createStyles(theme);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.center}>
        <View style={s.card}>
          <Image source={require('../assets/logo.png')} style={s.logoImage} resizeMode="contain" />
          <Text style={s.tagline}>Learn to recite the Quran</Text>

          <Text style={s.welcome}>
            Welcome back, <Text style={s.welcomeBold}>{displayName}</Text>
          </Text>

          <TouchableOpacity
            style={s.button}
            onPress={() => navigation.navigate('Practice')}
          >
            <Text style={s.buttonText}>Continue Learning</Text>
          </TouchableOpacity>

          <View style={s.quickLinks}>
            <TouchableOpacity style={s.linkCard} onPress={() => navigation.navigate('Quran')}>
              <Ionicons name="book-outline" size={22} color={theme.colors.textSecondary} />
              <Text style={s.linkLabel}>Browse Quran</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.linkCard} onPress={() => navigation.navigate('Curriculum')}>
              <Ionicons name="school-outline" size={22} color={theme.colors.textSecondary} />
              <Text style={s.linkLabel}>Curriculum</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.linkCard} onPress={() => navigation.navigate('Progress')}>
              <Ionicons name="stats-chart-outline" size={22} color={theme.colors.textSecondary} />
              <Text style={s.linkLabel}>Progress</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bgPrimary },
    center: { flex: 1, justifyContent: 'center', padding: theme.spacing.lg },
    card: {
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      alignItems: 'center',
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 5,
    },
    logoImage: { width: 80, height: 80, marginBottom: theme.spacing.sm },
    tagline: { fontSize: 15, color: theme.colors.textSecondary, marginBottom: theme.spacing.xl },
    welcome: { fontSize: 18, color: theme.colors.textPrimary, marginBottom: theme.spacing.lg },
    welcomeBold: { ...theme.fonts.bold, color: theme.colors.primary },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      paddingVertical: 16,
      paddingHorizontal: theme.spacing.xxl,
      alignItems: 'center',
      width: '100%',
      marginBottom: theme.spacing.xl,
    },
    buttonText: { color: '#fff', fontSize: 17, ...theme.fonts.bold },
    quickLinks: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    linkCard: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme.colors.bgPrimary,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginHorizontal: theme.spacing.xs,
      gap: 6,
    },
    linkLabel: { fontSize: 12, color: theme.colors.textSecondary, ...theme.fonts.semiBold },
  });
