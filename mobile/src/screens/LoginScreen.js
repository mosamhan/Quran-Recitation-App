import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { login } = useUser();
  const { theme } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const s = createStyles(theme);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const data = await login(identifier, password);
      if (!data.user.onboarding_completed) {
        navigation.replace('Onboarding');
      } else {
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Dismiss handle */}
      <View style={s.handleBar} />

      <View style={s.card}>
        <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={s.closeBtnText}>✕</Text>
        </TouchableOpacity>

        <Text style={s.logo}>IQRA</Text>
        <Text style={s.subtitle}>Sign in to sync your progress</Text>

        <TextInput
          style={s.input}
          placeholder="Username or Email"
          placeholderTextColor={theme.colors.textMuted}
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor={theme.colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[s.button, loading && s.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>Log In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace('Register')}>
          <Text style={s.linkText}>
            Don't have an account? <Text style={s.linkBold}>Sign Up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bgPrimary,
      justifyContent: 'center',
      padding: theme.spacing.lg,
    },
    handleBar: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
      alignSelf: 'center',
      position: 'absolute',
      top: 12,
    },
    card: {
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.xl,
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 5,
    },
    closeBtn: {
      position: 'absolute',
      top: 16,
      right: 16,
      zIndex: 1,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.bgPrimary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeBtnText: { fontSize: 16, color: theme.colors.textMuted },
    logo: {
      fontSize: 36,
      ...theme.fonts.extraBold,
      color: theme.colors.primary,
      textAlign: 'center',
      letterSpacing: 6,
      marginBottom: theme.spacing.sm,
    },
    subtitle: {
      fontSize: theme.fonts.sizeSmall,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: theme.spacing.xl,
    },
    input: {
      backgroundColor: theme.colors.bgPrimary,
      borderRadius: theme.borderRadius.md,
      padding: 16,
      fontSize: theme.fonts.sizeBase,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.md,
      padding: 16,
      alignItems: 'center',
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: '#fff', fontSize: 17, ...theme.fonts.bold },
    linkText: {
      textAlign: 'center',
      color: theme.colors.textSecondary,
      fontSize: 14,
    },
    linkBold: { color: theme.colors.primary, ...theme.fonts.bold },
  });
