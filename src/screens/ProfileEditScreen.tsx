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
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useObdStore } from '../store/obdStore';
import ProfileAvatar from '../components/ProfileAvatar';
import DInput from '../components/DInput';
import { profileSchema, ProfileFormData } from '../validation/profileSchema';
import { useTheme, ThemeColors } from '../theme';

const TOKEN_KEY = '@obd_access_token';

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: T.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 18, color: T.muted, fontWeight: '500', lineHeight: 18, includeFontPadding: false, textAlignVertical: 'center' } as any,
  topBarTitle: { fontSize: 17, fontWeight: '700', color: T.text },
  topBarSpacer: { width: 40 },

  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 },

  avatarSection: { alignItems: 'center', marginBottom: 36 },
  avatarWrap: { position: 'relative' },
  cameraIcon: {
    position: 'absolute', bottom: 2, right: 2,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: T.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: T.bg,
  },
  cameraIconText: { fontSize: 14, color: T.onAccent, fontWeight: '700', lineHeight: 16 },

  photoActions: { flexDirection: 'row', marginTop: 14, gap: 8 },
  photoActionBtn: {
    paddingVertical: 7, paddingHorizontal: 16,
    borderRadius: 10, backgroundColor: T.surface,
    borderWidth: 1, borderColor: T.border,
  },
  photoActionText: { fontSize: 13, fontWeight: '600', color: T.accent },
  removeBtn: { borderColor: T.red },
  removeText: { color: T.red },

  divider: { height: 1, backgroundColor: T.border, marginBottom: 24 },

  formSection: { gap: 0 },

  saveBtn: {
    backgroundColor: T.accent, borderRadius: 16,
    paddingVertical: 18, alignItems: 'center', marginBottom: 12,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: { color: T.onAccent, fontSize: 17, fontWeight: '700' },

  signOutBtn: {
    borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    borderWidth: 1.5, borderColor: T.red, backgroundColor: T.surface,
  },
  signOutBtnText: { color: T.red, fontSize: 16, fontWeight: '700' },
});

const ProfileEditScreen: React.FC = () => {
  const { t } = useTranslation();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const {
    isDarkMode,
    userFirstName, userLastName, userProfileImage,
    setUserFirstName, setUserLastName, setUserProfileImage,
    setProfileEditVisible, logout,
  } = useObdStore();

  const [imageUri, setImageUri] = useState<string | null>(userProfileImage);

  const { control, handleSubmit, watch, formState: { isValid } } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: { firstName: userFirstName, lastName: userLastName },
    mode: 'onChange',
  });

  const watchFirstName = watch('firstName');
  const watchLastName = watch('lastName');

  const handlePickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, maxWidth: 512, maxHeight: 512 });
    if (result.assets?.[0]?.uri) setImageUri(result.assets[0].uri);
  };

  const handleRemovePhoto = () => setImageUri(null);

  const onSubmit = (data: ProfileFormData) => {
    setUserFirstName(data.firstName.trim());
    setUserLastName(data.lastName.trim());
    setUserProfileImage(imageUri);
    setProfileEditVisible(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      t('profile.signOutTitle'),
      t('profile.signOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('profile.signOut'), style: 'destructive', onPress: async () => { await AsyncStorage.removeItem(TOKEN_KEY); logout(); } },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={T.bg} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>

        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setProfileEditVisible(false)} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>{t('profile.editProfile')}</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85} style={styles.avatarWrap}>
              <ProfileAvatar firstName={watchFirstName} lastName={watchLastName} imageUri={imageUri} size={100} />
              <View style={styles.cameraIcon}>
                <Text style={styles.cameraIconText}>+</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.photoActions}>
              <TouchableOpacity onPress={handlePickImage} style={styles.photoActionBtn}>
                <Text style={styles.photoActionText}>{t('profile.changePhoto')}</Text>
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity onPress={handleRemovePhoto} style={[styles.photoActionBtn, styles.removeBtn]}>
                  <Text style={[styles.photoActionText, styles.removeText]}>{t('profile.removePhoto')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.formSection}>
            <DInput<ProfileFormData>
              name="firstName" control={control}
              label={t('profile.firstName')} placeholder={t('profile.firstNamePlaceholder')}
              autoCapitalize="words" autoCorrect={false}
            />
            <DInput<ProfileFormData>
              name="lastName" control={control}
              label={t('profile.lastName')} placeholder={t('profile.lastNamePlaceholder')}
              autoCapitalize="words" autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, !isValid && styles.saveBtnDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={!isValid}
            activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>{t('profile.save')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.7}>
            <Text style={styles.signOutBtnText}>{t('profile.signOut')}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ProfileEditScreen;
