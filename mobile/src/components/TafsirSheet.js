import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, ActivityIndicator, Dimensions, useWindowDimensions,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

// In-memory cache for tafsir content
const tafsirCache = {};

export default function TafsirSheet({ visible, verseKey, onClose }) {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const s = createStyles(theme, isDark);

  const [tafsirList, setTafsirList] = useState([]);
  const [selectedTafsir, setSelectedTafsir] = useState(169); // Ibn Kathir default
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [fontSize, setFontSize] = useState(15);

  // Load tafsir sources once
  useEffect(() => {
    api.getTafsirList('en')
      .then((res) => {
        const all = res.data.tafsirs || [];
        // Put English tafsirs first, then Arabic
        const en = all.filter((t) => t.language_name === 'english');
        const ar = all.filter((t) => t.language_name === 'arabic');
        setTafsirList([...en, ...ar]);
      })
      .catch(() => {});
  }, []);

  // Fetch tafsir content when verse or source changes
  useEffect(() => {
    if (!visible || !verseKey) return;
    const cacheKey = `${selectedTafsir}:${verseKey}`;
    if (tafsirCache[cacheKey]) {
      setContent(tafsirCache[cacheKey]);
      return;
    }
    setLoading(true);
    setContent(null);
    api.getTafsirContent(selectedTafsir, verseKey)
      .then((res) => {
        const data = res.data.tafsir;
        tafsirCache[cacheKey] = data;
        setContent(data);
      })
      .catch((err) => {
        console.log('Tafsir load error:', err.message);
        setContent({ text: '<p>Unable to load tafsir for this verse.</p>', resource_name: 'Error' });
      })
      .finally(() => setLoading(false));
  }, [visible, verseKey, selectedTafsir]);

  const selectedName = tafsirList.find((t) => t.id === selectedTafsir)?.translated_name?.name
    || content?.resource_name
    || 'Ibn Kathir';

  // Custom HTML tag styles
  const tagsStyles = {
    body: { color: theme.colors.textPrimary, fontSize, lineHeight: fontSize * 1.7 },
    p: { marginBottom: 10 },
    h1: { fontSize: fontSize + 6, color: theme.colors.primary, ...theme.fonts.bold, marginBottom: 8 },
    h2: { fontSize: fontSize + 4, color: theme.colors.primary, ...theme.fonts.bold, marginBottom: 6 },
    h3: { fontSize: fontSize + 2, color: theme.colors.textSecondary, ...theme.fonts.semiBold, marginBottom: 4 },
    a: { color: theme.colors.primary },
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>Tafsir</Text>
            <Text style={s.headerVerse}>{verseKey}</Text>
          </View>

          <View style={s.headerRight}>
            {/* Font size controls */}
            <TouchableOpacity onPress={() => setFontSize((f) => Math.max(12, f - 1))} style={s.sizeBtn}>
              <Ionicons name="remove" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFontSize((f) => Math.min(24, f + 1))} style={s.sizeBtn}>
              <Ionicons name="add" size={16} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tafsir source selector */}
        <TouchableOpacity style={s.sourceBar} onPress={() => setShowPicker(true)}>
          <Ionicons name="book-outline" size={16} color={theme.colors.primary} />
          <Text style={s.sourceName} numberOfLines={1}>{selectedName}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>

        {/* Content */}
        {loading ? (
          <View style={s.centered}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : content?.text ? (
          <ScrollView
            style={s.scrollView}
            contentContainerStyle={s.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <RenderHtml
              contentWidth={width - 40}
              source={{ html: content.text }}
              tagsStyles={tagsStyles}
              defaultTextProps={{ selectable: true }}
              enableExperimentalMarginCollapsing
            />
          </ScrollView>
        ) : (
          <View style={s.centered}>
            <Text style={s.emptyText}>Select a verse to view tafsir</Text>
          </View>
        )}

        {/* Tafsir source picker */}
        <Modal
          visible={showPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={s.pickerOverlay}>
            <View style={s.pickerCard}>
              <View style={s.pickerHeader}>
                <Text style={s.pickerTitle}>Select Tafsir Source</Text>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={s.pickerList}>
                {tafsirList.map((t) => {
                  const isActive = t.id === selectedTafsir;
                  const name = t.translated_name?.name || t.name;
                  const lang = t.language_name || '';
                  return (
                    <TouchableOpacity
                      key={t.id}
                      style={[s.pickerItem, isActive && s.pickerItemActive]}
                      onPress={() => {
                        setSelectedTafsir(t.id);
                        setShowPicker(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[s.pickerItemName, isActive && s.pickerItemNameActive]}>
                          {name}
                        </Text>
                        <Text style={s.pickerItemLang}>{lang}</Text>
                      </View>
                      {isActive && (
                        <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const createStyles = (theme, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.bgPrimary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 17,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
    },
    headerVerse: {
      fontSize: 13,
      color: theme.colors.textMuted,
      marginTop: 1,
    },
    headerRight: {
      flexDirection: 'row',
      gap: 2,
    },
    sizeBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.colors.bgCard,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sourceBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginHorizontal: 16,
      marginVertical: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: theme.colors.bgCard,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.borderLight,
    },
    sourceName: {
      flex: 1,
      fontSize: 14,
      ...theme.fonts.semiBold,
      color: theme.colors.textPrimary,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 60,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: 15,
      color: theme.colors.textMuted,
    },

    /* ── Source picker ── */
    pickerOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    pickerCard: {
      backgroundColor: theme.colors.bgPrimary,
      borderRadius: 16,
      maxHeight: Dimensions.get('window').height * 0.6,
      overflow: 'hidden',
    },
    pickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    pickerTitle: {
      fontSize: 16,
      ...theme.fonts.bold,
      color: theme.colors.textPrimary,
    },
    pickerList: {
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    pickerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginBottom: 2,
    },
    pickerItemActive: {
      backgroundColor: theme.colors.primary + '14',
    },
    pickerItemName: {
      fontSize: 15,
      ...theme.fonts.semiBold,
      color: theme.colors.textPrimary,
    },
    pickerItemNameActive: {
      color: theme.colors.primary,
    },
    pickerItemLang: {
      fontSize: 12,
      color: theme.colors.textMuted,
      marginTop: 1,
      textTransform: 'capitalize',
    },
  });
