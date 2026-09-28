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
import { fetchExams } from '../services/api';
import { ExamCardSkeleton } from '../components/Skeleton';
import Badge from '../components/Badge';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import BottomNavBar from '../components/BottomNavBar';
import {
  fetchNotifications,
  registerForPushNotificationsAsync,
} from '../services/notificationService';

export default function ExamListScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [exams, setExams] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadExams = async () => {
    try {
      const data = await fetchExams();
      setExams(data);

      const notifs = await fetchNotifications();
      const unread = (notifs || []).filter((n) => !n.read).length;
      setUnreadNotifCount(unread);
      registerForPushNotificationsAsync().catch(() => {});
    } catch (err) {
      console.warn('[ExamList] Error loading exams:', err);
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

  const renderExamCard = ({ item }) => {
    const hasCoding = (item.questions || []).some((q) => q.type === 'coding');
    const isReady = item.status === 'Ready' || item.status === 'Active';

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.badgeRow}>
            <Badge variant="default" label={item.category || 'General'} />
            {hasCoding && <Badge variant="accent" label="Coding Challenge" />}
          </View>
          <Badge
            variant={isReady ? 'success' : 'warning'}
            label={isReady ? '● Active Ready' : '● Scheduled'}
          />
        </View>

        {/* Title & Desc */}
        <Text style={styles.examTitle}>{item.title}</Text>
        {item.description ? (
          <Text style={styles.examDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Specifications Grid */}
        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Duration</Text>
            <Text style={styles.metaValue}>
              {item.durationMinutes || item.duration || 60}m
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Questions</Text>
            <Text style={styles.metaValue}>
              {item.totalQuestions || item.questions?.length || 4}
            </Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Total Marks</Text>
            <Text style={styles.metaValue}>{item.totalMarks || 100}</Text>
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Proctoring</Text>
            <Text style={[styles.metaValue, styles.textTeal]}>Enforced</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.cardActionsRow}>
          <Button
            title="Start Assessment →"
            onPress={() => handleSelectExam(item)}
            variant="primary"
            size="md"
            style={styles.actionBtn}
          />
          <Button
            title="🏆 Leaderboard"
            onPress={() =>
              navigation.navigate('Leaderboard', {
                examId: item.id || item._id,
                examTitle: item.title,
                totalMarks: item.totalMarks || 100,
              })
            }
            variant="secondary"
            size="md"
            style={styles.leaderboardBtn}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topNav}>
        <View style={styles.brandRow}>
          <View style={styles.brandSquircle}>
            <Text style={styles.brandSquircleText}>E</Text>
          </View>
          <View>
            <Text style={styles.appName}>
              Exam<Text style={styles.appAccent}>Sphere</Text>
            </Text>
            <Text style={styles.greeting} numberOfLines={1}>
              {user?.name || 'Alex Student'} &bull; Candidate
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Institutional Affiliation Bar */}
      <TouchableOpacity
        style={styles.institutionBanner}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Profile')}
      >
        <View style={styles.institutionBannerLeft}>
          <View
            style={[
              styles.instBannerLogoBox,
              { backgroundColor: '#EEF2FF' },
            ]}
          >
            <Text style={styles.instBannerLogoText}>
              🏛️
            </Text>
          </View>
          <View style={styles.instBannerTextCol}>
            <View style={styles.instNameRow}>
              <Text style={styles.instTitleText} numberOfLines={1}>
                ExamSphere Academic Center
              </Text>
              <View style={styles.instVerifiedBadge}>
                <Text style={styles.instVerifiedText}>✓ SECURE</Text>
              </View>
            </View>
            <Text style={styles.instSubText}>
              AI Proctoring Active &bull; Role: {user?.role || 'student'}
            </Text>
          </View>
        </View>
        <Text style={styles.instManageLink}>Profile →</Text>
      </TouchableOpacity>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Scheduled Examinations</Text>
        <Text style={styles.sectionSubtitle}>
          Select an exam to review proctoring rules and begin
        </Text>
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
              colors={['#4F46E5']}
              tintColor="#4F46E5"
            />
          }
          ListEmptyComponent={
            <EmptyState
              image={require('../../assets/illustrations/empty-exams.png')}
              icon="📝"
              title="No Exams Available"
              description="You have no examinations scheduled right now. Pull down to refresh."
              actionLabel="Refresh List"
              onAction={handleRefresh}
            />
          }
        />
      )}

      {/* Native Bottom Navigation Bar */}
      <BottomNavBar
        activeScreen="ExamList"
        navigation={navigation}
        unreadNotifCount={unreadNotifCount}
      />
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandSquircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  brandSquircleText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.3,
  },
  appAccent: {
    color: '#4F46E5',
  },
  greeting: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
    fontFamily: 'Inter_500Medium',
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
    color: '#64748B',
    fontFamily: 'Inter_600SemiBold',
  },
  institutionBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
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
    width: 38,
    height: 38,
    borderRadius: 12,
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
    fontFamily: 'Inter_700Bold',
    flexShrink: 1,
  },
  instVerifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
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
    fontFamily: 'Inter_400Regular',
  },
  instManageLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
    fontFamily: 'Inter_600SemiBold',
  },
  sectionHeader: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    fontFamily: 'Inter_400Regular',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  examTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: 'Inter_700Bold',
    lineHeight: 22,
    marginBottom: 6,
  },
  examDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 12,
    fontFamily: 'Inter_400Regular',
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
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
    fontFamily: 'Inter_600SemiBold',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter_700Bold',
  },
  textTeal: {
    color: '#0D9488',
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1.5,
  },
  leaderboardBtn: {
    flex: 1,
  },
});
