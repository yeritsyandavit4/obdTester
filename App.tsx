import React, { useEffect } from 'react';
import { PermissionsAndroid, Platform, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DashboardScreen from './src/screens/DashboardScreen';
import AuthScreen from './src/screens/AuthScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import { useObdStore } from './src/store/obdStore';
import { authGetMe } from './src/services/authService';
import './src/i18n';

const TOKEN_KEY = '@obd_access_token';

export const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 31) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const scanGranted = results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED;
      const connectGranted = results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED;
      const locationGranted = results[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

      return scanGranted && connectGranted && locationGranted;
    } else {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  }

  return true;
};

function App() {
  const {
    isAuthenticated,
    authLoading,
    profileEditVisible,
    setAccessToken,
    setAuthEmail,
    setIsAuthenticated,
    setAuthLoading,
    setProfileSetupComplete,
    setUserFirstName,
    setUserLastName,
    logout,
  } = useObdStore();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          const user = await authGetMe(token);
          setAccessToken(token);
          setAuthEmail(user.email);
          if (user.firstName) { setUserFirstName(user.firstName); }
          if (user.lastName) { setUserLastName(user.lastName); }
          setProfileSetupComplete(true);
          setIsAuthenticated(true);
        }
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
        logout();
      } finally {
        setAuthLoading(false);
      }
    };

    restoreSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  if (profileEditVisible) {
    return <ProfileEditScreen />;
  }

  return <DashboardScreen />;
}

export default App;
