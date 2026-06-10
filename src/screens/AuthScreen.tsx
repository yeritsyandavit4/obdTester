import React, { useState } from 'react';
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
import {
  loginSchema,
  registerSchema,
  LoginFormData,
  RegisterFormData,
} from '../validation/authSchema';

const TOKEN_KEY = '@obd_access_token';

const AuthScreen: React.FC = () => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    setAccessToken,
    setAuthEmail,
    setIsAuthenticated,
    setUserFirstName,
    setUserLastName,
    setProfileSetupComplete,
    languageSelectorVisible,
    showLanguageSelector,
    hideLanguageSelector,
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

  const handleAuthSuccess = async (
    accessToken: string,
    email: string,
    firstName?: string,
    lastName?: string,
  ) => {
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    setAccessToken(accessToken);
    setAuthEmail(email);
    if (firstName) { setUserFirstName(firstName); }
    if (lastName) { setUserLastName(lastName); }
    setProfileSetupComplete(true);
    setIsAuthenticated(true);
  };

  const onLogin = async (data: LoginFormData) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authLogin(data.email, data.password);
      // Use firstName/lastName from API response if the backend returns them
      await handleAuthSuccess(
        res.accessToken,
        res.user.email,
        res.user.firstName,
        res.user.lastName,
      );
    } catch (e: any) {
      setErrorMsg(e?.message ?? t('auth.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async (data: RegisterFormData) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authRegister(data.firstName, data.lastName, data.email, data.password);
      await handleAuthSuccess(
        res.accessToken,
        res.user.email,
        res.user.firstName ?? data.firstName,
        res.user.lastName ?? data.lastName,
      );
    } catch (e: any) {
      setErrorMsg(e?.message ?? t('auth.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F7" />

      <View style={styles.topBar}>
        <View style={styles.placeholder} />
        <TouchableOpacity style={styles.languageBtn} onPress={showLanguageSelector}>
          <Text style={styles.languageBtnText}>⊕</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">

          {/* Logo / title */}
          <View style={styles.topSection}>
            <Text style={styles.logo}>◈</Text>
            <Text style={styles.appName}>OBD Scanner</Text>
            <Text style={styles.tagline}>{t('auth.tagline')}</Text>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
              onPress={() => { setTab('login'); setErrorMsg(null); }}>
              <Text style={[styles.tabBtnText, tab === 'login' && styles.tabBtnTextActive]}>
                {t('auth.login')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]}
              onPress={() => { setTab('register'); setErrorMsg(null); }}>
              <Text style={[styles.tabBtnText, tab === 'register' && styles.tabBtnTextActive]}>
                {t('auth.register')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error banner */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Login form */}
          {tab === 'login' && (
            <View style={styles.form}>
              <DInput<LoginFormData>
                name="email"
                control={loginForm.control}
                label={t('auth.email')}
                placeholder={t('auth.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <DInput<LoginFormData>
                name="password"
                control={loginForm.control}
                label={t('auth.password')}
                placeholder={t('auth.passwordPlaceholder')}
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.primaryBtn, (!loginForm.formState.isValid || loading) && styles.primaryBtnDisabled]}
                onPress={loginForm.handleSubmit(onLogin)}
                disabled={!loginForm.formState.isValid || loading}
                activeOpacity={0.8}>
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.primaryBtnText}>{t('auth.loginBtn')}</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Register form */}
          {tab === 'register' && (
            <View style={styles.form}>
              <DInput<RegisterFormData>
                name="firstName"
                control={registerForm.control}
                label={t('profile.firstName')}
                placeholder={t('profile.firstNamePlaceholder')}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <DInput<RegisterFormData>
                name="lastName"
                control={registerForm.control}
                label={t('profile.lastName')}
                placeholder={t('profile.lastNamePlaceholder')}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <DInput<RegisterFormData>
                name="email"
                control={registerForm.control}
                label={t('auth.email')}
                placeholder={t('auth.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <DInput<RegisterFormData>
                name="password"
                control={registerForm.control}
                label={t('auth.password')}
                placeholder={t('auth.passwordPlaceholder')}
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.primaryBtn, (!registerForm.formState.isValid || loading) && styles.primaryBtnDisabled]}
                onPress={registerForm.handleSubmit(onRegister)}
                disabled={!registerForm.formState.isValid || loading}
                activeOpacity={0.8}>
                {loading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.primaryBtnText}>{t('auth.registerBtn')}</Text>}
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      <LanguageSelector visible={languageSelectorVisible} onClose={hideLanguageSelector} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 8,
  },
  placeholder: {
    width: 40,
  },
  languageBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  languageBtnText: {
    fontSize: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 52,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#1a1a1a',
  },
  tabBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#888',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  errorBanner: {
    backgroundColor: '#FFEBE9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorBannerText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  form: {
    gap: 0,
  },
  primaryBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default AuthScreen;
