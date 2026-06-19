import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors, useTheme } from '../../theme';

interface BrakePadTabProps { obdConnected: boolean }

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

const BrakePadTab: React.FC<BrakePadTabProps> = ({ obdConnected }) => {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>◔</Text>
        </View>
        <Text style={styles.title}>Brake wear not available</Text>
        <Text style={styles.subtitle}>
          {obdConnected
            ? 'Most vehicles do not report brake-pad wear over OBD-II. There is no standard PID for pad thickness or remaining life.'
            : 'Connect to OBD to read available diagnostics.'}
        </Text>
      </View>

      {obdConnected && (
        <View style={styles.note}>
          <Text style={styles.noteText}>
            Some newer cars expose a brake-wear sensor through manufacturer-specific protocols, but it is not part of the generic OBD-II standard this adapter uses. Check your dashboard for a brake-pad warning light.
          </Text>
        </View>
      )}
    </View>
  );
};

export default BrakePadTab;
