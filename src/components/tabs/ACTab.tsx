import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors, useTheme } from '../../theme';

interface ACTabProps { obdConnected: boolean }

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  container: { gap: 14 },
  card: { backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, paddingVertical: 28, paddingHorizontal: 22, alignItems: 'center', gap: 10 },
  iconCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: T.surface2, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 26, color: T.muted },
  title: { fontSize: 17, fontWeight: '600', color: T.text, textAlign: 'center' },
  subtitle: { fontSize: 13, color: T.muted, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
  note: { backgroundColor: T.surface2, borderRadius: 14, borderWidth: 1, borderColor: T.border, paddingHorizontal: 14, paddingVertical: 12 },
  noteText: { fontSize: 12.5, color: T.muted, lineHeight: 18 },
});

const ACTab: React.FC<ACTabProps> = ({ obdConnected }) => {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>❄</Text>
        </View>
        <Text style={styles.title}>Climate data not available</Text>
        <Text style={styles.subtitle}>
          {obdConnected
            ? 'A/C and climate values (vent temperature, fan, compressor) are controlled by a separate module and are not exposed over standard OBD-II.'
            : 'Connect to OBD to read available diagnostics.'}
        </Text>
      </View>

      {obdConnected && (
        <View style={styles.note}>
          <Text style={styles.noteText}>
            Reading climate data requires manufacturer-specific protocols that vary by make and aren't part of the generic OBD-II standard this adapter uses.
          </Text>
        </View>
      )}
    </View>
  );
};

export default ACTab;
