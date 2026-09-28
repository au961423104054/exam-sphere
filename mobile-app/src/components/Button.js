import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';

export default function Button({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  icon,
  iconRight,
  style,
  textStyle,
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          btn: styles.primaryBtn,
          text: styles.lightText,
          spinner: '#FFFFFF',
        };
      case 'accent':
        return {
          btn: styles.accentBtn,
          text: styles.lightText,
          spinner: '#FFFFFF',
        };
      case 'secondary':
        return {
          btn: styles.secondaryBtn,
          text: styles.darkText,
          spinner: '#1E293B',
        };
      case 'outline':
        return {
          btn: styles.outlineBtn,
          text: styles.outlineText,
          spinner: '#4F46E5',
        };
      case 'ghost':
        return {
          btn: styles.ghostBtn,
          text: styles.ghostText,
          spinner: '#4F46E5',
        };
      case 'danger':
        return {
          btn: styles.dangerBtn,
          text: styles.lightText,
          spinner: '#FFFFFF',
        };
      case 'success':
        return {
          btn: styles.successBtn,
          text: styles.lightText,
          spinner: '#FFFFFF',
        };
      case 'warning':
        return {
          btn: styles.warningBtn,
          text: styles.darkText,
          spinner: '#92400E',
        };
      default:
        return {
          btn: styles.primaryBtn,
          text: styles.lightText,
          spinner: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { minHeight: 38, paddingVertical: 8, paddingHorizontal: 14, fontSize: 13 };
      case 'lg':
        return { minHeight: 52, paddingVertical: 14, paddingHorizontal: 22, fontSize: 16 };
      case 'md':
      default:
        return { minHeight: 46, paddingVertical: 12, paddingHorizontal: 18, fontSize: 14 };
    }
  };

  const v = getVariantStyles();
  const s = getSizeStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.baseButton,
        { minHeight: s.minHeight, paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal },
        v.btn,
        disabled && styles.disabledBtn,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.spinner} size="small" />
      ) : (
        <View style={styles.contentRow}>
          {icon ? <View style={styles.iconLeft}>{icon}</View> : null}
          <Text style={[styles.baseText, { fontSize: s.fontSize }, v.text, textStyle]}>
            {title}
          </Text>
          {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseButton: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontWeight: '700',
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: -0.2,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  primaryBtn: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  accentBtn: {
    backgroundColor: '#0D9488',
    shadowColor: '#0D9488',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  outlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  ghostBtn: {
    backgroundColor: 'transparent',
  },
  dangerBtn: {
    backgroundColor: '#EF4444',
  },
  successBtn: {
    backgroundColor: '#10B981',
  },
  warningBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  disabledBtn: {
    opacity: 0.45,
  },
  lightText: {
    color: '#FFFFFF',
  },
  darkText: {
    color: '#1E293B',
  },
  outlineText: {
    color: '#334155',
  },
  ghostText: {
    color: '#4F46E5',
  },
});
