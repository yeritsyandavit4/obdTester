import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { ThemeColors, useTheme } from '../../theme';

interface ErrorLogTabProps {
  obdConnected: boolean;
  dtcResults: Array<{ code: string; description: string }>;
  dtcScanning: boolean;
  handleScanDtc: () => void;
}

const getSeverity = (code: string): 'urgent' | 'minor' | 'ok' => {
  if (code === '—') return 'ok';
  const c = code.toUpperCase();
  if (c.startsWith('P0') && (c.includes('301') || c.includes('302') || c.includes('300'))) return 'urgent';
  if (c.startsWith('U') || c.startsWith('B')) return 'urgent';
  return 'minor';
};

const SEV_LABEL: Record<string, string> = { urgent: 'Urgent', minor: 'Minor', ok: 'OK' };

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  container: { gap: 13 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: T.surface, borderRadius: 10, borderWidth: 1, borderColor: T.border },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 12.5, color: T.text },
  card: { backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border },
  rowLast: { borderBottomWidth: 0 },
  codeChip: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7, backgroundColor: T.accentSoft },
  codeChipText: { fontSize: 12, fontWeight: '700', color: T.accent, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  rowMid: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: T.text },
  sevBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sevDot: { width: 7, height: 7, borderRadius: 3.5 },
  sevText: { fontSize: 12, fontWeight: '600' },
  noCodesText: { flex: 1, fontSize: 14, color: T.muted },
  empty: { backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, paddingVertical: 48, paddingHorizontal: 24, alignItems: 'center', gap: 8 },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: T.surface2, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyIconText: { fontSize: 26, color: T.muted },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: T.text },
  emptySubtitle: { fontSize: 13, color: T.muted, textAlign: 'center', lineHeight: 18 },
  aiBanner: { backgroundColor: T.accentSoft, borderRadius: 14, borderWidth: 1, borderColor: T.border, paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  aiBannerDiamond: { width: 11, height: 11, backgroundColor: T.accent, transform: [{ rotate: '45deg' }], borderRadius: 2, flexShrink: 0 },
  aiBannerText: { flex: 1, fontSize: 13, color: T.text, lineHeight: 18 },
  aiBannerAccent: { fontWeight: '700', color: T.accent },
});

const ErrorLogTab: React.FC<ErrorLogTabProps> = ({ obdConnected, dtcResults, dtcScanning }) => {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const sevColor = { urgent: T.red, minor: T.amber, ok: T.good };
  const realCodes = dtcResults.filter(d => d.code !== '—');
  const urgentCount = realCodes.filter(d => getSeverity(d.code) === 'urgent').length;
  const minorCount  = realCodes.filter(d => getSeverity(d.code) === 'minor').length;

  return (
    <View style={styles.container}>
      {realCodes.length > 0 && (
        <View style={styles.chips}>
          {urgentCount > 0 && (
            <View style={styles.chip}>
              <View style={[styles.chipDot, { backgroundColor: T.red }]} />
              <Text style={styles.chipText}>{urgentCount} urgent</Text>
            </View>
          )}
          {minorCount > 0 && (
            <View style={styles.chip}>
              <View style={[styles.chipDot, { backgroundColor: T.amber }]} />
              <Text style={styles.chipText}>{minorCount} minor</Text>
            </View>
          )}
        </View>
      )}

      {dtcResults.length > 0 ? (
        <View style={styles.card}>
          {dtcResults.map((dtc, idx) => {
            const sev = getSeverity(dtc.code);
            const isLast = idx === dtcResults.length - 1;
            if (dtc.code === '—') {
              return (
                <View key={idx} style={[styles.row, isLast && styles.rowLast]}>
                  <Text style={styles.noCodesText}>{dtc.description}</Text>
                </View>
              );
            }
            return (
              <View key={idx} style={[styles.row, isLast && styles.rowLast]}>
                <View style={styles.codeChip}>
                  <Text style={styles.codeChipText}>{dtc.code}</Text>
                </View>
                <View style={styles.rowMid}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{dtc.description}</Text>
                </View>
                <View style={styles.sevBadge}>
                  <View style={[styles.sevDot, { backgroundColor: sevColor[sev] }]} />
                  <Text style={[styles.sevText, { color: sevColor[sev] }]}>{SEV_LABEL[sev]}</Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>○</Text>
          </View>
          <Text style={styles.emptyTitle}>{dtcScanning ? 'Scanning systems…' : 'No codes scanned yet'}</Text>
          <Text style={styles.emptySubtitle}>{obdConnected ? 'Tap Quick Scan below to read fault codes' : 'Connect to OBD to scan for errors'}</Text>
        </View>
      )}

      {realCodes.length > 0 && (
        <View style={styles.aiBanner}>
          <View style={styles.aiBannerDiamond} />
          <Text style={styles.aiBannerText}>
            Not sure what these mean?{' '}
            <Text style={styles.aiBannerAccent}>AI Scan</Text>
            {' '}explains each code in plain language.
          </Text>
        </View>
      )}
    </View>
  );
};

export default ErrorLogTab;
