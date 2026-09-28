import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NAV_ICONS = {
  ExamList: require('../../assets/icons/nav-exams.png'),
  Leaderboard: require('../../assets/icons/nav-rankings.png'),
  Notifications: require('../../assets/icons/nav-alerts.png'),
  Profile: require('../../assets/icons/nav-profile.png'),
};

export default function BottomNavBar({ activeScreen, navigation, unreadNotifCount = 0 }) {
  const insets = useSafeAreaInsets();

  const tabs = [
    {
      name: 'ExamList',
      label: 'Exams',
      iconAsset: NAV_ICONS.ExamList,
      onPress: () => navigation.navigate('ExamList'),
    },
    {
      name: 'Leaderboard',
      label: 'Rankings',
      iconAsset: NAV_ICONS.Leaderboard,
      onPress: () => navigation.navigate('Leaderboard', { examId: 'exam_101', examTitle: 'Full-Stack MERN Architecture Assessment' }),
    },
    {
      name: 'Notifications',
      label: 'Alerts',
      iconAsset: NAV_ICONS.Notifications,
      badge: unreadNotifCount,
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      name: 'Profile',
      label: 'Profile',
      iconAsset: NAV_ICONS.Profile,
      onPress: () => navigation.navigate('Profile'),
    },
  ];

  return (
    <View
      style={[
        styles.navContainer,
        {
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 8),
        },
      ]}
    >
      <View style={styles.tabRow}>
        {tabs.map((tab) => {
          const isActive = activeScreen === tab.name;
          return (
            <TouchableOpacity
              key={tab.name}
              activeOpacity={0.7}
              onPress={tab.onPress}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
            >
              <View style={styles.iconWrapper}>
                <Image
                  source={tab.iconAsset}
                  style={[
                    styles.tabIconImage,
                    { tintColor: isActive ? '#4F46E5' : '#64748B' },
                  ]}
                  resizeMode="contain"
                />
                {tab.badge > 0 && (
                  <View style={styles.badgeBox}>
                    <Text style={styles.badgeText}>
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 48,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: '#EEF2FF',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
  },
  tabIconImage: {
    width: 22,
    height: 22,
  },
  badgeBox: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
    fontFamily: 'Inter_500Medium',
  },
  tabLabelActive: {
    color: '#4F46E5',
    fontWeight: '800',
    fontFamily: 'Inter_700Bold',
  },
});
