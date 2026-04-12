import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, ScrollView, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

const READING_LAYOUTS = [
  { key: 'book', label: 'Book', desc: 'Madani Mushaf', icon: 'book-outline' },
  { key: 'quran', label: 'Quran Text', desc: 'Resizable Quran Text', icon: 'document-text-outline' },
  { key: 'translation', label: 'Translation', desc: 'With English Translation', icon: 'language-outline' },
];

const TRANSLATION_SOURCES = [
  { key: 'en.sahih', label: 'Sahih International' },
  { key: 'en.khattab', label: 'Bridges Translation (Fadel Soliman)' },
  { key: 'en.yusufali', label: 'Yusuf Ali' },
  { key: 'en.pickthall', label: 'Pickthall' },
  { key: 'en.asad', label: 'Mufti Taqi Usmani' },
  { key: 'en.hilali', label: 'Al-Hilali & Khan' },
];

export default function MushafSettingsSheet({ visible, onClose }) {
  const { theme } = useTheme();
  const {
    mushafLayout,
    showArabicVerse,
    tajweedEnabled,
    arabicFontSize,
    showTransliteration,
    showWordByWord,
    showTranslation,
    translationSource,
    wordHighlightEnabled,
    updateSettings,
  } = useSettings();

  const s = createStyles(theme);

  const adjustFontSize = (delta) => {
    const next = Math.max(18, Math.min(44, arabicFontSize + delta));
    updateSettings({ arabicFontSize: next });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={s.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={s.sheet}>
          {/* Header */}
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>Mushaf Layout</Text>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Ionicons name="close" size={22} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Reading Layout */}
            <Text style={s.sectionLabel}>READING LAYOUT</Text>
            <Text style={s.sectionDesc}>Select how you wish to read the Quran.</Text>

            {READING_LAYOUTS.map((layout) => {
              const isSelected = mushafLayout === layout.key;
              return (
                <TouchableOpacity
                  key={layout.key}
                  style={[s.layoutOption, isSelected && s.layoutOptionSelected]}
                  onPress={() => updateSettings({ mushafLayout: layout.key })}
                >
                  <Ionicons
                    name={layout.icon}
                    size={22}
                    color={isSelected ? theme.colors.primary : theme.colors.textMuted}
                    style={s.layoutIcon}
                  />
                  <View style={s.layoutInfo}>
                    <Text style={[s.layoutLabel, isSelected && s.layoutLabelSelected]}>
                      {layout.label}
                    </Text>
                    <Text style={s.layoutDesc}>{layout.desc}</Text>
                  </View>
                  <View style={[s.radio, isSelected && s.radioSelected]}>
                    {isSelected && <View style={s.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Arabic Verse */}
            <Text style={[s.sectionLabel, { marginTop: 20 }]}>Arabic Verse</Text>

            <View style={s.settingCard}>
              <View style={s.switchRow}>
                <Text style={s.switchLabel}>Arabic Verse</Text>
                <Switch
                  value={showArabicVerse}
                  onValueChange={(val) => updateSettings({ showArabicVerse: val })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              {showArabicVerse && (
                <View style={s.fontSizeRow}>
                  <Text style={s.fontSizeLabel}>Font Size — Quranic Arabic</Text>
                  <View style={s.fontSizeControls}>
                    <Text style={[s.fontPreview, { fontSize: 16 }]}>الله</Text>
                    <TouchableOpacity onPress={() => adjustFontSize(-2)} style={s.fontBtn}>
                      <Ionicons name="remove" size={18} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={s.fontSizeBar}>
                      <View
                        style={[
                          s.fontSizeFill,
                          { width: `${((arabicFontSize - 18) / 26) * 100}%` },
                        ]}
                      />
                      <View
                        style={[
                          s.fontSizeThumb,
                          { left: `${((arabicFontSize - 18) / 26) * 100}%` },
                        ]}
                      />
                    </View>
                    <TouchableOpacity onPress={() => adjustFontSize(2)} style={s.fontBtn}>
                      <Ionicons name="add" size={18} color={theme.colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[s.fontPreview, { fontSize: 24 }]}>الله</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Tajweed */}
            <View style={s.settingCard}>
              <View style={s.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.switchLabel}>Tajweed Coloring</Text>
                  <Text style={s.switchDesc}>Color-coded tajweed rules</Text>
                </View>
                <Switch
                  value={tajweedEnabled}
                  onValueChange={(val) => updateSettings({ tajweedEnabled: val })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Word-by-Word */}
            <Text style={[s.sectionLabel, { marginTop: 20 }]}>Word-by-Word</Text>
            <View style={s.settingCard}>
              <View style={s.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.switchLabel}>Word-by-Word Translation</Text>
                  <Text style={s.switchDesc}>English meaning under each word</Text>
                </View>
                <Switch
                  value={showWordByWord}
                  onValueChange={(val) => updateSettings({ showWordByWord: val })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <View style={s.settingCard}>
              <View style={s.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.switchLabel}>Transliteration</Text>
                  <Text style={s.switchDesc}>Romanized pronunciation guide</Text>
                </View>
                <Switch
                  value={showTransliteration}
                  onValueChange={(val) => updateSettings({ showTransliteration: val })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Audio */}
            <Text style={[s.sectionLabel, { marginTop: 20 }]}>Audio</Text>
            <View style={s.settingCard}>
              <View style={s.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.switchLabel}>Word Highlighting</Text>
                  <Text style={s.switchDesc}>Highlight each word as it is recited</Text>
                </View>
                <Switch
                  value={wordHighlightEnabled}
                  onValueChange={(val) => updateSettings({ wordHighlightEnabled: val })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Translation */}
            <Text style={[s.sectionLabel, { marginTop: 20 }]}>Translation</Text>
            <View style={s.settingCard}>
              <View style={s.switchRow}>
                <Text style={s.switchLabel}>Show Translation</Text>
                <Switch
                  value={showTranslation}
                  onValueChange={(val) => updateSettings({ showTranslation: val })}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              {showTranslation && (
                <View style={s.translationList}>
                  {TRANSLATION_SOURCES.map((t) => {
                    const isSelected = translationSource === t.key;
                    return (
                      <TouchableOpacity
                        key={t.key}
                        style={[s.translationOption, isSelected && s.translationOptionSelected]}
                        onPress={() => updateSettings({ translationSource: t.key })}
                      >
                        <Text
                          style={[
                            s.translationOptionText,
                            isSelected && s.translationOptionTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {t.label}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={18} color={theme.colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const createStyles = (theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: theme.colors.bgCard,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '75%',
      padding: 20,
      paddingBottom: 0,
    },
    sheetHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sheetTitle: {
      fontSize: 20,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
    },
    closeBtn: { padding: 4 },
    sectionLabel: {
      fontSize: 12,
      ...theme.fonts.bold,
      color: theme.colors.textMuted,
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    sectionDesc: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginBottom: 12,
    },
    layoutOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: 'transparent',
      backgroundColor: theme.colors.bgPrimary,
      marginBottom: 8,
    },
    layoutOptionSelected: {
      borderColor: theme.colors.primary,
    },
    layoutIcon: { marginRight: 12 },
    layoutInfo: { flex: 1 },
    layoutLabel: {
      fontSize: 15,
      ...theme.fonts.semiBold,
      color: theme.colors.textPrimary,
    },
    layoutLabelSelected: { color: theme.colors.primary },
    layoutDesc: { fontSize: 12, color: theme.colors.textMuted, marginTop: 1 },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioSelected: { borderColor: theme.colors.primary },
    radioDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
    },
    settingCard: {
      backgroundColor: theme.colors.bgPrimary,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    switchLabel: {
      fontSize: 15,
      ...theme.fonts.semiBold,
      color: theme.colors.textPrimary,
    },
    switchDesc: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 2,
    },
    fontSizeRow: {
      marginTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderLight,
      paddingTop: 14,
    },
    fontSizeLabel: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 10,
    },
    fontSizeControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    fontPreview: {
      color: theme.colors.textPrimary,
      ...theme.fonts.bold,
    },
    fontBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.colors.bgCard,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fontSizeBar: {
      flex: 1,
      height: 4,
      backgroundColor: theme.colors.border,
      borderRadius: 2,
      position: 'relative',
    },
    fontSizeFill: {
      position: 'absolute',
      left: 0,
      top: 0,
      height: 4,
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
    },
    fontSizeThumb: {
      position: 'absolute',
      top: -8,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: '#fff',
      marginLeft: -10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 3,
    },
    translationList: { marginTop: 12 },
    translationOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 4,
    },
    translationOptionSelected: {
      backgroundColor: theme.colors.bgCard,
    },
    translationOptionText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    translationOptionTextSelected: {
      color: theme.colors.primary,
      ...theme.fonts.semiBold,
    },
  });
