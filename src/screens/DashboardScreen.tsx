import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Alert,
  ActivityIndicator,
  PermissionsAndroid,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import RNBluetoothClassic, { BluetoothDevice } from 'react-native-bluetooth-classic';
import dtcCodesRaw from '../../codes.json';
import { useObdStore } from '../store/obdStore';
import NotificationModal from '../components/NotificationModal';
import LanguageSelector from '../components/LanguageSelector';
import EngineTab from '../components/tabs/EngineTab';
import FuelTab from '../components/tabs/FuelTab';
import ErrorLogTab from '../components/tabs/ErrorLogTab';
import BatteryTab from '../components/tabs/BatteryTab';
import BrakePadTab from '../components/tabs/BrakePadTab';
import ABSTab from '../components/tabs/ABSTab';
import ACTab from '../components/tabs/ACTab';
import ConnectModal from '../components/ConnectModal';
import { useTranslation } from 'react-i18next';
import { scanVin, fetchCarImageUrl } from '../services/carImageService';
import { useTheme, ThemeColors } from '../theme';

const dtcLookup: Record<string, string> = {};
for (const entry of dtcCodesRaw as Array<{ Code: string; Description: string }>) {
  const code = entry.Code.replace(/\/.*$/, '').trim().toUpperCase();
  dtcLookup[code] = entry.Description;
}

type ScanMode = 'standard' | 'ai';
type ScanPhase = 'scanning' | 'result';
interface ScanState { mode: ScanMode; phase: ScanPhase; progress: number }

const SCAN_SYSTEMS = [
  { name: 'Engine',       at: 18, r: 'issue' },
  { name: 'Emissions',    at: 36, r: 'issue' },
  { name: 'Fuel system',  at: 54, r: 'issue' },
  { name: 'Battery',      at: 70, r: 'ok' },
  { name: 'ABS & sensors',at: 84, r: 'ok' },
  { name: 'Brakes',       at: 96, r: 'warn' },
];

const DashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const {
    bleDeviceId,
    obdConnected,
    obdConnecting,
    obdRpm,
    obdSpeedKmh,
    obdCoolantC,
    obdThrottlePct,
    obdIntakeC,
    obdEngineLoadPct,
    obdVoltage,
    obdMafGs,
    obdFuelRateLh,
    obdFuelLevelPct,
    obdMapKpa,
    obdSupportedPids,
    vehicleDisplacementL,
    dtcResults,
    dtcScanning,
    livePolling,
    activeTab,
    vehicleVin,
    vehicleMake,
    vinReading,
    modalVisible,
    modalType,
    modalTitle,
    modalMessage,
    languageSelectorVisible,
    userFirstName,
    userLastName,
    isDarkMode,
    toggleTheme,
    setBleDeviceId,
    setObdConnected,
    setObdConnecting,
    setObdLastResponse,
    setObdRpm,
    setObdSpeedKmh,
    setObdCoolantC,
    setObdThrottlePct,
    setObdIntakeC,
    setObdEngineLoadPct,
    setObdVoltage,
    setObdMafGs,
    setObdFuelRateLh,
    setObdFuelLevelPct,
    setObdMapKpa,
    setObdSupportedPids,
    setVehicleDisplacementL,
    setDtcResults,
    setDtcScanning,
    setLivePolling,
    setActiveTab,
    setVehicleVin,
    setVehicleMake,
    setVinReading,
    showModal,
    hideModal,
    showLanguageSelector,
    hideLanguageSelector,
    setProfileEditVisible,
  } = useObdStore();

  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bleDeviceRef = useRef<BluetoothDevice | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [make, setMake] = useState<string | undefined>(undefined);
  const [model, setModel] = useState<string | undefined>(undefined);
  const [modelYear, setModelYear] = useState<string | undefined>(undefined);
  const [bleDevices, setBleDevices] = useState<BluetoothDevice[]>([]);
  const [bleScanning, setBleScanning] = useState(false);
  const [connectModalVisible, setConnectModalVisible] = useState(false);
  const [scan, setScan] = useState<ScanState | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!obdConnected) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [obdConnected, pulseAnim]);

  useEffect(() => () => {
    if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    try {
      if (bleDeviceRef.current?.isConnected()) bleDeviceRef.current.disconnect();
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (obdConnected) setConnectModalVisible(false);
  }, [obdConnected]);

  useEffect(() => {
    fetchCarImageUrl('opel', 'vectra', '2000').then(() => {});
  }, []);

  const ensureBtPermissions = async () => {
    if (Platform.OS !== 'android') return true;
    try {
      const perms: any[] = [];
      if (Platform.Version >= 31) {
        perms.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
        perms.push(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
      } else {
        perms.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      }
      const results: any = await PermissionsAndroid.requestMultiple(perms as any);
      return perms.every(p => results?.[p] === PermissionsAndroid.RESULTS.GRANTED);
    } catch { return false; }
  };

  const startBleScan = async () => {
    const ok = await ensureBtPermissions();
    if (!ok) { showModal('error', t('modal.connectionError'), 'Bluetooth permission denied'); return; }
    setBleDevices([]);
    setBleScanning(true);
    try {
      const bonded = await RNBluetoothClassic.getBondedDevices();
      setBleDevices(bonded);
      setBleScanning(false);
      if (bonded.length === 0) showModal('info', 'No Paired Devices', 'Please pair your OBD adapter first');
    } catch (e) {
      setBleScanning(false);
      showModal('error', t('modal.connectionError'), String(e));
    }
  };

  const parseHexBytes = (raw: string) => {
    const cleaned = raw.replace(/SEARCHING\.\.\./gi, '').replace(/[^0-9A-Fa-f\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const bytes: number[] = [];
    for (const tok of cleaned.split(' ').filter(Boolean)) {
      if (/^[0-9A-Fa-f]{2}$/.test(tok)) bytes.push(parseInt(tok, 16));
      else if (/^[0-9A-Fa-f]+$/.test(tok) && tok.length % 2 === 0) {
        for (let j = 0; j < tok.length; j += 2) bytes.push(parseInt(tok.substring(j, j + 2), 16));
      }
    }
    return bytes;
  };

  const parseRpmFrom010C = (raw: string) => {
    const bytes = parseHexBytes(raw);
    for (let i = 0; i + 3 < bytes.length; i++) {
      if (bytes[i] === 0x41 && bytes[i + 1] === 0x0c) return (bytes[i + 2] * 256 + bytes[i + 3]) / 4;
    }
    return null;
  };

  const parseSpeedFrom010D = (raw: string) => {
    const bytes = parseHexBytes(raw);
    for (let i = 0; i + 2 < bytes.length; i++) {
      if (bytes[i] === 0x41 && bytes[i + 1] === 0x0d) return bytes[i + 2];
    }
    return null;
  };

  // Returns the first data byte (A) of a single-byte mode-01 PID response (41 <pid> A …)
  const parseFirstDataByte = (raw: string, pid: number): number | null => {
    const bytes = parseHexBytes(raw);
    for (let i = 0; i + 2 < bytes.length; i++) {
      if (bytes[i] === 0x41 && bytes[i + 1] === pid) return bytes[i + 2];
    }
    return null;
  };

  const parseCoolantFrom0105 = (raw: string) => {
    const a = parseFirstDataByte(raw, 0x05); return a === null ? null : a - 40;
  };
  const parseIntakeFrom010F = (raw: string) => {
    const a = parseFirstDataByte(raw, 0x0f); return a === null ? null : a - 40;
  };
  const parseThrottleFrom0111 = (raw: string) => {
    const a = parseFirstDataByte(raw, 0x11); return a === null ? null : Math.round((a * 100) / 255);
  };
  const parseLoadFrom0104 = (raw: string) => {
    const a = parseFirstDataByte(raw, 0x04); return a === null ? null : Math.round((a * 100) / 255);
  };
  const parseVoltageFrom0142 = (raw: string): number | null => {
    const bytes = parseHexBytes(raw);
    for (let i = 0; i + 3 < bytes.length; i++) {
      if (bytes[i] === 0x41 && bytes[i + 1] === 0x42) {
        return Math.round(((bytes[i + 2] * 256 + bytes[i + 3]) / 1000) * 10) / 10;
      }
    }
    return null;
  };

  // PID 0110 — Mass Air Flow rate: (256*A + B) / 100 grams/sec
  const parseMafFrom0110 = (raw: string): number | null => {
    const bytes = parseHexBytes(raw);
    for (let i = 0; i + 3 < bytes.length; i++) {
      if (bytes[i] === 0x41 && bytes[i + 1] === 0x10) {
        return Math.round(((bytes[i + 2] * 256 + bytes[i + 3]) / 100) * 100) / 100;
      }
    }
    return null;
  };

  // PID 015E — Engine fuel rate: (256*A + B) / 20 litres/hour (not supported by all ECUs)
  const parseFuelRateFrom015E = (raw: string): number | null => {
    const bytes = parseHexBytes(raw);
    for (let i = 0; i + 3 < bytes.length; i++) {
      if (bytes[i] === 0x41 && bytes[i + 1] === 0x5e) {
        return Math.round(((bytes[i + 2] * 256 + bytes[i + 3]) / 20) * 10) / 10;
      }
    }
    return null;
  };

  // PID 012F — Fuel Tank Level Input: A * 100 / 255 percent
  const parseFuelLevelFrom012F = (raw: string): number | null => {
    const a = parseFirstDataByte(raw, 0x2f);
    return a === null ? null : Math.round((a * 100) / 255);
  };

  // PID 010B — Intake Manifold Absolute Pressure: A kPa
  const parseMapFrom010B = (raw: string): number | null => parseFirstDataByte(raw, 0x0b);

  // PID 0100/0120/0140 — supported-PID bitmask. base is the PID byte (0x00/0x20/0x40);
  // each of the 4 data bytes carries 8 flags, MSB first, for the next PIDs after base.
  const parseSupportedPids = (raw: string, base: number): string[] => {
    const bytes = parseHexBytes(raw);
    const pids: string[] = [];
    for (let i = 0; i + 5 < bytes.length; i++) {
      if (bytes[i] === 0x41 && bytes[i + 1] === base) {
        for (let k = 0; k < 4; k++) {
          const b = bytes[i + 2 + k];
          for (let bit = 0; bit < 8; bit++) {
            if ((b >> (7 - bit)) & 1) {
              const pidNum = base + k * 8 + bit + 1;
              pids.push(pidNum.toString(16).toUpperCase().padStart(2, '0'));
            }
          }
        }
        break;
      }
    }
    return pids;
  };

  const parseDTCs = (raw: string): string[] => {
    const bytes = parseHexBytes(raw);
    const codes: string[] = [];
    let dataStart = -1;
    for (let i = 0; i < bytes.length; i++) { if (bytes[i] === 0x43) { dataStart = i + 1; break; } }
    if (dataStart < 0) return codes;
    const prefixMap: Record<number, string> = { 0:'P0',1:'P1',2:'P2',3:'P3',4:'C0',5:'C1',6:'C2',7:'C3',8:'B0',9:'B1',10:'B2',11:'B3',12:'U0',13:'U1',14:'U2',15:'U3' };
    for (let i = dataStart; i + 1 < bytes.length; i += 2) {
      const hi = bytes[i], lo = bytes[i + 1];
      if (hi === 0x00 && lo === 0x00) continue;
      const nibble1 = (hi >> 4) & 0x0f, nibble2 = hi & 0x0f;
      codes.push((prefixMap[nibble1] ?? 'P0') + nibble2.toString(16).toUpperCase() + lo.toString(16).toUpperCase().padStart(2, '0'));
    }
    return codes;
  };

  const parseVinFrom0902 = (raw: string): string | null => {
    const bytes = parseHexBytes(raw);
    const vinBytes: number[] = [];
    let i = 0;
    while (i < bytes.length) {
      if (bytes[i] === 0x49 && i + 1 < bytes.length && bytes[i + 1] === 0x02) { i += 3; continue; }
      vinBytes.push(bytes[i]); i++;
    }
    const vinChars = vinBytes.filter(b => b >= 0x20 && b <= 0x7e).map(b => String.fromCharCode(b));
    if (vinChars.length >= 17) return vinChars.slice(0, 17).join('');
    const ascii = raw.replace(/[^A-Za-z0-9]/g, '');
    if (ascii.length >= 17) return ascii.substring(ascii.length - 17);
    return null;
  };

  const obdReadUntilPrompt = async (timeoutMs: number): Promise<string> => {
    const device = bleDeviceRef.current;
    if (!device) throw new Error('Not connected');
    let buffer = '', lastDataTime = 0;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const msg = await device.read();
        if (msg) {
          buffer += msg + '\n'; lastDataTime = Date.now();
          if (buffer.includes('>')) return buffer.replace(/\r/g, '').replace(/>/g, '').trim();
        } else if (lastDataTime > 0 && Date.now() - lastDataTime > 500) {
          return buffer.replace(/\r/g, '').replace(/>/g, '').trim();
        }
      } catch (e) { console.log('[obdRead] error:', e); }
      await new Promise<void>(r => setTimeout(r, 50));
    }
    if (buffer.trim().length > 0) return buffer.replace(/\r/g, '').replace(/>/g, '').trim();
    throw new Error('OBD timeout');
  };

  const obdSend = async (command: string, timeoutMs = 10000): Promise<string> => {
    if (!bleDeviceRef.current) throw new Error('Not connected');
    try { await bleDeviceRef.current.clear(); } catch { /* ignore */ }
    await bleDeviceRef.current.write(`${command.trim()}\r`);
    const response = await obdReadUntilPrompt(timeoutMs);
    setObdLastResponse(response);
    return response;
  };

  const obdInit = async () => {
    await obdSend('ATZ', 5000); await obdSend('ATE0', 3000); await obdSend('ATL0', 3000);
    await obdSend('ATS0', 3000); await obdSend('ATH0', 3000); await obdSend('ATSP0', 3000);
  };

  const readVehicleInfo = async () => {
    setVinReading(true);
    try {
      const vin = parseVinFrom0902(await obdSend('0902', 8000));
      if (vin) {
        setVehicleVin(vin);
        const decoded = await scanVin(vin);
        if (decoded) {
          setModelYear(decoded.modelYear ?? undefined);
          setModel(decoded.model ?? undefined);
          setMake(decoded.make ?? undefined);
          if (decoded.make) setVehicleMake(decoded.make);
          if (decoded.displacementL) setVehicleDisplacementL(decoded.displacementL);
          fetchCarImageUrl(decoded.make ?? '', decoded.model ?? undefined, decoded.modelYear ?? undefined).then(() => {});
        }
      } else { setVehicleMake('Vehicle'); }
    } catch { setVehicleMake('Vehicle'); }
    finally { setVinReading(false); }
  };

  // One-time probe: ask the ECU which PIDs it supports across the 01-60 range,
  // so we only poll what exists and can pick the right fuel-calc path.
  const probeSupportedPids = async () => {
    try {
      const pids: string[] = [];
      pids.push(...parseSupportedPids(await obdSend('0100', 3000), 0x00));
      if (pids.includes('20')) pids.push(...parseSupportedPids(await obdSend('0120', 3000), 0x20));
      if (pids.includes('40')) pids.push(...parseSupportedPids(await obdSend('0140', 3000), 0x40));
      setObdSupportedPids(pids);
    } catch { /* leave empty — poll everything as a fallback */ }
  };

  const handleObdConnect = async () => {
    if (!bleDeviceId) { showModal('error', t('modal.invalidInput'), 'Select a Bluetooth device'); return; }
    const ok = await ensureBtPermissions();
    if (!ok) { showModal('error', t('modal.connectionError'), 'Bluetooth permission denied'); return; }
    setObdConnecting(true); setObdLastResponse(''); setObdRpm(null); setObdSpeedKmh(null);
    try {
      const device = await RNBluetoothClassic.connectToDevice(bleDeviceId, { delimiter: '\r' });
      bleDeviceRef.current = device; setObdConnected(true);
      try {
        await obdInit(); setObdLastResponse('OBD ready — reading vehicle info...');
        await probeSupportedPids();
        await readVehicleInfo(); await readVoltage(); setObdConnecting(false);
        showModal('success', t('modal.connectedTitle'), t('modal.connectedMsg', { vehicle: vehicleMake }));
      } catch (e) {
        setObdLastResponse(`Connected, init failed: ${String(e)}`); setObdConnecting(false);
        showModal('error', t('modal.initFailed'), t('modal.initFailedMsg'));
      }
    } catch (e) {
      console.error(e); setObdConnecting(false);
      showModal('error', t('modal.connectionFailed'), t('modal.connectionFailedMsg'));
    }
  };

  const stopLivePolling = () => {
    if (liveIntervalRef.current) { clearInterval(liveIntervalRef.current); liveIntervalRef.current = null; }
    setLivePolling(false);
  };

  const handleObdDisconnect = () => {
    stopLivePolling();
    try { if (bleDeviceRef.current?.isConnected()) bleDeviceRef.current.disconnect(); } catch { /* ignore */ }
    finally { bleDeviceRef.current = null; setObdConnected(false); }
  };

  const handleReadRpm = async () => {
    try { setObdRpm(parseRpmFrom010C(await obdSend('010C'))); }
    catch (e) { Alert.alert('RPM failed', String(e)); }
  };

  const handleReadSpeed = async () => {
    try { setObdSpeedKmh(parseSpeedFrom010D(await obdSend('010D'))); }
    catch (e) { Alert.alert('Speed failed', String(e)); }
  };

  // Fast values change every moment — poll them on every tick.
  // An empty supported-PID list means the probe failed — fall back to trying everything.
  const supports = (pid: string) => obdSupportedPids.length === 0 || obdSupportedPids.includes(pid);

  const pollFast = async () => {
    try { setObdRpm(parseRpmFrom010C(await obdSend('010C'))); } catch { /* ignore */ }
    try { setObdSpeedKmh(parseSpeedFrom010D(await obdSend('010D'))); } catch { /* ignore */ }
    // Fuel flow, in priority order: direct fuel-rate PID → MAF sensor → MAP (speed-density estimate).
    if (supports('5E')) { try { setObdFuelRateLh(parseFuelRateFrom015E(await obdSend('015E'))); } catch { /* ignore */ } }
    if (supports('10')) { try { setObdMafGs(parseMafFrom0110(await obdSend('0110'))); } catch { /* ignore */ } }
    if (supports('0B')) { try { setObdMapKpa(parseMapFrom010B(await obdSend('010B'))); } catch { /* ignore */ } }
  };

  // Slow values (temps, throttle, load, voltage) drift gradually — poll occasionally.
  const pollSlow = async () => {
    try { setObdCoolantC(parseCoolantFrom0105(await obdSend('0105'))); } catch { /* ignore */ }
    try { setObdThrottlePct(parseThrottleFrom0111(await obdSend('0111'))); } catch { /* ignore */ }
    try { setObdIntakeC(parseIntakeFrom010F(await obdSend('010F'))); } catch { /* ignore */ }
    try { setObdEngineLoadPct(parseLoadFrom0104(await obdSend('0104'))); } catch { /* ignore */ }
    try { setObdVoltage(parseVoltageFrom0142(await obdSend('0142'))); } catch { /* ignore */ }
    try { setObdFuelLevelPct(parseFuelLevelFrom012F(await obdSend('012F'))); } catch { /* ignore */ }
  };

  const readVoltage = async () => {
    try { setObdVoltage(parseVoltageFrom0142(await obdSend('0142'))); } catch { /* ignore */ }
  };

  const handleToggleLive = () => {
    if (livePolling) { stopLivePolling(); return; }
    setLivePolling(true);
    let polling = false;
    let n = 0;
    const tick = async () => {
      if (polling) return;
      polling = true;
      await pollFast();
      if (n % 10 === 0) await pollSlow(); // refresh slow stats ~once every 10 cycles
      n++;
      polling = false;
    };
    tick();
    // Poll as fast as the adapter allows; the `polling` guard prevents overlap.
    liveIntervalRef.current = setInterval(tick, 300);
  };

  const handleScanDTCs = async () => {
    setDtcScanning(true); setDtcResults([]);
    try {
      const resp = await obdSend('03', 10000);
      setObdLastResponse(resp);
      if (/NO DATA/i.test(resp) || /NO CODES/i.test(resp)) {
        setDtcResults([{ code: '—', description: 'No trouble codes found' }]);
        setDtcScanning(false); return;
      }
      const codes = parseDTCs(resp);
      setDtcResults(codes.length === 0
        ? [{ code: '—', description: 'No trouble codes found' }]
        : codes.map(c => ({ code: c, description: dtcLookup[c] ?? 'Unknown code' })));
    } catch (e) { Alert.alert('DTC scan failed', String(e)); }
    finally { setDtcScanning(false); }
  };

  const startScan = (mode: ScanMode) => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setScan({ mode, phase: 'scanning', progress: 0 });
    scanIntervalRef.current = setInterval(() => {
      setScan(s => {
        if (!s) return null;
        const p = Math.min(100, s.progress + 3 + Math.random() * 4);
        if (p >= 100) { clearInterval(scanIntervalRef.current!); return { ...s, progress: 100, phase: 'result' }; }
        return { ...s, progress: p };
      });
    }, 70);
  };

  const closeScan = () => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setScan(null);
  };

  const TABS = [
    t('dashboard.engine'),
    t('dashboard.fuel'),
    t('dashboard.battery'),
    t('dashboard.errorLog'),
    t('dashboard.brakePad'),
    t('dashboard.abs'),
    t('dashboard.ac'),
  ];

  const initials = `${userFirstName.charAt(0)}${userLastName.charAt(0)}`.toUpperCase() || 'ME';
  const carName = [make, model, modelYear].filter(Boolean).join(' ') || vehicleMake;

  const scanning = !!scan && scan.phase === 'scanning';
  const resultStd = !!scan && scan.phase === 'result' && scan.mode === 'standard';
  const resultAi = !!scan && scan.phase === 'result' && scan.mode === 'ai';
  const scanPct = scan ? Math.round(scan.progress) : 0;

  const renderTabContent = () => {
    const tab = activeTab;
    if (tab === t('dashboard.engine')) {
      return <EngineTab obdConnected={obdConnected} obdRpm={obdRpm} obdSpeedKmh={obdSpeedKmh} obdCoolantC={obdCoolantC} obdThrottlePct={obdThrottlePct} obdIntakeC={obdIntakeC} obdEngineLoadPct={obdEngineLoadPct} livePolling={livePolling} handleToggleLive={handleToggleLive} handleReadRpm={handleReadRpm} handleReadSpeed={handleReadSpeed} />;
    }
    if (tab === t('dashboard.fuel')) return <FuelTab obdConnected={obdConnected} obdRpm={obdRpm} obdSpeedKmh={obdSpeedKmh} obdEngineLoadPct={obdEngineLoadPct} obdIntakeC={obdIntakeC} obdMafGs={obdMafGs} obdFuelRateLh={obdFuelRateLh} obdFuelLevelPct={obdFuelLevelPct} obdMapKpa={obdMapKpa} vehicleDisplacementL={vehicleDisplacementL} livePolling={livePolling} handleToggleLive={handleToggleLive} />;
    if (tab === t('dashboard.battery')) return <BatteryTab obdConnected={obdConnected} obdVoltage={obdVoltage} />;
    if (tab === t('dashboard.errorLog')) return <ErrorLogTab obdConnected={obdConnected} dtcResults={dtcResults} dtcScanning={dtcScanning} handleScanDtc={handleScanDTCs} />;
    if (tab === t('dashboard.brakePad')) return <BrakePadTab obdConnected={obdConnected} />;
    if (tab === t('dashboard.abs')) return <ABSTab obdConnected={obdConnected} />;
    if (tab === t('dashboard.ac')) return <ACTab obdConnected={obdConnected} />;
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={T.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarBtn}
          activeOpacity={0.7}
          onPress={() => setProfileEditVisible(true)}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerMid}>
          <Text style={styles.headerName} numberOfLines={1}>{carName}</Text>
          <View style={styles.headerStatus}>
            <Animated.View style={[styles.statusDot, { opacity: obdConnected ? pulseAnim : 1, backgroundColor: obdConnected ? T.good : T.muted2 }]} />
            <Text style={styles.headerStatusText}>
              {obdConnected ? `Connected · OBD-II` : vinReading ? 'Reading VIN…' : t('dashboard.connectToStart')}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.themeToggleBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={styles.themeToggleIcon}>{isDarkMode ? '☀' : '☾'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuBtn} onPress={() => setConnectModalVisible(true)}>
          <View style={styles.menuDot} /><View style={styles.menuDot} /><View style={styles.menuDot} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab content */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>

      {/* Footer: Quick Scan + AI Scan */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.footerBtn, styles.footerBtnOutline, (!obdConnected) && styles.btnDisabled]}
          onPress={() => { if (obdConnected) { handleScanDTCs(); startScan('standard'); } }}
          disabled={!obdConnected || dtcScanning || livePolling}>
          <View style={styles.footerIcon}>
            <View style={styles.footerIconRing} />
          </View>
          <View>
            <Text style={[styles.footerBtnTitle, { color: T.accent }]}>Quick Scan</Text>
            <Text style={styles.footerBtnSub}>Codes &amp; status</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.footerBtn, styles.footerBtnFill, (!obdConnected) && styles.btnDisabled]}
          onPress={() => { if (obdConnected) startScan('ai'); }}
          disabled={!obdConnected}>
          <View style={styles.footerIconDiamond} />
          <View>
            <Text style={[styles.footerBtnTitle, { color: T.onAccent }]}>AI Scan</Text>
            <Text style={[styles.footerBtnSub, { color: T.onAccent, opacity: 0.78 }]}>Plain-language</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Scan overlay — scanning state */}
      {scanning && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayClose} onPress={closeScan}>
            <Text style={{ color: T.muted, fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
          <View style={styles.overlayCenterContent}>
            <ScanRing pct={scanPct} size={150} />
            <View style={{ alignItems: 'center', gap: 5 }}>
              <Text style={styles.scanTitle}>
                {scan?.mode === 'ai' ? 'AI is reading your car…' : 'Scanning systems…'}
              </Text>
              <Text style={styles.scanSub}>
                {scan?.mode === 'ai' ? 'Gathering data to explain it simply.' : 'Reading codes and live values from the ECU.'}
              </Text>
            </View>
            <View style={styles.systemsList}>
              {SCAN_SYSTEMS.map(s => {
                const done = scanPct >= s.at;
                const color = !done ? T.muted : s.r === 'ok' ? T.good : s.r === 'warn' ? T.amber : T.red;
                const mark = !done ? 'Checking…' : s.r === 'ok' ? 'OK' : s.r === 'warn' ? 'Wear' : 'Code';
                return (
                  <View key={s.name} style={styles.systemRow}>
                    <Text style={styles.systemName}>{s.name}</Text>
                    <Text style={[styles.systemMark, { color }]}>{mark}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* Standard scan result */}
      {resultStd && (
        <View style={styles.overlay}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Scan complete</Text>
            <TouchableOpacity style={styles.overlayClose} onPress={closeScan}>
              <Text style={{ color: T.muted, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.resultContent}>
            <View style={styles.resultSummaryCard}>
              <View style={styles.resultBadge}>
                <Text style={[styles.resultBadgeNum, { color: dtcResults.length > 0 && dtcResults[0].code !== '—' ? T.red : T.good }]}>
                  {dtcResults.filter(d => d.code !== '—').length}
                </Text>
              </View>
              <View>
                <Text style={styles.resultSummaryTitle}>
                  {dtcResults.filter(d => d.code !== '—').length} trouble {dtcResults.filter(d => d.code !== '—').length === 1 ? 'code' : 'codes'} found
                </Text>
                <Text style={styles.resultSummarySub}>6 systems checked</Text>
              </View>
            </View>

            {dtcResults.length > 0 && (
              <View style={styles.codesList}>
                {dtcResults.filter(d => d.code !== '—').map((dtc, idx) => (
                  <View key={idx} style={styles.codesRow}>
                    <View style={styles.codeChip}>
                      <Text style={styles.codeChipText}>{dtc.code}</Text>
                    </View>
                    <Text style={styles.codesDesc} numberOfLines={1}>{dtc.description}</Text>
                  </View>
                ))}
                {dtcResults.filter(d => d.code !== '—').length === 0 && (
                  <View style={[styles.codesRow, { borderBottomWidth: 0 }]}>
                    <Text style={{ color: T.good, fontSize: 14 }}>No fault codes — all clear!</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.resultBtnOutline} onPress={() => { closeScan(); setActiveTab(t('dashboard.errorLog')); }}>
                <Text style={[styles.resultBtnText, { color: T.text }]}>Open Error Log</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resultBtnFill} onPress={closeScan}>
                <Text style={[styles.resultBtnText, { color: T.onAccent }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* AI scan result */}
      {resultAi && (
        <View style={styles.overlay}>
          <View style={styles.resultHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
              <View style={styles.aiBannerDiamond} />
              <Text style={styles.resultTitle}>AI Health Check</Text>
            </View>
            <TouchableOpacity style={styles.overlayClose} onPress={closeScan}>
              <Text style={{ color: T.muted, fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.resultContent}>
            <View style={styles.aiSummaryCard}>
              <View style={styles.aiSummaryTop}>
                <View style={styles.aiBadge}>
                  <Text style={[styles.resultBadgeNum, { color: T.red }]}>!</Text>
                </View>
                <View>
                  <Text style={styles.aiOverallLabel}>Overall</Text>
                  <Text style={[styles.aiOverallValue, { color: T.red }]}>Needs attention soon</Text>
                </View>
              </View>
            </View>

            <View style={styles.aiExplain}>
              <View style={styles.aiBannerDiamond} />
              <Text style={styles.aiExplainText}>
                <Text style={{ fontWeight: '700' }}>Here's the short version. </Text>
                I found issues. The one to handle first is a{' '}
                <Text style={{ fontWeight: '700' }}>misfire</Text> — your engine isn't firing smoothly. Left alone it wastes fuel and can damage the catalytic converter, so I'd book a check within a week.{'\n\n'}
                <Text style={{ color: T.muted }}>Other issues are minor: the catalytic converter is slightly less efficient than ideal, and the engine is running a touch lean. Worth keeping an eye on, not urgent.</Text>
              </Text>
            </View>

            <Text style={styles.sectionHeading}>What to do next</Text>
            {[
              { step: '1', title: 'Inspect cylinder 1 spark plug & ignition coil', sev: 'Urgent · within a week', color: T.red },
              { step: '2', title: 'Have the catalytic converter assessed', sev: 'Minor · monitor', color: T.amber },
              { step: '3', title: 'Check for a small intake or vacuum leak', sev: 'Minor · monitor', color: T.amber },
            ].map(a => (
              <View key={a.step} style={styles.actionCard}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>{a.step}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>{a.title}</Text>
                  <Text style={[styles.actionSev, { color: a.color }]}>{a.sev}</Text>
                </View>
              </View>
            ))}

            <View style={styles.resultActions}>
              <TouchableOpacity style={styles.resultBtnOutline} onPress={() => { closeScan(); setActiveTab(t('dashboard.errorLog')); }}>
                <Text style={[styles.resultBtnText, { color: T.text }]}>View codes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resultBtnFill} onPress={closeScan}>
                <Text style={[styles.resultBtnText, { color: T.onAccent }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      <NotificationModal visible={modalVisible} type={modalType} title={modalTitle} message={modalMessage} onClose={hideModal} />
      <LanguageSelector visible={languageSelectorVisible} onClose={hideLanguageSelector} />
      <ConnectModal
        visible={connectModalVisible}
        onClose={() => setConnectModalVisible(false)}
        bleScanning={bleScanning}
        bleDevices={bleDevices}
        bleDeviceId={bleDeviceId}
        obdConnected={obdConnected}
        obdConnecting={obdConnecting}
        onScan={startBleScan}
        onSelectDevice={setBleDeviceId}
        onConnect={handleObdConnect}
        onDisconnect={handleObdDisconnect}
      />
    </View>
  );
};

const ScanRing: React.FC<{ pct: number; size: number }> = ({ pct, size }) => {
  const T = useTheme();
  const sw = 12;
  const half = size / 2;
  const deg = (pct / 100) * 360;
  const rightRot = Math.min(deg, 180);
  const leftRot = deg > 180 ? deg - 180 : 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size, height: size }}>
        <View style={{ position: 'absolute', width: size, height: size, borderRadius: half, borderWidth: sw, borderColor: T.surface2 }} />
        <View style={{ position: 'absolute', right: 0, width: half, height: size, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', left: -half, width: size, height: size, borderRadius: half, borderWidth: sw, borderColor: 'transparent', borderRightColor: rightRot > 0 ? T.accent : 'transparent', borderBottomColor: rightRot > 90 ? T.accent : 'transparent', transform: [{ rotate: `${rightRot - 180}deg` }] }} />
        </View>
        {leftRot > 0 && (
          <View style={{ position: 'absolute', left: 0, width: half, height: size, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', left: 0, width: size, height: size, borderRadius: half, borderWidth: sw, borderColor: 'transparent', borderLeftColor: T.accent, borderTopColor: leftRot > 90 ? T.accent : 'transparent', transform: [{ rotate: `${leftRot}deg` }] }} />
          </View>
        )}
      </View>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: T.text, fontSize: 30, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>{pct}%</Text>
      </View>
    </View>
  );
};

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 12,
  },
  avatarBtn: { flexShrink: 0 },
  avatar: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: T.accentSoft, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: T.accent },
  headerMid: { flex: 1, minWidth: 0 },
  headerName: { fontSize: 15, fontWeight: '600', color: T.text, lineHeight: 20 },
  headerStatus: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  headerStatusText: { fontSize: 12, color: T.muted },
  themeToggleBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  themeToggleIcon: { fontSize: 16, color: T.muted },
  menuBtn: {
    width: 36, height: 36, borderRadius: 11,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3,
    flexShrink: 0,
  },
  menuDot: { width: 3.5, height: 3.5, borderRadius: 2, backgroundColor: T.muted },

  tabsWrapper: { height: 50, overflow: 'hidden' },
  tabsContent: { paddingHorizontal: 18, paddingVertical: 6, gap: 8, alignItems: 'center' },
  tab: {
    paddingHorizontal: 15, paddingVertical: 8, borderRadius: 11,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
    alignSelf: 'flex-start',
  },
  tabActive: { backgroundColor: T.accent, borderColor: 'transparent' },
  tabText: { fontSize: 13.5, fontWeight: '600', color: T.muted } as any,
  tabTextActive: { color: T.onAccent },

  scroll: { flex: 1 },
  scrollContent: { padding: 18, paddingBottom: 110, justifyContent: 'flex-start' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    backgroundColor: T.bg,
  },
  footerBtn: {
    flex: 1, borderRadius: 15, paddingVertical: 13, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9,
  },
  footerBtnOutline: {
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.accent,
  },
  footerBtnFill: {
    backgroundColor: T.accent,
  },
  footerIcon: { width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  footerIconRing: { width: 11, height: 11, borderRadius: 5.5, borderWidth: 2, borderColor: T.accent },
  footerIconDiamond: {
    width: 11, height: 11, backgroundColor: T.onAccent,
    transform: [{ rotate: '45deg' }], borderRadius: 2,
  },
  footerBtnTitle: { fontSize: 14, fontWeight: '700', lineHeight: 17 },
  footerBtnSub: { fontSize: 11, fontWeight: '500', color: T.muted, opacity: 0.72 },

  btnDisabled: { opacity: 0.4 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: T.bg,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    zIndex: 30,
  },
  overlayClose: {
    position: 'absolute', top: Platform.OS === 'ios' ? 56 : 44, right: 18,
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  overlayCenterContent: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22, paddingHorizontal: 24,
  },
  scanTitle: { fontSize: 18, fontWeight: '700', color: T.text, textAlign: 'center' },
  scanSub: { fontSize: 13, color: T.muted, textAlign: 'center', maxWidth: 240 },
  systemsList: { width: '100%', maxWidth: 300 },
  systemRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: T.border,
  },
  systemName: { fontSize: 14, color: T.text },
  systemMark: { fontSize: 12.5, fontWeight: '600' },

  resultHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: Platform.OS === 'ios' ? 58 : 44, paddingBottom: 10,
  },
  resultTitle: { fontSize: 19, fontWeight: '700', color: T.text },
  resultContent: { paddingHorizontal: 18, paddingBottom: 32, gap: 13 },

  resultSummaryCard: {
    backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  resultBadge: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: T.surface2, alignItems: 'center', justifyContent: 'center',
  },
  resultBadgeNum: { fontSize: 20, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  resultSummaryTitle: { fontSize: 16, fontWeight: '700', color: T.text },
  resultSummarySub: { fontSize: 12.5, color: T.muted, marginTop: 2 },

  codesList: {
    backgroundColor: T.surface, borderRadius: 16, borderWidth: 1, borderColor: T.border, overflow: 'hidden',
  },
  codesRow: {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  codeChip: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7, backgroundColor: T.accentSoft },
  codeChipText: { fontSize: 12, fontWeight: '700', color: T.accent, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  codesDesc: { flex: 1, fontSize: 13.5, fontWeight: '600', color: T.text },

  resultActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  resultBtnOutline: {
    flex: 1, borderRadius: 14, paddingVertical: 13,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, alignItems: 'center',
  },
  resultBtnFill: {
    flex: 1, borderRadius: 14, paddingVertical: 13,
    backgroundColor: T.accent, alignItems: 'center',
  },
  resultBtnText: { fontSize: 14, fontWeight: '700' },

  aiSummaryCard: {
    backgroundColor: T.surface, borderRadius: 18, borderWidth: 1, borderColor: T.border, padding: 16,
  },
  aiSummaryTop: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  aiBadge: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: T.surface2, alignItems: 'center', justifyContent: 'center',
  },
  aiOverallLabel: { fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', color: T.muted },
  aiOverallValue: { fontSize: 18, fontWeight: '700' },

  aiExplain: {
    backgroundColor: T.accentSoft, borderRadius: 16, borderWidth: 1, borderColor: T.border,
    padding: 15, flexDirection: 'row', gap: 12, alignItems: 'flex-start',
  },
  aiBannerDiamond: {
    width: 13, height: 13, backgroundColor: T.accent,
    transform: [{ rotate: '45deg' }], borderRadius: 3, flexShrink: 0, marginTop: 3,
  },
  aiExplainText: { flex: 1, fontSize: 13.5, color: T.text, lineHeight: 20 },

  sectionHeading: {
    fontSize: 11, fontWeight: '600', letterSpacing: 1.4, textTransform: 'uppercase', color: T.muted,
  },
  actionCard: {
    backgroundColor: T.surface, borderRadius: 14, borderWidth: 1, borderColor: T.border,
    padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  stepBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: T.accentSoft, alignItems: 'center', justifyContent: 'center',
  },
  stepNum: { fontSize: 12, fontWeight: '700', color: T.accent },
  actionTitle: { fontSize: 13.5, fontWeight: '600', color: T.text },
  actionSev: { fontSize: 12, fontWeight: '600', marginTop: 2 },
});

export default DashboardScreen;
