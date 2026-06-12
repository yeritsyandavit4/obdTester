import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface ProfileAvatarProps {
  firstName: string;
  lastName: string;
  imageUri: string | null;
  size?: number;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ firstName, lastName, imageUri, size = 44 }) => {
  const T = useTheme();
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || '?';
  const containerStyle = { width: size, height: size, borderRadius: size / 2 };
  const textSize = size * 0.38;

  if (imageUri) {
    return <Image source={{ uri: imageUri }} style={[styles.image, containerStyle]} />;
  }

  return (
    <View style={[styles.initialsContainer, containerStyle, { backgroundColor: T.accentSoft, borderWidth: 2, borderColor: T.accent }]}>
      <Text style={[styles.initialsText, { fontSize: textSize, color: T.accent }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  image: { resizeMode: 'cover' },
  initialsContainer: { alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontWeight: '800' },
});

export default ProfileAvatar;
