import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Circle as SvgCircle,
  G,
  Line,
  Path,
  Text as SvgText,
} from 'react-native-svg';
import { ThemeColors, useTheme } from '../../theme';

interface EngineTabProps {
  obdConnected: boolean;
  obdRpm: number | null;
  obdSpeedKmh: number | null;
  obdCoolantC: number | null;
  obdThrottlePct: number | null;
  obdIntakeC: number | null;
  obdEngineLoadPct: number | null;
  livePolling: boolean;
  handleToggleLive: () => void;
  handleReadRpm: () => void;
  handleReadSpeed: () => void;
}

interface GaugeProps {
  value: number;
  max: number;
  size: number;
  unit: string;
  tickLabels: number[];
  redlinePct?: number;
  T: ThemeColors;
}

const STROKE = 10;
const START_DEG = 150;
const SWEEP = 240;

function xy(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arc(cx: number, cy: number, r: number, startDeg: number, sweepDeg: number): string {
  if (sweepDeg < 0.5) return '';
  const s = Math.min(sweepDeg, 359.9);
  const a = xy(cx, cy, r, startDeg);
  const b = xy(cx, cy, r, startDeg + s);
  return `M${a.x.toFixed(2)},${a.y.toFixed(2)} A${r},${r},0,${s > 180 ? 1 : 0},1,${b.x.toFixed(2)},${b.y.toFixed(2)}`;
}

const GAUGE_SIZE = 158;

const CircleGauge: React.FC<GaugeProps> = ({
  value, max, size, unit, tickLabels, redlinePct = 0.8, T,
}) => {
  const half = size / 2;
  const arcR = half - STROKE / 2 - 2;

  const targetPct = Math.min(Math.max(value / max, 0), 1);
  const animPct = useRef(new Animated.Value(0)).current;
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const id = animPct.addListener(({ value: v }) => setPct(v));
    return () => animPct.removeListener(id);
  }, [animPct]);

  useEffect(() => {
    Animated.spring(animPct, {
      toValue: targetPct,
      friction: 8,
      tension: 60,
      useNativeDriver: false,
    }).start();
  }, [targetPct]);

  const isRedline = pct >= redlinePct;
  const color = isRedline ? T.red : T.accent;
  const fillSweep = pct * SWEEP;
  const needleDeg = START_DEG + pct * SWEEP;
  const needleR = arcR - STROKE / 2 - 4;
  const tip = xy(half, half, needleR, needleDeg);
  const isRpm = unit.includes('1000');
  const displayValue = pct > 0 ? Math.round(pct * max).toLocaleString() : '—';

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Path
          d={arc(half, half, arcR, START_DEG, redlinePct < 1 ? redlinePct * SWEEP : SWEEP)}
          stroke={T.surface2}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
        />
        {redlinePct < 1 && (
          <Path
            d={arc(half, half, arcR, START_DEG + redlinePct * SWEEP, SWEEP - redlinePct * SWEEP)}
            stroke={T.red}
            strokeWidth={STROKE}
            fill="none"
            strokeOpacity={0.28}
            strokeLinecap="round"
          />
        )}
        {fillSweep > 0.5 && (
          <Path
            d={arc(half, half, arcR, START_DEG, fillSweep)}
            stroke={color}
            strokeWidth={STROKE}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {tickLabels.map(lbl => {
          const tp = lbl / max;
          const deg = START_DEG + tp * SWEEP;
          const outerR = arcR - STROKE / 2 - 1;
          const innerR = arcR - STROKE / 2 - 10;
          const labelR = arcR - STROKE / 2 - 22;
          const o = xy(half, half, outerR, deg);
          const i = xy(half, half, innerR, deg);
          const l = xy(half, half, labelR, deg);
          const labelText = lbl === 0 ? '' : isRpm ? String(lbl / 1000) : String(lbl);
          return (
            <G key={lbl}>
              <Line x1={i.x} y1={i.y} x2={o.x} y2={o.y} stroke={T.muted2} strokeWidth={1.5} />
              {labelText !== '' && (
                <SvgText x={l.x} y={l.y + 3.5} fontSize={8} fontWeight="600" fill={T.muted2} textAnchor="middle">
                  {labelText}
                </SvgText>
              )}
            </G>
          );
        })}
        <Line x1={half} y1={half} x2={tip.x} y2={tip.y} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
        <SvgCircle cx={half} cy={half} r={5} fill={color} />
        <SvgCircle cx={half} cy={half} r={2.5} fill={T.surface} />
      </Svg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: T.text, fontSize: size * 0.18, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', lineHeight: size * 0.22 }}>
            {displayValue}
          </Text>
          <Text style={{ color: T.muted, fontSize: size * 0.075, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 1 }}>
            {unit}
          </Text>
        </View>
      </View>
    </View>
  );
};

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
  hint: { fontSize: 12, color: T.muted, lineHeight: 16 },
  gaugesRow: { flexDirection: 'row', gap: 10 },
  gaugeCard: { flex: 1, backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, paddingVertical: 14, paddingHorizontal: 6, alignItems: 'center', gap: 4 },
  gaugeCardLabel: { fontSize: 10.5, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: T.muted },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47.5%', backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.border, paddingVertical: 12, paddingHorizontal: 14, gap: 4 },
  statLabel: { fontSize: 10.5, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: T.muted },
  statValue: { fontSize: 20, fontWeight: '700', color: T.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});

const EngineTab: React.FC<EngineTabProps> = ({ obdConnected, obdRpm, obdSpeedKmh, obdCoolantC, obdThrottlePct, obdIntakeC, obdEngineLoadPct, livePolling, handleToggleLive, handleReadRpm, handleReadSpeed }) => {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);
  const rpm = obdRpm ?? 0;
  const speed = obdSpeedKmh ?? 0;

  const stats = [
    { label: 'Coolant',     value: obdCoolantC != null ? `${obdCoolantC}°C` : '—' },
    { label: 'Throttle',    value: obdThrottlePct != null ? `${obdThrottlePct}%` : '—' },
    { label: 'Intake air',  value: obdIntakeC != null ? `${obdIntakeC}°C` : '—' },
    { label: 'Engine load', value: obdEngineLoadPct != null ? `${obdEngineLoadPct}%` : '—' },
  ];

  // Tap-to-read is only available when connected and not already live-polling
  // (concurrent reads would clash with the polling loop's writes).
  const canTapRead = obdConnected && !livePolling;

  return (
    <View style={styles.container}>
      <View style={styles.liveRow}>
        <View style={[styles.liveDot, livePolling && styles.liveDotActive]} />
        <Text style={styles.liveLabel}>{livePolling ? 'Live engine data' : 'Engine data'}</Text>
        <TouchableOpacity style={[styles.liveBtn, livePolling && styles.liveBtnActive]} onPress={handleToggleLive} disabled={!obdConnected}>
          <Text style={[styles.liveBtnText, livePolling && styles.liveBtnTextActive]}>{livePolling ? 'Stop' : 'Live'}</Text>
        </TouchableOpacity>
      </View>

      {canTapRead && (
        <Text style={styles.hint}>Tap a gauge to read once, or start Live for continuous updates.</Text>
      )}

      <View style={styles.gaugesRow}>
        <TouchableOpacity style={styles.gaugeCard} activeOpacity={0.7} onPress={handleReadRpm} disabled={!canTapRead}>
          <CircleGauge value={rpm} max={8000} size={GAUGE_SIZE} unit="rpm ×1000" tickLabels={[0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000]} redlinePct={0.75} T={T} />
          <Text style={styles.gaugeCardLabel}>RPM</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.gaugeCard} activeOpacity={0.7} onPress={handleReadSpeed} disabled={!canTapRead}>
          <CircleGauge value={speed} max={200} size={GAUGE_SIZE} unit="km / h" tickLabels={[0, 50, 100, 150, 200]} redlinePct={1.0} T={T} />
          <Text style={styles.gaugeCardLabel}>Speed</Text>
        </TouchableOpacity>
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

export default EngineTab;
