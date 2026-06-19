import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet, Platform } from 'react-native';
import { ThemeColors, useTheme } from '../../theme';

interface BatteryTabProps {
  obdConnected: boolean;
  obdVoltage: number | null;
}

const RING_SIZE = 160;
const RING_STROKE = 14;

// Voltage range mapped onto the ring's 0–100% fill.
const V_MIN = 11.0;
const V_MAX = 14.8;

interface VoltageStatus { label: string; color: (T: ThemeColors) => string }

const statusFor = (v: number | null): VoltageStatus => {
  if (v == null) return { label: 'Waiting for data…', color: T => T.muted };
  if (v < 11.8) return { label: 'Low', color: T => T.red };
  if (v < 12.4) return { label: 'Fair', color: T => T.amber };
  if (v <= 13.2) return { label: 'Good', color: T => T.good };
  return { label: 'Charging', color: T => T.good };
};

const BatteryRing: React.FC<{ pct: number; voltage: number | null; T: ThemeColors }> = ({ pct, voltage, T }) => {
  const size = RING_SIZE;
  const sw = RING_STROKE;
  const half = size / 2;

  // Animate the fill from 0 → pct whenever the target changes.
  const anim = useRef(new Animated.Value(0)).current;
  const [fill, setFill] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value }) => setFill(value));
    return () => anim.removeListener(id);
  }, [anim]);

  useEffect(() => {
    Animated.spring(anim, { toValue: pct, friction: 9, tension: 50, useNativeDriver: false }).start();
  }, [pct, anim]);

  const status = statusFor(voltage);
  const color = status.color(T);
  const deg = fill * 270;
  const rightRot = Math.min(deg, 180);
  const leftRot = deg > 180 ? deg - 180 : 0;

  return (
    <View style={styles2.ringBox}>
      <View style={[styles2.ringRotor, { width: size, height: size }]}>
        <View style={{ position: 'absolute', width: size, height: size, borderRadius: half, borderWidth: sw, borderColor: T.surface2 }} />
        <View style={{ position: 'absolute', right: 0, width: half, height: size, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', left: -half, width: size, height: size, borderRadius: half, borderWidth: sw, borderColor: 'transparent', borderRightColor: rightRot > 0 ? color : 'transparent', borderBottomColor: rightRot > 90 ? color : 'transparent', transform: [{ rotate: `${rightRot - 180}deg` }] }} />
        </View>
        {leftRot > 0 && (
          <View style={{ position: 'absolute', left: 0, width: half, height: size, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', left: 0, width: size, height: size, borderRadius: half, borderWidth: sw, borderColor: 'transparent', borderLeftColor: color, borderTopColor: leftRot > 90 ? color : 'transparent', transform: [{ rotate: `${leftRot}deg` }] }} />
          </View>
        )}
      </View>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles2.ringCenter}>
          <Text style={[styles2.ringValue, { color: T.text }]}>
            {voltage != null ? voltage.toFixed(1) : '—'}
            <Text style={[styles2.ringUnit, { color: T.muted }]}>{voltage != null ? ' V' : ''}</Text>
          </Text>
          <Text style={[styles2.ringStatus, { color }]}>{status.label}</Text>
        </View>
      </View>
    </View>
  );
};

const styles2 = StyleSheet.create({
  ringBox: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  ringRotor: { transform: [{ rotate: '-135deg' }] },
  ringCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: RING_SIZE * 0.06 },
  ringValue: { fontSize: 38, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', lineHeight: 44 },
  ringUnit: { fontSize: 18 },
  ringStatus: { fontSize: 13, fontWeight: '600', marginTop: 4 },
});

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  container: { gap: 14 },
  ringCard: { backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, paddingTop: 18, paddingBottom: 14, alignItems: 'center', gap: 4 },
  ringLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: T.muted },
  card: { backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: 14, color: T.muted },
  rowValue: { fontSize: 15, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  note: { backgroundColor: T.surface2, borderRadius: 14, borderWidth: 1, borderColor: T.border, paddingHorizontal: 14, paddingVertical: 12 },
  noteText: { fontSize: 12.5, color: T.muted, lineHeight: 18 },
});

const BatteryTab: React.FC<BatteryTabProps> = ({ obdConnected, obdVoltage }) => {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const v = obdConnected ? obdVoltage : null;
  const pct = v != null ? Math.min(Math.max((v - V_MIN) / (V_MAX - V_MIN), 0), 1) : 0;
  const charging = v != null && v > 13.2;

  const rows = [
    { label: 'Module voltage', value: v != null ? `${v.toFixed(1)} V` : '—', color: T.text },
    { label: 'State',          value: v == null ? '—' : charging ? 'Charging (engine on)' : 'At rest', color: charging ? T.good : T.text },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.ringCard}>
        <BatteryRing pct={pct} voltage={v} T={T} />
        <Text style={styles.ringLabel}>System voltage</Text>
      </View>

      <View style={styles.card}>
        {rows.map(({ label, value, color }, idx) => (
          <View key={label} style={[styles.row, idx === rows.length - 1 && styles.rowLast]}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={[styles.rowValue, { color }]}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          {obdConnected
            ? 'This is the control-module supply voltage read over OBD-II — a good indicator of charging-system health. A full battery state-of-charge / load test needs a dedicated battery tester.'
            : 'Connect to OBD to read system voltage.'}
        </Text>
      </View>
    </View>
  );
};

export default BatteryTab;
