import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';

export default function ExamDetailScreen({ route, navigation }) {
  const exam = route.params?.exam || {
    id: 'exam_101',
    title: 'Full-Stack MERN Architecture Assessment',
    category: 'Computer Science',
    durationMinutes: 60,
    totalQuestions: 30,
    totalMarks: 100,
    passMarks: 50,
  };

  const handleStartExam = () => {
    navigation.navigate('ExamTaking', { exam });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerCard}>
          <Text style={styles.category}>{exam.category || 'Examination'}</Text>
          <Text style={styles.title}>{exam.title}</Text>
          <Text style={styles.subtext}>
            Please review the exam guidelines and proctoring requirements carefully before starting.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Exam Specifications</Text>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Duration:</Text>
            <Text style={styles.specValue}>{exam.durationMinutes} Minutes</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Total Questions:</Text>
            <Text style={styles.specValue}>{exam.totalQuestions} Questions</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Total Marks:</Text>
            <Text style={styles.specValue}>{exam.totalMarks} Marks</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Negative Marking:</Text>
            <Text style={styles.specValue}>-0.25 for incorrect objective items</Text>
          </View>
        </View>

        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>🛡️ Proctoring Protocol Notice</Text>
          <Text style={styles.alertText}>
            • App switching or minimizing will trigger security warnings.
            {'\n'}• Your examination session is strictly timed.
            {'\n'}• Ensure a stable internet connection.
          </Text>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={handleStartExam}>
          <Text style={styles.startButtonText}>Begin Examination →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Return to Exam List</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  category: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    lineHeight: 28,
  },
  subtext: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  alertCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 6,
  },
  alertText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
  },
  backButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
});
