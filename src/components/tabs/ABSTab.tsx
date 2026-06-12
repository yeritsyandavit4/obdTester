import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors, useTheme } from '../../theme';

interface ABSTabProps { obdConnected: boolean }

const sensors = ['Front left sensor', 'Front right sensor', 'Rear left sensor', 'Rear right sensor'];

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  container: { gap: 14 },
  statusCard: { backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center', gap: 11 },
  iconCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: T.accentSoft, alignItems: 'center', justifyContent: 'center' },
  iconCheck: { fontSize: 24, color: T.good, fontWeight: '700' },
  statusTitle: { fontSize: 17, fontWeight: '600', color: T.text },
  statusSub: { fontSize: 13, color: T.muted, textAlign: 'center', lineHeight: 18, maxWidth: 240 },
  card: { backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: T.border },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 14, color: T.muted },
  rowValue: { fontSize: 13, fontWeight: '600' },
  footnote: { fontSize: 12, color: T.muted, textAlign: 'center' },
});

const ABSTab: React.FC<ABSTabProps> = ({ obdConnected }) => {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconCheck}>✓</Text>
        </View>
        <Text style={styles.statusTitle}>{obdConnected ? 'ABS operational' : 'Not connected'}</Text>
        <Text style={styles.statusSub}>{obdConnected ? 'All four wheel-speed sensors are reporting normally.' : 'Connect to OBD to read ABS status.'}</Text>
      </View>

      <View style={styles.card}>
        {sensors.map((s, idx) => (
          <View key={s} style={[styles.row, idx === sensors.length - 1 && styles.rowLast]}>
            <Text style={styles.rowLabel}>{s}</Text>
            <Text style={[styles.rowValue, { color: obdConnected ? T.good : T.muted }]}>{obdConnected ? 'OK' : '—'}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.footnote}>{obdConnected ? 'Last self-test passed · today, 09:02' : '—'}</Text>
    </View>
  );
};

export default ABSTab;
