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

export default function ExamListScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadExams = async () => {
    try {
      const data = await fetchExams();
      setExams(data);
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

      <TouchableOpacity
        style={styles.actionBtn}
        activeOpacity={0.8}
        onPress={() => handleSelectExam(item)}
      >
        <Text style={styles.actionBtnText}>View Exam Guidelines →</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Bar */}
      <View style={styles.topNav}>
        <View>
          <Text style={styles.appName}>ExamSphere</Text>
          <Text style={styles.greeting}>
            Candidate: <Text style={styles.candidateName}>{user?.name || 'Alex Student'}</Text>
          </Text>
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

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
  greeting: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  candidateName: {
    fontWeight: '600',
    color: '#2563EB',
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
  actionBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
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
