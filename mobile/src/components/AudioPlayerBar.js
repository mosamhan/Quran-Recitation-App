import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, PanResponder, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

// FAB dimensions — must match styles
const FAB_SIZE = 48;
const MENU_ITEM_SIZE = 48;
const MENU_GAP = 14;
// Vertical distance from FAB center to each menu item center
const LISTEN_OFFSET_Y = -(MENU_ITEM_SIZE + MENU_GAP);         // first item above
const RECITE_OFFSET_Y = -(MENU_ITEM_SIZE + MENU_GAP) * 2;     // second item above

export default function AudioPlayerBar({
  versePlaying,
  totalVerses,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  onClose,
  onStartPlay,
  reciterName,
  mode,
  onRecite,
  isReciting,
  playbackSpeed = 1,
  onSpeedChange,
  onOpenSettings,
  onOpenReciterPicker,
  onSetMode,
}) {
  const { theme } = useTheme();
  const s = createStyles(theme);
  const [showModeMenu, setShowModeMenu] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null); // 'listen' | 'recite' | null

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const listenAnim = useRef(new Animated.Value(0)).current;
  const reciteAnim = useRef(new Animated.Value(0)).current;

  // Track FAB position for gesture hit-testing
  const fabRef = useRef(null);
  const fabLayout = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const openMenu = useCallback(() => {
    setShowModeMenu(true);
    setHoveredItem(null);
    fadeAnim.setValue(0);
    listenAnim.setValue(0);
    reciteAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.stagger(50, [
        Animated.spring(listenAnim, { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }),
        Animated.spring(reciteAnim, { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  const closeMenu = useCallback((selectedMode) => {
    if (selectedMode && onSetMode) onSetMode(selectedMode);
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setShowModeMenu(false);
      setHoveredItem(null);
    });
  }, [onSetMode]);

  // Determine which menu item a touch point is over
  const getHitItem = useCallback((pageX, pageY) => {
    const fab = fabLayout.current;
    const fabCenterX = fab.x + fab.width / 2;
    const fabCenterY = fab.y + fab.height / 2;

    // Check Listen item (first above FAB)
    const listenCenterY = fabCenterY + LISTEN_OFFSET_Y;
    const distListen = Math.sqrt(
      Math.pow(pageX - fabCenterX, 2) + Math.pow(pageY - listenCenterY, 2)
    );
    if (distListen < MENU_ITEM_SIZE * 0.8) return 'listen';

    // Check Recite item (second above FAB)
    const reciteCenterY = fabCenterY + RECITE_OFFSET_Y;
    const distRecite = Math.sqrt(
      Math.pow(pageX - fabCenterX, 2) + Math.pow(pageY - reciteCenterY, 2)
    );
    if (distRecite < MENU_ITEM_SIZE * 0.8) return 'recite';

    return null;
  }, []);

  // PanResponder for slide-to-select gesture on the FAB
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        // Only capture if menu is open and finger has moved
        return showModeMenuRef.current && (Math.abs(gs.dy) > 5 || Math.abs(gs.dx) > 5);
      },
      onPanResponderMove: (evt) => {
        if (!showModeMenuRef.current) return;
        const { pageX, pageY } = evt.nativeEvent;
        const hit = getHitItem(pageX, pageY);
        setHoveredItem(hit);
      },
      onPanResponderRelease: (evt) => {
        if (!showModeMenuRef.current) return;
        const { pageX, pageY } = evt.nativeEvent;
        const hit = getHitItem(pageX, pageY);
        if (hit) {
          closeMenu(hit);
        }
        // If released on nothing, menu stays open (user can tap)
        setHoveredItem(null);
      },
    })
  ).current;

  // Keep a ref of showModeMenu for the pan responder
  const showModeMenuRef = useRef(false);
  useEffect(() => { showModeMenuRef.current = showModeMenu; }, [showModeMenu]);

  // Measure FAB position after layout
  const measureFab = useCallback(() => {
    if (fabRef.current) {
      fabRef.current.measureInWindow((x, y, width, height) => {
        fabLayout.current = { x, y, width, height };
      });
    }
  }, []);

  const cycleSpeed = () => {
    if (!onSpeedChange) return;
    const idx = SPEEDS.indexOf(playbackSpeed);
    const next = SPEEDS[(idx + 1) % SPEEDS.length];
    onSpeedChange(next);
  };

  const handlePlayPress = () => {
    if (mode === 'recite') {
      if (onRecite) onRecite();
      return;
    }
    if (versePlaying) {
      onPlayPause();
    } else if (onStartPlay) {
      onStartPlay();
    }
  };

  const audioActive = !!versePlaying;

  const fabColor = mode === 'recite'
    ? (isReciting ? theme.colors.danger : theme.colors.primary)
    : theme.colors.primary;

  const fabIcon = mode === 'recite'
    ? (isReciting ? 'stop' : 'mic')
    : (isPlaying ? 'pause' : 'play');

  const makeItemStyle = (anim, offsetY) => ({
    opacity: anim,
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-offsetY * 0.3, 0] }) },
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
    ],
  });

  return (
    <View style={s.wrapper} {...panResponder.panHandlers}>
      {/* Floating mode menu — items centered above FAB */}
      {showModeMenu && (
        <>
          {/* Backdrop — tap to dismiss */}
          <Animated.View style={[s.menuBackdrop, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => closeMenu(null)}
            />
          </Animated.View>

          {/* Menu items positioned above the FAB */}
          <View style={s.menuAnchor} pointerEvents="box-none">
            {/* Listen — first item above FAB */}
            <Animated.View style={[s.menuItem, makeItemStyle(listenAnim, LISTEN_OFFSET_Y)]}>
              <Text style={[
                s.menuLabel,
                (hoveredItem === 'listen' || mode === 'listen') && s.menuLabelActive,
              ]}>Listen</Text>
              <TouchableOpacity
                style={[
                  s.menuFab,
                  (hoveredItem === 'listen' || mode === 'listen') && { backgroundColor: theme.colors.primary },
                  hoveredItem === 'listen' && s.menuFabHovered,
                ]}
                onPress={() => closeMenu('listen')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="play"
                  size={20}
                  color={(hoveredItem === 'listen' || mode === 'listen') ? '#fff' : theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </Animated.View>

            {/* Recite — second item above FAB */}
            <Animated.View style={[s.menuItem, makeItemStyle(reciteAnim, RECITE_OFFSET_Y)]}>
              <Text style={[
                s.menuLabel,
                (hoveredItem === 'recite' || mode === 'recite') && s.menuLabelActive,
              ]}>Recite</Text>
              <TouchableOpacity
                style={[
                  s.menuFab,
                  (hoveredItem === 'recite' || mode === 'recite') && { backgroundColor: theme.colors.primary },
                  hoveredItem === 'recite' && s.menuFabHovered,
                ]}
                onPress={() => closeMenu('recite')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="mic"
                  size={20}
                  color={(hoveredItem === 'recite' || mode === 'recite') ? '#fff' : theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </>
      )}

      <View style={s.bar}>
        {audioActive ? (
          /* ── Playing state: transport controls ── */
          <View style={s.controlsRow}>
            <TouchableOpacity onPress={onPrevious} style={s.controlBtn} disabled={versePlaying <= 1}>
              <Ionicons
                name="play-skip-back"
                size={18}
                color={versePlaying <= 1 ? theme.colors.textMuted : theme.colors.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={onNext} style={s.controlBtn} disabled={versePlaying >= totalVerses}>
              <Ionicons
                name="play-skip-forward"
                size={18}
                color={versePlaying >= totalVerses ? theme.colors.textMuted : theme.colors.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={cycleSpeed} style={s.speedBtn}>
              <Text style={s.speedLabel}>{playbackSpeed}x</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={s.controlBtn}>
              <Ionicons name="stop" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={s.reciterInfo}>
              <View style={s.playingDots}>
                <View style={[s.dot, isPlaying && s.dotActive]} />
                <View style={[s.dot, s.dotMid, isPlaying && s.dotActive]} />
                <View style={[s.dot, isPlaying && s.dotActive]} />
              </View>
              <Text style={s.reciterName} numberOfLines={1}>
                {reciterName || 'Reciter'}
              </Text>
            </View>
          </View>
        ) : (
          /* ── Idle state: settings + reciter ── */
          <View style={s.controlsRow}>
            <TouchableOpacity onPress={onOpenSettings} style={s.controlBtn}>
              <Ionicons name="options-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity onPress={onOpenReciterPicker} style={s.controlBtn}>
              <Ionicons name="musical-notes-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <View style={s.reciterInfo}>
              <Text style={s.readyLabel}>
                {mode === 'recite' ? 'Tap to recite' : 'Tap to play'}
              </Text>
            </View>
          </View>
        )}

        {/* Play/pause FAB — long press opens mode menu */}
        <TouchableOpacity
          ref={fabRef}
          style={[s.playBtn, { backgroundColor: fabColor }]}
          onPress={handlePlayPress}
          onLongPress={() => { measureFab(); openMenu(); }}
          delayLongPress={350}
          activeOpacity={0.8}
          onLayout={measureFab}
        >
          <Ionicons name={fabIcon} size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    wrapper: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.bgCard,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
      paddingLeft: 4,
      paddingRight: 6,
      height: 60,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 5,
    },
    controlsRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    controlBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
    },
    speedBtn: {
      width: 36,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
    },
    speedLabel: {
      fontSize: 13,
      ...theme.fonts.bold,
      color: theme.colors.textSecondary,
    },
    reciterInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: 6,
      gap: 6,
    },
    playingDots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    dot: {
      width: 3,
      height: 8,
      borderRadius: 1.5,
      backgroundColor: theme.colors.textMuted,
    },
    dotMid: { height: 12 },
    dotActive: { backgroundColor: theme.colors.primary },
    reciterName: {
      fontSize: 12,
      ...theme.fonts.semiBold,
      color: theme.colors.textSecondary,
      flexShrink: 1,
    },
    readyLabel: {
      fontSize: 13,
      color: theme.colors.textMuted,
    },
    playBtn: {
      width: FAB_SIZE,
      height: FAB_SIZE,
      borderRadius: FAB_SIZE / 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },

    /* ── Floating mode menu ── */
    menuBackdrop: {
      position: 'absolute',
      top: -Dimensions.get('window').height,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    // Anchor container — positions menu items directly above the FAB
    menuAnchor: {
      position: 'absolute',
      bottom: 60 + 10, // bar height + gap
      right: 6 + (FAB_SIZE - MENU_ITEM_SIZE) / 2, // align center with FAB
      alignItems: 'center',
      gap: MENU_GAP,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    menuLabel: {
      fontSize: 15,
      ...theme.fonts.semiBold,
      color: 'rgba(255,255,255,0.85)',
      textShadowColor: 'rgba(0,0,0,0.7)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 4,
    },
    menuLabelActive: {
      color: '#fff',
    },
    menuFab: {
      width: MENU_ITEM_SIZE,
      height: MENU_ITEM_SIZE,
      borderRadius: MENU_ITEM_SIZE / 2,
      backgroundColor: theme.colors.bgCard,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 6,
    },
    menuFabHovered: {
      transform: [{ scale: 1.12 }],
    },
  });
