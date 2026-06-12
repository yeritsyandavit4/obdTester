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
  vinReading: boolean;
  
  // Live data
  obdRpm: number | null;
  obdSpeedKmh: number | null;
  
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
  setVinReading: (reading: boolean) => void;
  
  setObdRpm: (rpm: number | null) => void;
  setObdSpeedKmh: (speed: number | null) => void;
  
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
  vinReading: false,
  
  obdRpm: null,
  obdSpeedKmh: null,
  
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
  setVinReading: (reading) => set({ vinReading: reading }),
  
  setObdRpm: (rpm) => set({ obdRpm: rpm }),
  setObdSpeedKmh: (speed) => set({ obdSpeedKmh: speed }),
  
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
    dtcResults: [],
    livePolling: false,
  }),
}));
