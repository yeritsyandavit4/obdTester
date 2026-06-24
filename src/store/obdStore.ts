import { create } from 'zustand';

interface DtcResult {
  code: string;
  description: string;
}

interface ObdState {
  // Auth
  accessToken: string | null;
  authEmail: string;
  isAuthenticated: boolean;
  authLoading: boolean;
  isGuest: boolean;

  // Connection
  obdHost: string;
  obdPort: string;
  bleDeviceId: string;
  bleServiceUUID: string;
  bleRxCharUUID: string;
  bleTxCharUUID: string;
  obdConnected: boolean;
  obdConnecting: boolean;
  obdLastResponse: string;
  
  // Vehicle info
  vehicleVin: string | null;
  vehicleMake: string;
  vehicleDisplacementL: number | null;
  vinReading: boolean;
  
  // Live data
  obdRpm: number | null;
  obdSpeedKmh: number | null;
  obdCoolantC: number | null;
  obdThrottlePct: number | null;
  obdIntakeC: number | null;
  obdEngineLoadPct: number | null;
  obdVoltage: number | null;
  obdMafGs: number | null;
  obdFuelRateLh: number | null;
  obdFuelLevelPct: number | null;
  obdMapKpa: number | null;
  obdSupportedPids: string[];

  // DTC
  dtcResults: DtcResult[];
  dtcScanning: boolean;
  
  // UI state
  livePolling: boolean;
  showSettings: boolean;
  activeTab: string;
  isDarkMode: boolean;
  
  // Modal notification
  modalVisible: boolean;
  modalType: 'success' | 'error' | 'info';
  modalTitle: string;
  modalMessage: string;
  
  // Language selector
  languageSelectorVisible: boolean;
  
  // User profile
  userFirstName: string;
  userLastName: string;
  userProfileImage: string | null;
  profileSetupComplete: boolean;
  profileEditVisible: boolean;
  
  // Actions
  setObdHost: (host: string) => void;
  setObdPort: (port: string) => void;
  setBleDeviceId: (id: string) => void;
  setBleServiceUUID: (uuid: string) => void;
  setBleRxCharUUID: (uuid: string) => void;
  setBleTxCharUUID: (uuid: string) => void;
  setObdConnected: (connected: boolean) => void;
  setObdConnecting: (connecting: boolean) => void;
  setObdLastResponse: (response: string) => void;
  
  setVehicleVin: (vin: string | null) => void;
  setVehicleMake: (make: string) => void;
  setVehicleDisplacementL: (v: number | null) => void;
  setVinReading: (reading: boolean) => void;
  
  setObdRpm: (rpm: number | null) => void;
  setObdSpeedKmh: (speed: number | null) => void;
  setObdCoolantC: (v: number | null) => void;
  setObdThrottlePct: (v: number | null) => void;
  setObdIntakeC: (v: number | null) => void;
  setObdEngineLoadPct: (v: number | null) => void;
  setObdVoltage: (v: number | null) => void;
  setObdMafGs: (v: number | null) => void;
  setObdFuelRateLh: (v: number | null) => void;
  setObdFuelLevelPct: (v: number | null) => void;
  setObdMapKpa: (v: number | null) => void;
  setObdSupportedPids: (pids: string[]) => void;

  setDtcResults: (results: DtcResult[]) => void;
  setDtcScanning: (scanning: boolean) => void;
  
  setLivePolling: (polling: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
  toggleTheme: () => void;
  
  showModal: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  hideModal: () => void;
  
  showLanguageSelector: () => void;
  hideLanguageSelector: () => void;
  
  setUserFirstName: (name: string) => void;
  setUserLastName: (name: string) => void;
  setUserProfileImage: (uri: string | null) => void;
  setProfileSetupComplete: (complete: boolean) => void;
  setProfileEditVisible: (visible: boolean) => void;

  setAccessToken: (token: string | null) => void;
  setAuthEmail: (email: string) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setAuthLoading: (loading: boolean) => void;
  enterGuestMode: () => void;
  logout: () => void;

  resetConnection: () => void;
}

export const useObdStore = create<ObdState>((set) => ({
  // Auth
  accessToken: null,
  authEmail: '',
  isAuthenticated: false,
  authLoading: true,
  isGuest: false,

  // Initial state
  obdHost: '192.168.0.10',
  obdPort: '35000',
  bleDeviceId: '',
  bleServiceUUID: 'FFE0',
  bleRxCharUUID: 'FFE1',
  bleTxCharUUID: 'FFE1',
  obdConnected: false,
  obdConnecting: false,
  obdLastResponse: '',
  
  vehicleVin: null,
  vehicleMake: 'My Car',
  vehicleDisplacementL: null,
  vinReading: false,
  
  obdRpm: null,
  obdSpeedKmh: null,
  obdCoolantC: null,
  obdThrottlePct: null,
  obdIntakeC: null,
  obdEngineLoadPct: null,
  obdVoltage: null,
  obdMafGs: null,
  obdFuelRateLh: null,
  obdFuelLevelPct: null,
  obdMapKpa: null,
  obdSupportedPids: [],

  dtcResults: [],
  dtcScanning: false,
  
  livePolling: false,
  showSettings: true,
  activeTab: 'Engine',
  isDarkMode: true,
  
  modalVisible: false,
  modalType: 'info',
  modalTitle: '',
  modalMessage: '',
  
  languageSelectorVisible: false,
  
  userFirstName: '',
  userLastName: '',
  userProfileImage: null,
  profileSetupComplete: false,
  profileEditVisible: false,
  
  // Actions
  setObdHost: (host) => set({ obdHost: host }),
  setObdPort: (port) => set({ obdPort: port }),
  setBleDeviceId: (id) => set({ bleDeviceId: id }),
  setBleServiceUUID: (uuid) => set({ bleServiceUUID: uuid }),
  setBleRxCharUUID: (uuid) => set({ bleRxCharUUID: uuid }),
  setBleTxCharUUID: (uuid) => set({ bleTxCharUUID: uuid }),
  setObdConnected: (connected) => set({ obdConnected: connected }),
  setObdConnecting: (connecting) => set({ obdConnecting: connecting }),
  setObdLastResponse: (response) => set({ obdLastResponse: response }),
  
  setVehicleVin: (vin) => set({ vehicleVin: vin }),
  setVehicleMake: (make) => set({ vehicleMake: make }),
  setVehicleDisplacementL: (v) => set({ vehicleDisplacementL: v }),
  setVinReading: (reading) => set({ vinReading: reading }),
  
  setObdRpm: (rpm) => set({ obdRpm: rpm }),
  setObdSpeedKmh: (speed) => set({ obdSpeedKmh: speed }),
  setObdCoolantC: (v) => set({ obdCoolantC: v }),
  setObdThrottlePct: (v) => set({ obdThrottlePct: v }),
  setObdIntakeC: (v) => set({ obdIntakeC: v }),
  setObdEngineLoadPct: (v) => set({ obdEngineLoadPct: v }),
  setObdVoltage: (v) => set({ obdVoltage: v }),
  setObdMafGs: (v) => set({ obdMafGs: v }),
  setObdFuelRateLh: (v) => set({ obdFuelRateLh: v }),
  setObdFuelLevelPct: (v) => set({ obdFuelLevelPct: v }),
  setObdMapKpa: (v) => set({ obdMapKpa: v }),
  setObdSupportedPids: (pids) => set({ obdSupportedPids: pids }),

  setDtcResults: (results) => set({ dtcResults: results }),
  setDtcScanning: (scanning) => set({ dtcScanning: scanning }),
  
  setLivePolling: (polling) => set({ livePolling: polling }),
  setShowSettings: (show) => set({ showSettings: show }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleTheme: () => set(s => ({ isDarkMode: !s.isDarkMode })),
  
  showModal: (type, title, message) => set({
    modalVisible: true,
    modalType: type,
    modalTitle: title,
    modalMessage: message,
  }),
  hideModal: () => set({ modalVisible: false }),
  
  showLanguageSelector: () => set({ languageSelectorVisible: true }),
  hideLanguageSelector: () => set({ languageSelectorVisible: false }),
  
  setUserFirstName: (name) => set({ userFirstName: name }),
  setUserLastName: (name) => set({ userLastName: name }),
  setUserProfileImage: (uri) => set({ userProfileImage: uri }),
  setProfileSetupComplete: (complete) => set({ profileSetupComplete: complete }),
  setProfileEditVisible: (visible) => set({ profileEditVisible: visible }),

  setAccessToken: (token) => set({ accessToken: token }),
  setAuthEmail: (email) => set({ authEmail: email }),
  setIsAuthenticated: (auth) => set({ isAuthenticated: auth }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
  enterGuestMode: () => set({
    isGuest: true,
    isAuthenticated: true,
    profileSetupComplete: true,
    userFirstName: 'Guest',
    userLastName: '',
  }),
  logout: () => set({
    accessToken: null,
    authEmail: '',
    isAuthenticated: false,
    isGuest: false,
    profileSetupComplete: false,
    profileEditVisible: false,
    userFirstName: '',
    userLastName: '',
    userProfileImage: null,
  }),

  resetConnection: () => set({
    obdConnected: false,
    obdLastResponse: '',
    obdRpm: null,
    obdSpeedKmh: null,
    obdCoolantC: null,
    obdThrottlePct: null,
    obdIntakeC: null,
    obdEngineLoadPct: null,
    obdVoltage: null,
    obdMafGs: null,
    obdFuelRateLh: null,
    obdFuelLevelPct: null,
    obdMapKpa: null,
    dtcResults: [],
    livePolling: false,
  }),
}));
