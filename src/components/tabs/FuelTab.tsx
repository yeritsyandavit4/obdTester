import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ThemeColors, useTheme } from '../../theme';

interface FuelTabProps {
  obdConnected: boolean;
  obdRpm: number | null;
  obdSpeedKmh: number | null;
  obdEngineLoadPct: number | null;
  obdIntakeC: number | null;
  obdMafGs: number | null;
  obdFuelRateLh: number | null;
  obdFuelLevelPct: number | null;
  obdMapKpa: number | null;
  vehicleDisplacementL: number | null;
  livePolling: boolean;
  handleToggleLive: () => void;
}

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  container: { gap: 13 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: T.muted2 },
  liveDotActive: { backgroundColor: T.accent },
  liveLabel: { flex: 1, fontSize: 11, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase', color: T.muted },
  liveBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: T.border, backgroundColor: T.surface },
  liveBtnActive: { backgroundColor: T.accentSoft, borderColor: T.accent },
  liveBtnText: { fontSize: 12, fontWeight: '700', color: T.muted },
  liveBtnTextActive: { color: T.accent },

  fuelCard: { backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, padding: 18, gap: 13 },
  fuelHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  fuelLabel: { fontSize: 10.5, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: T.muted },
  fuelValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  fuelValue: { fontSize: 40, fontWeight: '800', color: T.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  fuelUnit: { fontSize: 13, fontWeight: '600', color: T.muted },
  fuelAdvice: { flexDirection: 'row', gap: 11, alignItems: 'flex-start', backgroundColor: T.accentSoft, borderRadius: 14, borderWidth: 1, borderColor: T.border, padding: 13 },
  fuelAdviceDot: { width: 11, height: 11, borderRadius: 3, backgroundColor: T.accent, transform: [{ rotate: '45deg' }], marginTop: 3, flexShrink: 0 },
  fuelAdviceText: { flex: 1, fontSize: 13, color: T.text, lineHeight: 19 },
  fuelHint: { fontSize: 12, color: T.muted, lineHeight: 16 },

  levelCard: { backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, padding: 18, gap: 12 },
  levelTrack: { height: 12, borderRadius: 6, backgroundColor: T.surface2, overflow: 'hidden' },
  levelFill: { height: '100%', borderRadius: 6 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47.5%', backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.border, paddingVertical: 12, paddingHorizontal: 14, gap: 4 },
  statLabel: { fontSize: 10.5, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: T.muted },
  statValue: { fontSize: 20, fontWeight: '700', color: T.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});

const FuelTab: React.FC<FuelTabProps> = ({ obdConnected, obdRpm, obdSpeedKmh, obdEngineLoadPct, obdIntakeC, obdMafGs, obdFuelRateLh, obdFuelLevelPct, obdMapKpa, vehicleDisplacementL, livePolling, handleToggleLive }) => {
  const T = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(T), [T]);
  const rpm = obdRpm ?? 0;
  const speed = obdSpeedKmh ?? 0;

  // Air mass flow (g/s): use the MAF sensor if present, else estimate it from the
  // MAP sensor via the speed-density method (for engines without a MAF, e.g. Dodge).
  // MAF = (RPM × MAP × VE × displacement × molarMass) / (IAT(K) × R × 120)
  const VE = 0.8; // assumed volumetric efficiency
  const displacementL = vehicleDisplacementL ?? 2.0; // fallback if VIN had no displacement
  const iatK = (obdIntakeC ?? 25) + 273.15;
  const estMafGs =
    obdMapKpa != null && rpm > 0
      ? (rpm * obdMapKpa * VE * displacementL * 3.484) / (iatK * 120)
      : null;
  const mafGs = obdMafGs != null ? obdMafGs : estMafGs;

  // Fuel flow in litres/hour: prefer the direct fuel-rate PID (015E), else from
  // air mass flow. Gasoline ≈ 14.7 g air per g fuel, density ≈ 745 g/L.
  const fuelRateLh =
    obdFuelRateLh != null
      ? obdFuelRateLh
      : mafGs != null
        ? Math.round(((mafGs * 3600) / (14.7 * 745)) * 10) / 10
        : null;
  const hasFuel = fuelRateLh != null;
  // True when the figure comes from the MAP estimate rather than a measured PID.
  const isEstimated = obdFuelRateLh == null && obdMafGs == null && estMafGs != null;
  // L/100km is only meaningful while moving; at a stop we report idle L/h instead.
  const l100 = hasFuel && speed > 3 ? Math.round((fuelRateLh! / speed) * 100 * 10) / 10 : null;

  // Eco heuristic: high engine load and high revs waste fuel. Estimate the
  // share you could save by easing off the throttle and holding a steady speed.
  const load = obdEngineLoadPct ?? 0;
  const aggression = Math.min(1, Math.max(0, ((load - 45) / 55) * 0.6 + ((rpm - 2000) / 3500) * 0.4));
  const savingPct = Math.round(aggression * 25);
  const projected = l100 != null ? Math.round(l100 * (1 - savingPct / 100) * 10) / 10 : null;

  // Fuel tank level (OBD reports a percentage only, not litres).
  const level = obdFuelLevelPct;
  const levelColor = level == null ? T.muted2 : level <= 15 ? T.red : level <= 30 ? T.amber : T.good;

  const stats = [
    { label: t('fuel.flow'), value: hasFuel ? `${fuelRateLh!.toFixed(1)} ${t('fuel.lh')}` : '—' },
    { label: t('fuel.speed'), value: speed > 0 ? `${speed} ${t('dashboard.kmh')}` : '—' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.liveRow}>
        <View style={[styles.liveDot, livePolling && styles.liveDotActive]} />
        <Text style={styles.liveLabel}>{livePolling ? t('fuel.titleLive') : t('fuel.title')}</Text>
        <TouchableOpacity style={[styles.liveBtn, livePolling && styles.liveBtnActive]} onPress={handleToggleLive} disabled={!obdConnected}>
          <Text style={[styles.liveBtnText, livePolling && styles.liveBtnTextActive]}>{livePolling ? t('fuel.stop') : 'Live'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.levelCard}>
        <View style={styles.fuelHeader}>
          <Text style={styles.fuelLabel}>{t('fuel.level')}</Text>
          <Text style={styles.fuelUnit}>{t('fuel.levelNote')}</Text>
        </View>
        <View style={styles.fuelValueRow}>
          <Text style={[styles.fuelValue, { color: levelColor }]}>{level != null ? String(level) : '—'}</Text>
          <Text style={styles.fuelUnit}>%</Text>
        </View>
        <View style={styles.levelTrack}>
          <View style={[styles.levelFill, { width: `${level ?? 0}%`, backgroundColor: levelColor }]} />
        </View>
        {level == null ? (
          <Text style={styles.fuelHint}>{t('fuel.levelNoData')}</Text>
        ) : level <= 15 ? (
          <Text style={[styles.fuelHint, { color: T.red }]}>{t('fuel.levelLow')}</Text>
        ) : null}
      </View>

      <View style={styles.fuelCard}>
        <View style={styles.fuelHeader}>
          <Text style={styles.fuelLabel}>{t('fuel.title')}</Text>
          <Text style={styles.fuelUnit}>
            {l100 != null ? t('fuel.per100') : hasFuel ? t('fuel.atIdle') : ''}
          </Text>
        </View>

        <View style={styles.fuelValueRow}>
          <Text style={styles.fuelValue}>
            {l100 != null ? l100.toFixed(1) : hasFuel ? fuelRateLh!.toFixed(1) : '—'}
          </Text>
          <Text style={styles.fuelUnit}>
            {l100 != null ? t('fuel.l100') : hasFuel ? t('fuel.lh') : ''}
          </Text>
        </View>

        {isEstimated && <Text style={styles.fuelHint}>{t('fuel.estimated')}</Text>}

        {!hasFuel ? (
          <Text style={styles.fuelHint}>{t('fuel.noData')}</Text>
        ) : (
          <View style={styles.fuelAdvice}>
            <View style={styles.fuelAdviceDot} />
            <Text style={styles.fuelAdviceText}>
              {savingPct >= 5 && projected != null
                ? t('fuel.adviceSave', { pct: savingPct, value: projected.toFixed(1) })
                : t('fuel.adviceEfficient')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.statsGrid}>
        {stats.map(({ label, value }) => (
          <View key={label} style={styles.statCard}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default FuelTab;
