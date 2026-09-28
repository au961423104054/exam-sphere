import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function Badge({
  label,
  children,
  variant = 'default', // 'default' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger'
  style,
  textStyle,
}) {
  const getStyles = () => {
    switch (variant) {
      case 'default':
        return { box: styles.boxDefault, text: styles.textDefault };
      case 'secondary':
        return { box: styles.boxSecondary, text: styles.textSecondary };
      case 'accent':
        return { box: styles.boxAccent, text: styles.textAccent };
      case 'success':
        return { box: styles.boxSuccess, text: styles.textSuccess };
      case 'warning':
        return { box: styles.boxWarning, text: styles.textWarning };
      case 'danger':
        return { box: styles.boxDanger, text: styles.textDanger };
      default:
        return { box: styles.boxDefault, text: styles.textDefault };
    }
  };

  const v = getStyles();

  return (
    <View style={[styles.baseBox, v.box, style]}>
      <Text style={[styles.baseText, v.text, textStyle]}>
        {label || children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  baseBox: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter_600SemiBold',
  },
  boxDefault: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  textDefault: {
    color: '#4F46E5',
  },
  boxSecondary: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  textSecondary: {
    color: '#475569',
  },
  boxAccent: {
    backgroundColor: '#F0FDFA',
    borderColor: '#CCFBF1',
  },
  textAccent: {
    color: '#0D9488',
  },
  boxSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  textSuccess: {
    color: '#065F46',
  },
  boxWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  textWarning: {
    color: '#92400E',
  },
  boxDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  textDanger: {
    color: '#991B1B',
  },
});
