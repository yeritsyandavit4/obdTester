import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { ThemeColors, useTheme } from '../../theme';

interface ACTabProps { obdConnected: boolean }

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  container: { gap: 14 },
  tempCard: { backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, padding: 20, alignItems: 'center', gap: 4 },
  tempLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: T.muted },
  tempValue: { fontSize: 48, fontWeight: '700', color: T.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', lineHeight: 54 },
  tempUnit: { fontSize: 20, color: T.muted },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: T.accent },
  statusText: { fontSize: 13, fontWeight: '600', color: T.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '47.5%', backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.border, paddingHorizontal: 14, paddingVertical: 12, gap: 4 },
  cardLabel: { fontSize: 10.5, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: T.muted },
  cardValue: { fontSize: 18, fontWeight: '600', color: T.text },
});

const ACTab: React.FC<ACTabProps> = ({ obdConnected }) => {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const stats = [
    { label: 'Mode',        value: obdConnected ? 'Auto'   : '—' },
    { label: 'Fan',         value: obdConnected ? '3 / 5'  : '—' },
    { label: 'Target',      value: obdConnected ? '18°C'   : '—' },
    { label: 'Refrigerant', value: obdConnected ? 'Normal' : '—', color: T.good },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.tempCard}>
        <Text style={styles.tempLabel}>Vent temperature</Text>
        <Text style={styles.tempValue}>
          {obdConnected ? '4' : '—'}
          <Text style={styles.tempUnit}>°C</Text>
        </Text>
        {obdConnected && (
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Cooling · compressor on</Text>
          </View>
        )}
      </View>

      <View style={styles.grid}>
        {stats.map(({ label, value, color }) => (
          <View key={label} style={styles.card}>
            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={[styles.cardValue, color ? { color } : undefined]}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default ACTab;
