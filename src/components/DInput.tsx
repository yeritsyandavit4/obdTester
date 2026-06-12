import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ThemeColors, useTheme } from '../theme';

interface DInputProps<T extends FieldValues> extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
}

const makeStyles = (T: ThemeColors) => StyleSheet.create({
  container: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: T.surface, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 16, fontSize: 16, color: T.text, borderWidth: 1.5, borderColor: T.border },
  inputError: { borderColor: T.red },
  errorText: { color: T.red, fontSize: 12, fontWeight: '500', marginTop: 6, marginLeft: 4 },
});

function DInput<T extends FieldValues>({ name, control, label, ...textInputProps }: DInputProps<T>) {
  const { t } = useTranslation();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          {label && <Text style={styles.label}>{label}</Text>}
          <TextInput
            style={[styles.input, error && styles.inputError]}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholderTextColor={T.muted2}
            {...textInputProps}
          />
          {error?.message && <Text style={styles.errorText}>{t(error.message)}</Text>}
        </View>
      )}
    />
  );
}

export default DInput;
