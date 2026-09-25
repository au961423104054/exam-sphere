import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { fetchExams } from '../services/api';
import { ExamCardSkeleton } from '../components/Skeleton';
import {
  fetchNotifications,
  registerForPushNotificationsAsync,
} from '../services/notificationService';

export default function ExamListScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const { activeOrg } = useOrg();
  const [exams, setExams] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadExams = async () => {
    try {
      const data = await fetchExams();
      setExams(data);

      // Load notifications and register push notifications
      const notifs = await fetchNotifications();
      const unread = (notifs || []).filter((n) => !n.read).length;
      setUnreadNotifCount(unread);
      registerForPushNotificationsAsync().catch(() => {});
    } catch (err) {
      console.warn('Failed to load exams:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadExams();
  };

  const handleSelectExam = (exam) => {
    navigation.navigate('ExamDetail', { exam });
  };

  const handleSignOut = async () => {
    await signOut();
    navigation.navigate('Auth', { screen: 'Login' });
  };

  const renderExamCard = ({ item }) => (
    <View style={styles.card} className="bg-white rounded-xl p-5 mb-4 border border-slate-200">
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category || 'General'}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'Ready' ? styles.statusReady : styles.statusScheduled]}>
          <Text style={[styles.statusText, item.status === 'Ready' ? styles.statusTextReady : styles.statusTextScheduled]}>
            ● {item.status || 'Ready'}
          </Text>
        </View>
      </View>

      <Text style={styles.examTitle}>{item.title}</Text>
      {item.description ? (
        <Text style={styles.examDesc} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <View style={styles.metaRow}>
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Duration</Text>
          <Text style={styles.metaValue}>{item.durationMinutes || item.duration} min</Text>
        </View>
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Questions</Text>
          <Text style={styles.metaValue}>{item.totalQuestions || item.questions?.length || 0}</Text>
        </View>
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Total Marks</Text>
          <Text style={styles.metaValue}>{item.totalMarks || 100}</Text>
        </View>
      </View>

      <View style={styles.cardActionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => handleSelectExam(item)}
        >
          <Text style={styles.actionBtnText}>Guidelines →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.leaderboardBtn}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('Leaderboard', {
              examId: item.id || item._id,
              examTitle: item.title,
              totalMarks: item.totalMarks || 100,
            })
          }
        >
          <Text style={styles.leaderboardBtnText}>🏆 Rankings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Bar */}
      <View style={styles.topNav}>
        <View style={styles.topLeftBlock}>
          <Text style={styles.appName}>ExamSphere</Text>
          <TouchableOpacity
            style={[styles.orgChip, { borderColor: `${activeOrg.brandColor || '#4F46E5'}40` }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('OrgSettings')}
          >
            <Text style={styles.orgChipIcon}>{activeOrg.logoIcon || '🏛️'}</Text>
            <Text style={styles.orgChipText} numberOfLines={1}>
              {activeOrg.shortName || activeOrg.name}
            </Text>
            <Text style={styles.orgChipArrow}>▾</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topRightRow}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('OrgSettings')}
          >
            <Text style={styles.headerIconEmoji}>⚙️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadNotifCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadNotifCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Institutional Affiliation Banner */}
      <TouchableOpacity
        style={styles.institutionBanner}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('OrgSettings')}
      >
        <View style={styles.institutionBannerLeft}>
          <View style={[styles.instBannerLogoBox, { backgroundColor: `${activeOrg.brandColor}15` }]}>
            <Text style={styles.instBannerLogoText}>{activeOrg.logoIcon}</Text>
          </View>
          <View style={styles.instBannerTextCol}>
            <View style={styles.instNameRow}>
              <Text style={styles.instTitleText} numberOfLines={1}>
                {activeOrg.name}
              </Text>
              {activeOrg.verified && (
                <View style={styles.instVerifiedBadge}>
                  <Text style={styles.instVerifiedText}>✓ VERIFIED</Text>
                </View>
              )}
            </View>
            <Text style={styles.instSubText}>
              {activeOrg.plan} • {activeOrg.code} • Proctoring active
            </Text>
          </View>
        </View>
        <Text style={styles.instManageLink}>Switch →</Text>
      </TouchableOpacity>

      {/* Title & Filter Bar */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Available Examinations</Text>
          <Text style={styles.sectionSubtitle}>
            Select an exam to review proctoring rules and begin
          </Text>
        </View>
      </View>

      {/* Content List or Skeleton Loading */}
      {loading ? (
        <View style={styles.listContent}>
          <ExamCardSkeleton />
          <ExamCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={exams}
          keyExtractor={(item) => item.id || item._id}
          renderItem={renderExamCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2563EB']}
              tintColor="#2563EB"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No Exams Available</Text>
              <Text style={styles.emptySub}>Please check back later or pull to refresh.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  topLeftBlock: {
    flex: 1,
    marginRight: 10,
  },
  orgChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  orgChipIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  orgChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    maxWidth: 130,
  },
  orgChipArrow: {
    fontSize: 10,
    color: '#64748B',
    marginLeft: 3,
  },
  greeting: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  candidateName: {
    fontWeight: '600',
    color: '#2563EB',
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerIconEmoji: {
    fontSize: 16,
  },
  institutionBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  institutionBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  instBannerLogoBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  instBannerLogoText: {
    fontSize: 18,
  },
  instBannerTextCol: {
    flex: 1,
  },
  instNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  instTitleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  instVerifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  instVerifiedText: {
    color: '#15803D',
    fontSize: 8,
    fontWeight: '800',
  },
  instSubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  instManageLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  bellBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  bellIcon: {
    fontSize: 16,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  signOutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusReady: {
    backgroundColor: '#DCFCE7',
  },
  statusScheduled: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextReady: {
    color: '#15803D',
  },
  statusTextScheduled: {
    color: '#92400E',
  },
  examTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 22,
    marginBottom: 6,
  },
  examDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
  },
  metaCol: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1.4,
    backgroundColor: '#4F46E5',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  leaderboardBtn: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderboardBtnText: {
    color: '#4338CA',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptySub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
  },
});
