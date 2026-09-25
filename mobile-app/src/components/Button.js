import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  const isPrimary = variant === 'primary';
  const isSuccess = variant === 'success';
  const isDanger = variant === 'danger';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        isPrimary && styles.primaryButton,
        isSuccess && styles.successButton,
        isDanger && styles.dangerButton,
        !isPrimary && !isSuccess && !isDanger && styles.secondaryButton,
        disabled && styles.disabledButton,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary || isSuccess || isDanger ? '#FFFFFF' : '#1E293B'} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            (isPrimary || isSuccess || isDanger) ? styles.lightText : styles.darkText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
  },
  successButton: {
    backgroundColor: '#16A34A',
  },
  dangerButton: {
    backgroundColor: '#DC2626',
  },
  secondaryButton: {
    backgroundColor: '#F1F5F9',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  lightText: {
    color: '#FFFFFF',
  },
  darkText: {
    color: '#1E293B',
  },
});
