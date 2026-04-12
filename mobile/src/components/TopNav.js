import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

export default function TopNav({ showBack, onBack, rightAction, variant }) {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useUser();
  const navigation = useNavigation();
  const s = createStyles(theme);

  const isHome = variant === 'home';
  const displayName = user?.display_name || user?.username || 'Learner';

  const goHome = () => {
    navigation.navigate('Home');
  };

  const accountButton = (
    <TouchableOpacity
      style={s.sideBtn}
      onPress={() => navigation.navigate(isAuthenticated ? 'Profile' : 'Login')}
    >
      {isAuthenticated ? (
        <View style={s.avatarSmall}>
          <Ionicons name="person" size={14} color="#fff" />
        </View>
      ) : (
        <Ionicons name="person-circle-outline" size={26} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  // Home variant: logo left, greeting + account button right
  if (isHome) {
    return (
      <View style={s.container}>
        <TouchableOpacity onPress={goHome} activeOpacity={0.7} style={s.logoLeft}>
          <Image
            source={require('../assets/logo.png')}
            style={s.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <View style={s.homeRight}>
          <Text style={s.greeting} numberOfLines={1}>
            Salam, <Text style={s.greetingName}>{displayName}</Text>
          </Text>
          {rightAction || accountButton}
        </View>
      </View>
    );
  }

  // Default variant: centered logo
  return (
    <View style={s.container}>
      <View style={s.side}>
        {showBack ? (
          <TouchableOpacity onPress={onBack} style={s.sideBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={s.sideBtn} />
        )}
      </View>
      <TouchableOpacity style={s.center} onPress={goHome} activeOpacity={0.7}>
        <Image
          source={require('../assets/logo.png')}
          style={s.logo}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <View style={s.side}>
        {rightAction || accountButton}
      </View>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    side: {
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sideBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      width: 36,
      height: 36,
    },
    avatarSmall: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Home variant styles
    logoLeft: {
      paddingRight: theme.spacing.sm,
    },
    homeRight: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: theme.spacing.sm,
    },
    greeting: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      flexShrink: 1,
    },
    greetingName: {
      ...theme.fonts.bold,
      color: theme.colors.primary,
    },
  });
