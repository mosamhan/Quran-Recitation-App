import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ScrollView,
} from 'react-native';
import { useUser } from '../context/UserContext';
import { colors, spacing, borderRadius, fonts } from '../utils/theme';

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useUser();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.value}>{user?.username}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Display Name</Text>
            <Text style={styles.value}>{user?.display_name || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Age Group</Text>
            <Text style={styles.value}>{user?.age_group || '-'}</Text>
          </View>
          <View style={styles.rowLast}>
            <Text style={styles.label}>Experience</Text>
            <Text style={styles.value}>{user?.experience_level || '-'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgLight },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    fontSize: 28,
    ...fonts.extraBold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    ...fonts.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  label: { fontSize: 15, color: colors.textSecondary },
  value: { fontSize: 15, ...fonts.semiBold, color: colors.textPrimary },
  logoutButton: {
    backgroundColor: colors.danger,
    borderRadius: borderRadius.md,
    padding: 16,
    alignItems: 'center',
  },
  logoutText: { color: '#fff', fontSize: 17, ...fonts.bold },
});
