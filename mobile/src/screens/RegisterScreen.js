import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useUser();
  const { theme } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const s = createStyles(theme);

  const handleRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    setLoading(true);
    try {
      await register({
        username,
        email,
        password,
        display_name: displayName || username,
      });
      navigation.replace('Onboarding');
    } catch (err) {
      Alert.alert('Registration Failed', err.response?.data?.error || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.handleBar} />

        <View style={s.card}>
          <TouchableOpacity style={s.closeBtn} onPress={() => navigation.goBack()}>
            <Text style={s.closeBtnText}>✕</Text>
          </TouchableOpacity>

          <Text style={s.title}>Create Account</Text>

          <TextInput
            style={s.input}
            placeholder="Username *"
            placeholderTextColor={theme.colors.textMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <TextInput
            style={s.input}
            placeholder="Email *"
            placeholderTextColor={theme.colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={s.input}
            placeholder="Display Name"
            placeholderTextColor={theme.colors.textMuted}
            value={displayName}
            onChangeText={setDisplayName}
          />
          <TextInput
            style={s.input}
            placeholder="Password *"
            placeholderTextColor={theme.colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[s.button, loading && s.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.replace('Login')}>
            <Text style={s.linkText}>
              Already have an account? <Text style={s.linkBold}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bgPrimary },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.lg },
    handleBar: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.colors.border,
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
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
    title: {
      fontSize: theme.fonts.sizeTitle,
      ...theme.fonts.extraBold,
      color: theme.colors.textPrimary,
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
    linkText: { textAlign: 'center', color: theme.colors.textSecondary, fontSize: 14 },
    linkBold: { color: theme.colors.primary, ...theme.fonts.bold },
  });
