import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchLeaderboard } from '../services/api';
import {
  initSocket,
  joinExamRoom,
  leaveExamRoom,
  subscribeConnectionState,
} from '../services/socketService';
import { downloadAndShareCertificate } from '../services/certificateService';
import BottomNavBar from '../components/BottomNavBar';

export default function LeaderboardScreen({ route, navigation }) {
  const { user } = useAuth();
  const params = route.params || {};
  const examId = params.examId || 'exam_101';
  const examTitle = params.examTitle || 'Full-Stack MERN Architecture Assessment';
  const userScore = params.score ?? 85;
  const totalMarks = params.totalMarks ?? 100;

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'top10', 'me'
  const [isSocketLive, setIsSocketLive] = useState(false);
  const [isDownloadingCert, setIsDownloadingCert] = useState(false);

  // Load leaderboard data
  const loadLeaderboardData = useCallback(async () => {
    try {
      const data = await fetchLeaderboard(examId);
      // Map and mark current user
      const currentUserName = user?.name || 'Alex Student';
      const formatted = (data || []).map((entry) => ({
        ...entry,
        isCurrentUser:
          entry.isCurrentUser ||
          entry.candidateName?.toLowerCase() === currentUserName.toLowerCase(),
      }));
      setLeaderboard(formatted);
    } catch (err) {
      console.warn('[Leaderboard] Failed to fetch:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [examId, user?.name]);

  // Setup live socket connection and listeners
  useEffect(() => {
    loadLeaderboardData();

    // Socket subscription
    let unsubscribeSocketState = () => {};
    let activeSocket = null;

    (async () => {
      activeSocket = await initSocket();
      unsubscribeSocketState = subscribeConnectionState((connected) => {
        setIsSocketLive(connected);
      });

      if (activeSocket) {
        joinExamRoom(examId);

        // Realtime update listener
        activeSocket.on('leaderboard:update', (updatedData) => {
          if (Array.isArray(updatedData)) {
            setLeaderboard(updatedData);
          } else {
            loadLeaderboardData();
          }
        });

        activeSocket.on('exam:leaderboard', (payload) => {
          if (payload?.leaderboard) {
            setLeaderboard(payload.leaderboard);
          }
        });
      }
    })();

    return () => {
      unsubscribeSocketState();
      leaveExamRoom(examId);
      if (activeSocket) {
        activeSocket.off('leaderboard:update');
        activeSocket.off('exam:leaderboard');
      }
    };
  }, [examId, loadLeaderboardData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadLeaderboardData();
  };

  const handleDownloadCertificate = async () => {
    try {
      setIsDownloadingCert(true);
      const res = await downloadAndShareCertificate({
        candidateName: user?.name || 'Alex Student',
        examTitle,
        score: userScore,
        totalMarks,
        percentage: `${Math.round((userScore / totalMarks) * 100)}%`,
        grade: userScore >= 80 ? 'Grade A - Distinction' : 'Grade B - Credit',
        issueDate: new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      });

      if (!res.success && res.error) {
        Alert.alert('Notice', 'Unable to download scorecard.');
      }
    } finally {
      setIsDownloadingCert(false);
    }
  };

  // Filtered entries
  const displayedEntries = leaderboard.filter((item) => {
    if (activeTab === 'top10') return item.rank <= 10;
    if (activeTab === 'me') return item.isCurrentUser;
    return true;
  });

  // Top 3 Podium
  const rank1 = leaderboard.find((item) => item.rank === 1);
  const rank2 = leaderboard.find((item) => item.rank === 2);
  const rank3 = leaderboard.find((item) => item.rank === 3);

  const renderRankRow = ({ item }) => {
    const isMe = item.isCurrentUser;
    const medal =
      item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : null;

    return (
      <View style={[styles.rankRow, isMe && styles.rankRowMe]}>
        <View style={styles.rankLeftCol}>
          <View style={[styles.rankBadgeBox, isMe && styles.rankBadgeBoxMe]}>
            {medal ? (
              <Text style={styles.medalIcon}>{medal}</Text>
            ) : (
              <Text style={[styles.rankNumber, isMe && styles.textIndigo]}>#{item.rank}</Text>
            )}
          </View>

          <View style={[styles.avatarCircle, isMe && styles.avatarCircleMe]}>
            <Text style={[styles.avatarText, isMe && styles.textWhite]}>
              {item.avatar || item.candidateName?.substring(0, 2).toUpperCase() || 'ST'}
            </Text>
          </View>

          <View style={styles.nameBlock}>
            <View style={styles.nameRow}>
              <Text style={[styles.candidateName, isMe && styles.candidateNameMe]} numberOfLines={1}>
                {item.candidateName}
              </Text>
              {isMe && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>YOU</Text>
                </View>
              )}
            </View>
            <Text style={styles.metaSubtext}>
              ⏱ {item.timeTakenMinutes || 45}m • {item.submittedAt || 'Recently'}
            </Text>
          </View>
        </View>

        <View style={styles.scoreRightCol}>
          <Text style={[styles.scoreValue, isMe && styles.textIndigo]}>
            {item.score} <Text style={styles.scoreMax}>/ {item.totalMarks || 100}</Text>
          </Text>
          <View style={styles.accBadge}>
            <Text style={styles.accText}>{item.accuracy || '90%'}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.screenLabel}>GLOBAL ASSESSMENT RANKINGS</Text>
            <Text style={styles.examTitleText} numberOfLines={1}>
              {examTitle}
            </Text>
          </View>

          <View style={[styles.liveBadge, isSocketLive ? styles.badgeLive : styles.badgeOffline]}>
            <View style={[styles.liveDot, isSocketLive ? styles.dotGreen : styles.dotAmber]} />
            <Text style={[styles.liveText, isSocketLive ? styles.textLiveDark : styles.textAmberDark]}>
              {isSocketLive ? 'Live Sync' : 'Offline View'}
            </Text>
          </View>
        </View>

        {/* Tab Filters */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
              All ({leaderboard.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'top10' && styles.tabBtnActive]}
            onPress={() => setActiveTab('top10')}
          >
            <Text style={[styles.tabText, activeTab === 'top10' && styles.tabTextActive]}>
              Top 10 🏆
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'me' && styles.tabBtnActive]}
            onPress={() => setActiveTab('me')}
          >
            <Text style={[styles.tabText, activeTab === 'me' && styles.tabTextActive]}>
              My Standing 👤
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scorecard Quick Card */}
      <View style={styles.certBanner}>
        <View style={styles.certBannerLeft}>
          <Text style={styles.certBannerTitle}>📄 Official Scorecard Verified</Text>
          <Text style={styles.certBannerSub}>
            Candidate: {user?.name || 'Alex Student'} • Score: {userScore}/{totalMarks}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.certDownloadBtn}
          onPress={handleDownloadCertificate}
          disabled={isDownloadingCert}
          activeOpacity={0.8}
        >
          {isDownloadingCert ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.certDownloadBtnText}>Download PDF</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loaderText}>Syncing live candidate rankings...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedEntries}
          keyExtractor={(item) => item.candidateId || item.candidateName + item.rank}
          renderItem={renderRankRow}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4F46E5']}
              tintColor="#4F46E5"
            />
          }
          ListHeaderComponent={
            activeTab === 'all' && rank1 ? (
              <View style={styles.podiumContainer}>
                {/* 2nd Place */}
                {rank2 && (
                  <View style={[styles.podiumCard, styles.podiumSecond]}>
                    <Text style={styles.podiumMedal}>🥈</Text>
                    <View style={styles.podiumAvatar}>
                      <Text style={styles.podiumAvatarText}>{rank2.avatar || 'MV'}</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {rank2.candidateName}
                    </Text>
                    <Text style={styles.podiumScore}>{rank2.score} pts</Text>
                    <View style={styles.podiumPillSilver}>
                      <Text style={styles.podiumPillText}>2nd Place</Text>
                    </View>
                  </View>
                )}

                {/* 1st Place */}
                <View style={[styles.podiumCard, styles.podiumFirst]}>
                  <Text style={styles.podiumCrown}>👑</Text>
                  <Text style={styles.podiumMedalGold}>🥇</Text>
                  <View style={[styles.podiumAvatar, styles.avatarGold]}>
                    <Text style={[styles.podiumAvatarText, styles.textGoldDark]}>
                      {rank1.avatar || 'SC'}
                    </Text>
                  </View>
                  <Text style={[styles.podiumName, styles.nameGold]} numberOfLines={1}>
                    {rank1.candidateName}
                  </Text>
                  <Text style={[styles.podiumScore, styles.scoreGold]}>{rank1.score} pts</Text>
                  <View style={styles.podiumPillGold}>
                    <Text style={styles.podiumPillGoldText}>1st Place</Text>
                  </View>
                </View>

                {/* 3rd Place */}
                {rank3 && (
                  <View style={[styles.podiumCard, styles.podiumThird]}>
                    <Text style={styles.podiumMedal}>🥉</Text>
                    <View style={styles.podiumAvatar}>
                      <Text style={styles.podiumAvatarText}>{rank3.avatar || 'AS'}</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>
                      {rank3.candidateName}
                    </Text>
                    <Text style={styles.podiumScore}>{rank3.score} pts</Text>
                    <View style={styles.podiumPillBronze}>
                      <Text style={styles.podiumPillText}>3rd Place</Text>
                    </View>
                  </View>
                )}
              </View>
            ) : null
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🏆</Text>
              <Text style={styles.emptyTitle}>No Rankings Found</Text>
              <Text style={styles.emptySub}>
                {activeTab === 'me'
                  ? 'Your ranking will appear here once your submission is fully graded.'
                  : 'Be the first to submit and claim the top of the leaderboard!'}
              </Text>
            </View>
          }
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavBar activeScreen="Leaderboard" navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleBlock: {
    flex: 1,
    marginRight: 10,
  },
  screenLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 1,
  },
  examTitleText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  badgeLive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeOffline: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  dotGreen: {
    backgroundColor: '#10B981',
  },
  dotAmber: {
    backgroundColor: '#F59E0B',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
  },
  textLiveDark: {
    color: '#065F46',
  },
  textAmberDark: {
    color: '#92400E',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  certBanner: {
    backgroundColor: '#EEF2FF',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  certBannerLeft: {
    flex: 1,
    marginRight: 10,
  },
  certBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#312E81',
  },
  certBannerSub: {
    fontSize: 11,
    color: '#4338CA',
    marginTop: 2,
  },
  certDownloadBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  certDownloadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: 16,
    marginBottom: 8,
  },
  podiumCard: {
    width: 105,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  podiumFirst: {
    width: 120,
    backgroundColor: '#FFFDF5',
    borderColor: '#FDE68A',
    borderWidth: 1.5,
    paddingVertical: 14,
    marginHorizontal: 8,
    zIndex: 2,
  },
  podiumSecond: {
    zIndex: 1,
  },
  podiumThird: {
    zIndex: 1,
  },
  podiumCrown: {
    fontSize: 16,
    marginBottom: -4,
  },
  podiumMedal: {
    fontSize: 20,
    marginBottom: 4,
  },
  podiumMedalGold: {
    fontSize: 24,
    marginBottom: 4,
  },
  podiumAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarGold: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  podiumAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  textGoldDark: {
    color: '#92400E',
  },
  podiumName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  nameGold: {
    color: '#78350F',
    fontWeight: '800',
  },
  podiumScore: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  scoreGold: {
    color: '#D97706',
  },
  podiumPillSilver: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  podiumPillBronze: {
    backgroundColor: '#FDF2E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  podiumPillGold: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 6,
  },
  podiumPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
  },
  podiumPillGoldText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  rankRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rankRowMe: {
    backgroundColor: '#EEF2FF',
    borderColor: '#818CF8',
    borderWidth: 1.5,
  },
  rankLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadgeBox: {
    width: 28,
    alignItems: 'center',
    marginRight: 8,
  },
  rankBadgeBoxMe: {
    marginRight: 8,
  },
  medalIcon: {
    fontSize: 18,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  textIndigo: {
    color: '#4F46E5',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarCircleMe: {
    backgroundColor: '#4F46E5',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  textWhite: {
    color: '#FFFFFF',
  },
  nameBlock: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  candidateName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  candidateNameMe: {
    color: '#312E81',
    fontWeight: '800',
  },
  youBadge: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  youBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  metaSubtext: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  scoreRightCol: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scoreMax: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  accBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  accText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 260,
    marginTop: 4,
  },
});
