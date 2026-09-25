import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export default function Skeleton({ width = '100%', height = 20, borderRadius = 6, style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ExamCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.rowBetween}>
        <Skeleton width={100} height={20} borderRadius={6} />
        <Skeleton width={60} height={20} borderRadius={6} />
      </View>
      <View style={{ marginVertical: 12 }}>
        <Skeleton width="80%" height={22} borderRadius={4} />
      </View>
      <View style={{ marginVertical: 6 }}>
        <Skeleton width="95%" height={14} borderRadius={4} />
      </View>
      <View style={[styles.rowBetween, { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
        <Skeleton width={70} height={16} />
        <Skeleton width={80} height={16} />
        <Skeleton width={70} height={16} />
      </View>
      <View style={{ marginTop: 14 }}>
        <Skeleton width="100%" height={40} borderRadius={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#CBD5E1',
  },
  cardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
