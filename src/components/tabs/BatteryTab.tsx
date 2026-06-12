import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { ThemeColors, useTheme } from '../../theme';

interface BatteryTabProps { obdConnected: boolean }

const RING_SIZE = 160;
const RING_STROKE = 14;

const BatteryRing: React.FC<{ pct: number; T: ThemeColors }> = ({ pct, T }) => {
  const size = RING_SIZE;
  const sw = RING_STROKE;
  const half = size / 2;
  const deg = (pct / 100) * (270 / 360) * 360;
  const rightRot = Math.min(deg, 180);
  const leftRot = deg > 180 ? deg - 180 : 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: size, height: size, transform: [{ rotate: '-135deg' }] }}>
        <View style={{ position: 'absolute', width: size, height: size, borderRadius: half, borderWidth: sw, borderColor: T.surface2 }} />
        <View style={{ position: 'absolute', right: 0, width: half, height: size, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', left: -half, width: size, height: size, borderRadius: half, borderWidth: sw, borderColor: 'transparent', borderRightColor: rightRot > 0 ? T.good : 'transparent', borderBottomColor: rightRot > 90 ? T.good : 'transparent', transform: [{ rotate: `${rightRot - 180}deg` }] }} />
        </View>
        {leftRot > 0 && (
          <View style={{ position: 'absolute', left: 0, width: half, height: size, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', left: 0, width: size, height: size, borderRadius: half, borderWidth: sw, borderColor: 'transparent', borderLeftColor: T.good, borderTopColor: leftRot > 90 ? T.good : 'transparent', transform: [{ rotate: `${leftRot}deg` }] }} />
          </View>
        )}
      </View>
      <View style={StyleSheet.absoluteFill}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: size * 0.08 }}>
          <Text style={{ color: T.text, fontSize: 40, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', lineHeight: 44 }}>{pct}%</Text>
          <Text style={{ color: T.good, fontSize: 13, fontWeight: '600', marginTop: 4 }}>Healthy</Text>
        </View>
      </View>
    </View>
  );
};

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  container: { gap: 14 },
  ringCard: { backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, paddingTop: 18, paddingBottom: 14, alignItems: 'center', gap: 4 },
  ringLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: T.muted },
  card: { backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 14, color: T.muted },
  rowValue: { fontSize: 15, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});

const BatteryTab: React.FC<BatteryTabProps> = ({ obdConnected }) => {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);
  const pct = obdConnected ? 87 : 0;
  const rows = [
    { label: 'Resting voltage',  value: obdConnected ? '12.6 V'          : '—', color: T.text },
    { label: 'Charging voltage', value: obdConnected ? '14.2 V'          : '—', color: T.good },
    { label: 'Cranking health',  value: obdConnected ? 'Strong'          : '—', color: T.good },
    { label: 'Last load test',   value: obdConnected ? 'Passed · 2d ago' : '—', color: T.text },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.ringCard}>
        <BatteryRing pct={pct} T={T} />
        <Text style={styles.ringLabel}>State of charge</Text>
      </View>
      <View style={styles.card}>
        {rows.map(({ label, value, color }, idx) => (
          <View key={label} style={[styles.row, idx === rows.length - 1 && styles.rowLast]}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={[styles.rowValue, { color }]}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default BatteryTab;
