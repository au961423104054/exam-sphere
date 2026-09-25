import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

const MOCK_EXAMS = [
  {
    id: 'exam_101',
    title: 'Full-Stack MERN Architecture Assessment',
    category: 'Computer Science',
    durationMinutes: 60,
    totalQuestions: 30,
    totalMarks: 100,
    status: 'Ready',
    difficulty: 'Intermediate',
  },
  {
    id: 'exam_102',
    title: 'Database Systems & MongoDB Indexing',
    category: 'Software Engineering',
    durationMinutes: 45,
    totalQuestions: 25,
    totalMarks: 75,
    status: 'Ready',
    difficulty: 'Advanced',
  },
  {
    id: 'exam_103',
    title: 'RESTful API Design & Socket.io Real-Time Systems',
    category: 'Backend Development',
    durationMinutes: 40,
    totalQuestions: 20,
    totalMarks: 50,
    status: 'Scheduled',
    difficulty: 'Intermediate',
  },
];

export default function ExamListScreen({ navigation }) {
  const { user, signOut } = useAuth();

  const handleSelectExam = (exam) => {
    navigation.navigate('ExamDetail', { exam });
  };

  const handleSignOut = async () => {
    await signOut();
    navigation.navigate('Auth', { screen: 'Login' });
  };

  const renderExamCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <Text style={styles.examTitle}>{item.title}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaItem}>⏱ {item.durationMinutes} Mins</Text>
        <Text style={styles.metaItem}>📝 {item.totalQuestions} Questions</Text>
        <Text style={styles.metaItem}>🎯 {item.totalMarks} Marks</Text>
      </View>

      <TouchableOpacity
        style={styles.cardAction}
        onPress={() => handleSelectExam(item)}
      >
        <Text style={styles.cardActionText}>View Exam Details →</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome, {user?.name || 'Candidate'}</Text>
          <Text style={styles.title}>Available Exams</Text>
        </View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={MOCK_EXAMS}
        keyExtractor={(item) => item.id}
        renderItem={renderExamCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  greeting: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
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
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  examTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
  },
  metaItem: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  cardAction: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
