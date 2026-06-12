import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors, useTheme } from '../../theme';

interface BrakePadTabProps { obdConnected: boolean }

const wheels = [
  { label: 'Front left',  pct: 38, km: 7000 },
  { label: 'Front right', pct: 41, km: 8000 },
  { label: 'Rear left',   pct: 82, km: 24000 },
  { label: 'Rear right',  pct: 80, km: 23000 },
];

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  container: { gap: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: { width: '47.5%', backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border, padding: 13, gap: 9 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardLabel: { fontSize: 12, color: T.muted },
  cardPct: { fontSize: 18, fontWeight: '700', color: T.text },
  track: { height: 7, borderRadius: 4, backgroundColor: T.surface2, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 4 },
  cardKm: { fontSize: 11, color: T.muted },
  notice: { backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.border, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  noticeDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  noticeText: { flex: 1, fontSize: 13, color: T.text, lineHeight: 18 },
});

const BrakePadTab: React.FC<BrakePadTabProps> = ({ obdConnected }) => {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {wheels.map(({ label, pct, km }) => (
          <View key={label} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>{label}</Text>
              <Text style={styles.cardPct}>{obdConnected ? `${pct}%` : '—'}</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.bar, { width: obdConnected ? `${pct}%` : '0%', backgroundColor: pct < 50 ? T.amber : T.good }]} />
            </View>
            <Text style={styles.cardKm}>{obdConnected ? `≈ ${km.toLocaleString()} km left` : '—'}</Text>
          </View>
        ))}
      </View>

      <View style={styles.notice}>
        <View style={[styles.noticeDot, { backgroundColor: T.amber }]} />
        <Text style={styles.noticeText}>Front pads are wearing — plan a replacement within ~3 months.</Text>
      </View>
    </View>
  );
};

export default BrakePadTab;
