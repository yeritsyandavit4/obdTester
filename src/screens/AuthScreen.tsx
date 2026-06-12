import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useTranslation } from 'react-i18next';
import { useObdStore } from '../store/obdStore';
import DInput from '../components/DInput';
import LanguageSelector from '../components/LanguageSelector';
import { authLogin, authRegister } from '../services/authService';
import { loginSchema, registerSchema, LoginFormData, RegisterFormData } from '../validation/authSchema';
import { useTheme, ThemeColors } from '../theme';

const TOKEN_KEY = '@obd_access_token';

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 8,
  },
  topBarBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  topBarBtnText: { fontSize: 18, color: T.muted },
  topBarRight: { flexDirection: 'row', gap: 8 },

  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },

  topSection: { alignItems: 'center', marginBottom: 32 },
  logoWrap: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: T.accentSoft, borderWidth: 1.5, borderColor: T.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  logoIcon: { fontSize: 30, color: T.accent },
  appName: { fontSize: 28, fontWeight: '800', color: T.text, marginBottom: 6 },
  tagline: { fontSize: 14, color: T.muted, textAlign: 'center' },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: T.surface,
    borderRadius: 16, padding: 4, marginBottom: 24,
    borderWidth: 1, borderColor: T.border,
  },
  tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  tabBtnActive: { backgroundColor: T.accent },
  tabBtnText: { fontSize: 15, fontWeight: '700', color: T.muted },
  tabBtnTextActive: { color: T.onAccent },

  errorBanner: {
    backgroundColor: T.surface, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20,
    borderWidth: 1, borderColor: T.red, flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  errorDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: T.red, flexShrink: 0 },
  errorBannerText: { color: T.red, fontSize: 13, fontWeight: '500', flex: 1 },

  form: { gap: 0 },

  primaryBtn: {
    backgroundColor: T.accent, borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 8,
  },
  primaryBtnDisabled: { opacity: 0.4 },
  primaryBtnText: { color: T.onAccent, fontSize: 17, fontWeight: '700' },

  guestSection: { marginTop: 28, alignItems: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 20 },
  divider: { flex: 1, height: 1, backgroundColor: T.border },
  dividerText: { marginHorizontal: 12, fontSize: 13, color: T.muted, fontWeight: '500' },

  guestBtn: {
    borderWidth: 1.5, borderColor: T.border,
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32,
    alignItems: 'center', width: '100%',
    backgroundColor: T.surface,
  },
  guestBtnText: { color: T.text, fontSize: 16, fontWeight: '700' },
  guestNote: { marginTop: 10, fontSize: 12, color: T.muted, textAlign: 'center' },
});

const AuthScreen: React.FC = () => {
  const { t } = useTranslation();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    isDarkMode, toggleTheme,
    setAccessToken, setAuthEmail, setIsAuthenticated,
    setUserFirstName, setUserLastName, setProfileSetupComplete,
    enterGuestMode,
    languageSelectorVisible, showLanguageSelector, hideLanguageSelector,
  } = useObdStore();

  const loginForm = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
    mode: 'onChange',
  });

  const handleAuthSuccess = async (accessToken: string, email: string, firstName?: string, lastName?: string) => {
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    setAccessToken(accessToken);
    setAuthEmail(email);
    if (firstName) setUserFirstName(firstName);
    if (lastName) setUserLastName(lastName);
    setProfileSetupComplete(true);
    setIsAuthenticated(true);
  };

  const onLogin = async (data: LoginFormData) => {
    setLoading(true); setErrorMsg(null);
    try {
      const res = await authLogin(data.email, data.password);
      await handleAuthSuccess(res.accessToken, res.user.email, res.user.firstName, res.user.lastName);
    } catch (e: any) {
      setErrorMsg(e?.message ?? t('auth.errorGeneric'));
    } finally { setLoading(false); }
  };

  const onRegister = async (data: RegisterFormData) => {
    setLoading(true); setErrorMsg(null);
    try {
      const res = await authRegister(data.firstName, data.lastName, data.email, data.password);
      await handleAuthSuccess(res.accessToken, res.user.email, res.user.firstName ?? data.firstName, res.user.lastName ?? data.lastName);
    } catch (e: any) {
      setErrorMsg(e?.message ?? t('auth.errorGeneric'));
    } finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={T.bg} />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.topBarBtn} onPress={toggleTheme} activeOpacity={0.7}>
          <Text style={styles.topBarBtnText}>{isDarkMode ? '☀' : '☾'}</Text>
        </TouchableOpacity>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.topBarBtn} onPress={showLanguageSelector} activeOpacity={0.7}>
            <Text style={styles.topBarBtnText}>⊕</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={styles.topSection}>
            <View style={styles.logoWrap}>
              <Text style={styles.logoIcon}>◈</Text>
            </View>
            <Text style={styles.appName}>OBD Scanner</Text>
            <Text style={styles.tagline}>{t('auth.tagline')}</Text>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
              onPress={() => { setTab('login'); setErrorMsg(null); }}>
              <Text style={[styles.tabBtnText, tab === 'login' && styles.tabBtnTextActive]}>{t('auth.login')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]}
              onPress={() => { setTab('register'); setErrorMsg(null); }}>
              <Text style={[styles.tabBtnText, tab === 'register' && styles.tabBtnTextActive]}>{t('auth.register')}</Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <View style={styles.errorDot} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          ) : null}

          {tab === 'login' && (
            <View style={styles.form}>
              <DInput<LoginFormData>
                name="email" control={loginForm.control}
                label={t('auth.email')} placeholder={t('auth.emailPlaceholder')}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              />
              <DInput<LoginFormData>
                name="password" control={loginForm.control}
                label={t('auth.password')} placeholder={t('auth.passwordPlaceholder')}
                secureTextEntry autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.primaryBtn, (!loginForm.formState.isValid || loading) && styles.primaryBtnDisabled]}
                onPress={loginForm.handleSubmit(onLogin)}
                disabled={!loginForm.formState.isValid || loading}
                activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator color={T.onAccent} size="small" />
                  : <Text style={styles.primaryBtnText}>{t('auth.loginBtn')}</Text>}
              </TouchableOpacity>
            </View>
          )}

          {tab === 'register' && (
            <View style={styles.form}>
              <DInput<RegisterFormData>
                name="firstName" control={registerForm.control}
                label={t('profile.firstName')} placeholder={t('profile.firstNamePlaceholder')}
                autoCapitalize="words" autoCorrect={false}
              />
              <DInput<RegisterFormData>
                name="lastName" control={registerForm.control}
                label={t('profile.lastName')} placeholder={t('profile.lastNamePlaceholder')}
                autoCapitalize="words" autoCorrect={false}
              />
              <DInput<RegisterFormData>
                name="email" control={registerForm.control}
                label={t('auth.email')} placeholder={t('auth.emailPlaceholder')}
                keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
              />
              <DInput<RegisterFormData>
                name="password" control={registerForm.control}
                label={t('auth.password')} placeholder={t('auth.passwordPlaceholder')}
                secureTextEntry autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.primaryBtn, (!registerForm.formState.isValid || loading) && styles.primaryBtnDisabled]}
                onPress={registerForm.handleSubmit(onRegister)}
                disabled={!registerForm.formState.isValid || loading}
                activeOpacity={0.85}>
                {loading
                  ? <ActivityIndicator color={T.onAccent} size="small" />
                  : <Text style={styles.primaryBtnText}>{t('auth.registerBtn')}</Text>}
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.guestSection}>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>
            <TouchableOpacity style={styles.guestBtn} onPress={enterGuestMode} activeOpacity={0.7}>
              <Text style={styles.guestBtnText}>{t('auth.continueAsGuest')}</Text>
            </TouchableOpacity>
            <Text style={styles.guestNote}>{t('auth.guestNote')}</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <LanguageSelector visible={languageSelectorVisible} onClose={hideLanguageSelector} />
    </View>
  );
};

export default AuthScreen;
