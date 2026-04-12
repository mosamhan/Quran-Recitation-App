import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';

const EXPERIENCE_LEVELS = [
  { key: 'beginner', label: 'Beginner', desc: 'Just starting to learn' },
  { key: 'intermediate', label: 'Intermediate', desc: 'Can read Arabic, know some Tajweed' },
  { key: 'advanced', label: 'Advanced', desc: 'Refining Tajweed and memorization' },
];

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateProfile, isAuthenticated } = useUser();
  const { theme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [experienceLevel, setExperienceLevel] = useState(user?.experience_level || '');
  const [saving, setSaving] = useState(false);

  const s = createStyles(theme);

  if (!isAuthenticated) {
    navigation.replace('Login');
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName.trim() || user.username,
        experience_level: experienceLevel,
      });
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          logout();
          navigation.goBack();
        },
      },
    ]);
  };

  const currentLevel = EXPERIENCE_LEVELS.find((l) => l.key === (user?.experience_level || experienceLevel));

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Account</Text>
        <View style={s.backBtn} />
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Avatar + Name */}
        <View style={s.profileSection}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {(user?.display_name || user?.username || '?')[0].toUpperCase()}
            </Text>
          </View>
          <Text style={s.profileName}>{user?.display_name || user?.username}</Text>
          <Text style={s.profileEmail}>{user?.email}</Text>
          {currentLevel && !editing && (
            <View style={s.levelBadge}>
              <Text style={s.levelBadgeText}>{currentLevel.label}</Text>
            </View>
          )}
        </View>

        {editing ? (
          /* Edit mode */
          <View style={s.card}>
            <Text style={s.cardTitle}>Edit Profile</Text>

            <Text style={s.inputLabel}>Display Name</Text>
            <TextInput
              style={s.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder={user?.username}
              placeholderTextColor={theme.colors.textMuted}
            />

            <Text style={s.inputLabel}>Experience Level</Text>
            {EXPERIENCE_LEVELS.map((lv) => (
              <TouchableOpacity
                key={lv.key}
                style={[s.levelOption, experienceLevel === lv.key && s.levelOptionSelected]}
                onPress={() => setExperienceLevel(lv.key)}
              >
                <View style={s.levelOptionInfo}>
                  <Text style={[s.levelOptionLabel, experienceLevel === lv.key && s.levelOptionLabelSelected]}>
                    {lv.label}
                  </Text>
                  <Text style={s.levelOptionDesc}>{lv.desc}</Text>
                </View>
                {experienceLevel === lv.key && (
                  <Ionicons name="checkmark-circle" size={22} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <View style={s.editActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setEditing(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.saveBtn, saving && s.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={s.saveBtnText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* View mode */
          <>
            <View style={s.card}>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Username</Text>
                <Text style={s.infoValue}>{user?.username}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Email</Text>
                <Text style={s.infoValue}>{user?.email}</Text>
              </View>
              <View style={s.infoRow}>
                <Text style={s.infoLabel}>Experience</Text>
                <Text style={s.infoValue}>{currentLevel?.label || 'Not set'}</Text>
              </View>
              <View style={s.infoRowLast}>
                <Text style={s.infoLabel}>Member since</Text>
                <Text style={s.infoValue}>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={s.editBtn} onPress={() => {
              setDisplayName(user?.display_name || '');
              setExperienceLevel(user?.experience_level || '');
              setEditing(true);
            }}>
              <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
              <Text style={s.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.bgPrimary },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: theme.colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, ...theme.fonts.bold, color: theme.colors.textPrimary },
    scroll: { padding: theme.spacing.lg },
    profileSection: { alignItems: 'center', marginBottom: theme.spacing.xl },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    avatarText: { color: '#fff', fontSize: 32, ...theme.fonts.bold },
    profileName: { fontSize: 22, ...theme.fonts.bold, color: theme.colors.textPrimary },
    profileEmail: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 },
    levelBadge: {
      marginTop: theme.spacing.sm,
      backgroundColor: theme.colors.primary + '20',
      paddingHorizontal: 14,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.round,
    },
    levelBadgeText: { fontSize: 13, color: theme.colors.primary, ...theme.fonts.semiBold },
    card: {
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      shadowColor: theme.colors.cardShadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 18, ...theme.fonts.bold, color: theme.colors.textPrimary,
      marginBottom: theme.spacing.lg,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    infoRowLast: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm + 2,
    },
    infoLabel: { fontSize: 15, color: theme.colors.textSecondary },
    infoValue: { fontSize: 15, ...theme.fonts.semiBold, color: theme.colors.textPrimary },
    inputLabel: {
      fontSize: 13, color: theme.colors.textMuted, ...theme.fonts.semiBold,
      marginBottom: 6, marginTop: theme.spacing.md,
    },
    input: {
      backgroundColor: theme.colors.bgPrimary,
      borderRadius: theme.borderRadius.md,
      padding: 14,
      fontSize: 16,
      color: theme.colors.textPrimary,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    levelOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginBottom: 6,
      borderWidth: 1.5,
      borderColor: 'transparent',
      backgroundColor: theme.colors.bgPrimary,
    },
    levelOptionSelected: { borderColor: theme.colors.primary },
    levelOptionInfo: { flex: 1 },
    levelOptionLabel: { fontSize: 15, ...theme.fonts.semiBold, color: theme.colors.textPrimary },
    levelOptionLabelSelected: { color: theme.colors.primary },
    levelOptionDesc: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
    editActions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
    },
    cancelBtn: {
      flex: 1,
      padding: 14,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
    },
    cancelBtnText: { fontSize: 16, ...theme.fonts.bold, color: theme.colors.textSecondary },
    saveBtn: {
      flex: 1,
      padding: 14,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { fontSize: 16, ...theme.fonts.bold, color: '#fff' },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 14,
      borderRadius: theme.borderRadius.md,
      backgroundColor: theme.colors.bgCard,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.primary + '40',
    },
    editBtnText: { fontSize: 16, ...theme.fonts.semiBold, color: theme.colors.primary },
    logoutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: 14,
      borderRadius: theme.borderRadius.md,
      backgroundColor: 'rgba(231,76,60,0.08)',
      marginTop: theme.spacing.md,
    },
    logoutText: { fontSize: 16, ...theme.fonts.bold, color: theme.colors.danger },
  });
