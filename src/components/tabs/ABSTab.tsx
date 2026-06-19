import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors, useTheme } from '../../theme';

interface ABSTabProps { obdConnected: boolean }

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  container: { gap: 14 },
  statusCard: { backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, paddingVertical: 28, paddingHorizontal: 22, alignItems: 'center', gap: 10 },
  iconCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: T.surface2, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 15, fontWeight: '700', letterSpacing: 0.5, color: T.muted },
  statusTitle: { fontSize: 17, fontWeight: '600', color: T.text, textAlign: 'center' },
  statusSub: { fontSize: 13, color: T.muted, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
  note: { backgroundColor: T.surface2, borderRadius: 14, borderWidth: 1, borderColor: T.border, paddingHorizontal: 14, paddingVertical: 12 },
  noteText: { fontSize: 12.5, color: T.muted, lineHeight: 18 },
});

const ABSTab: React.FC<ABSTabProps> = ({ obdConnected }) => {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>ABS</Text>
        </View>
        <Text style={styles.statusTitle}>{obdConnected ? 'ABS data not available' : 'Not connected'}</Text>
        <Text style={styles.statusSub}>
          {obdConnected
            ? 'ABS faults are stored as chassis (C) codes in a separate control module and are not reachable through generic OBD-II.'
            : 'Connect to OBD to read available diagnostics.'}
        </Text>
      </View>

      {obdConnected && (
        <View style={styles.note}>
          <Text style={styles.noteText}>
            If an ABS warning light is on in your dashboard, the fault lives in the ABS module. Reading it requires a manufacturer-specific scan tool or protocol, which the generic OBD-II Error Log scan (mode 03) cannot access.
          </Text>
        </View>
      )}
    </View>
  );
};

export default ABSTab;
