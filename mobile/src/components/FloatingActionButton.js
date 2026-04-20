import React, { useState, useRef } from 'react';
import {
  View, TouchableOpacity, Text, StyleSheet, Animated, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function FloatingActionButton({ mode, onModeChange, onPress, isActive }) {
  const { theme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const longPressTimer = useRef(null);
  const s = createStyles(theme);

  const openMenu = () => {
    setShowMenu(true);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 12,
    }).start();
  };

  const closeMenu = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => setShowMenu(false));
  };

  const selectMode = (m) => {
    onModeChange(m);
    closeMenu();
  };

  const icon = mode === 'listen' ? 'volume-high' : 'mic';
  const activeColor = isActive
    ? (mode === 'recite' ? theme.colors.danger : theme.colors.primary)
    : theme.colors.primary;

  return (
    <View style={s.wrapper} pointerEvents="box-none">
      {showMenu && (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
          <Animated.View
            style={[
              s.menu,
              {
                transform: [{ scale: scaleAnim }],
                opacity: scaleAnim,
              },
            ]}
          >
            <TouchableOpacity
              style={[s.menuItem, mode === 'listen' && s.menuItemActive]}
              onPress={() => selectMode('listen')}
            >
              <Ionicons name="volume-high" size={18} color={mode === 'listen' ? '#fff' : theme.colors.textPrimary} />
              <Text style={[s.menuLabel, mode === 'listen' && s.menuLabelActive]}>Listen</Text>
            </TouchableOpacity>
            <View style={s.menuDivider} />
            <TouchableOpacity
              style={[s.menuItem, mode === 'recite' && s.menuItemActive]}
              onPress={() => selectMode('recite')}
            >
              <Ionicons name="mic" size={18} color={mode === 'recite' ? '#fff' : theme.colors.textPrimary} />
              <Text style={[s.menuLabel, mode === 'recite' && s.menuLabelActive]}>Recite</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
      <TouchableOpacity
        style={[s.fab, { backgroundColor: activeColor }]}
        onPress={onPress}
        onLongPress={openMenu}
        delayLongPress={400}
        activeOpacity={0.8}
      >
        <Ionicons name={isActive && mode === 'recite' ? 'stop' : icon} size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      bottom: 24,
      right: 20,
      alignItems: 'flex-end',
    },
    fab: {
      width: 58,
      height: 58,
      borderRadius: 29,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 8,
    },
    menu: {
      backgroundColor: theme.colors.bgCard,
      borderRadius: theme.borderRadius.md,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
      overflow: 'hidden',
      minWidth: 140,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      gap: 10,
    },
    menuItemActive: {
      backgroundColor: theme.colors.primary,
    },
    menuLabel: {
      fontSize: 15,
      ...theme.fonts.semiBold,
      color: theme.colors.textPrimary,
    },
    menuLabelActive: {
      color: '#fff',
    },
    menuDivider: {
      height: 1,
      backgroundColor: theme.colors.borderLight,
    },
  });
