import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeColors, useTheme } from '../theme';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English',  flag: '🇬🇧' },
  { code: 'ru', name: 'Русский',  flag: '🇷🇺' },
  { code: 'hy', name: 'Հայերեն', flag: '🇦🇲' },
];

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  card: { backgroundColor: T.surface, borderRadius: 24, padding: 24, width: '100%', maxWidth: 340, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 24, elevation: 8 },
  title: { fontSize: 22, fontWeight: '800', color: T.text, marginBottom: 20, textAlign: 'center' },
  langBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surface2, borderRadius: 14, padding: 16, marginBottom: 12 },
  langBtnActive: { backgroundColor: T.accent },
  flag: { fontSize: 24, marginRight: 12 },
  langName: { flex: 1, fontSize: 17, fontWeight: '600', color: T.text },
  langNameActive: { color: T.onAccent },
  checkmark: { fontSize: 20, color: T.onAccent, fontWeight: '700' },
  closeBtn: { backgroundColor: T.surface2, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  closeBtnText: { color: T.text, fontSize: 17, fontWeight: '700' },
});

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ visible, onClose }) => {
  const { i18n } = useTranslation();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Select Language</Text>

          {LANGUAGES.map(lang => {
            const active = i18n.language === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langBtn, active && styles.langBtnActive]}
                onPress={() => handleLanguageChange(lang.code)}
                activeOpacity={0.7}>
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text style={[styles.langName, active && styles.langNameActive]}>{lang.name}</Text>
                {active && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default LanguageSelector;
