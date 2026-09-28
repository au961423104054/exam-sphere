import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Modal,
  AppState,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import {
  logProctorViolation,
  submitFinalExam,
  startExamSubmission,
  saveQuestionAnswer,
} from '../services/api';
import { saveExamProgress, getExamProgress, clearExamProgress } from '../utils/offlineStorage';
import { formatDuration } from '../utils/formatters';
import CodingQuestionView from '../components/CodingQuestionView';
import MobileCameraFeed from '../components/MobileCameraFeed';
import MobileSystemCheckModal from '../components/MobileSystemCheckModal';

export default function ExamTakingScreen({ route, navigation }) {
  const exam = route.params?.exam || {
    id: 'exam_101',
    title: 'Assessment',
    durationMinutes: 60,
    violationThreshold: 3,
  };

  const questions = exam.questions || [
    {
      id: 'q1',
      type: 'mcq',
      text: 'In Node.js event-driven architecture, what mechanism handles asynchronous I/O operations non-blockingly?',
      options: [
        'The V8 Garbage Collector',
        'The Libuv Event Loop & Worker Pool',
        'Child Process Forking Pool',
        'Synchronous Thread Pool',
      ],
      marks: 25,
    },
    {
      id: 'q2',
      type: 'mcq',
      text: 'Which MongoDB index type is most suitable for queries performing text searches across string content?',
      options: ['Compound Index', 'Geospatial 2dsphere Index', 'Text Index', 'Hashed Index'],
      marks: 25,
    },
    {
      id: 'q3',
      type: 'coding',
      language: 'javascript',
      title: 'Two Sum Algorithm',
      text: 'Write a function `twoSum(nums, target)` that returns the indices `[i, j]` of the two numbers such that they add up to `target`.',
      starterCode: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}`,
      testCases: [
        { input: 'twoSum([2, 7, 11, 15], 9)', expected: '[0, 1]' },
        { input: 'twoSum([3, 2, 4], 6)', expected: '[1, 2]' },
      ],
      marks: 50,
    },
  ];

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [codingAnswers, setCodingAnswers] = useState({});
  const [submissionId, setSubmissionId] = useState(null);
  const [secondsRemaining, setSecondsRemaining] = useState(
    (exam.durationMinutes || exam.duration || 60) * 60
  );
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [lastViolationMsg, setLastViolationMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isGateVerified, setIsGateVerified] = useState(false);
  const [verificationSnapshotUrl, setVerificationSnapshotUrl] = useState('');

  const violationThreshold = exam.violationThreshold || 3;
  const appState = useRef(AppState.currentState);

  // Complete pre-exam admission gate & launch submission
  const handleGateComplete = async ({ verificationSnapshotUrl: snapshotUrl }) => {
    setVerificationSnapshotUrl(snapshotUrl || '');
    try {
      const res = await startExamSubmission(
        exam.id || exam._id || 'exam_101',
        snapshotUrl || ''
      );
      if (res?.submissionId || res?.id) {
        setSubmissionId(res.submissionId || res.id);
      }
      setIsGateVerified(true);
    } catch (err) {
      console.warn('Failed to start mobile submission attempt:', err);
      setSubmissionId(`sub_demo_${Date.now()}`);
      setIsGateVerified(true);
    }
  };

  /* ==============================================================================
   * 1. Screen Capture & Recording Prevention (expo-screen-capture)
   *
   * Note: On Android, preventScreenCaptureAsync() completely blocks screenshots
   * and screen recording at the OS window manager level (FLAG_SECURE).
   * On iOS, screen recording is blacked out, but the OS screenshot gesture cannot
   * be prevented by 3rd party apps — iOS screenshot events are detected via
   * addScreenshotListener and logged as security violations via POST /api/proctor/log-violation.
   * On Web, screen capture prevention APIs are unsupported by browser sandboxes and
   * gracefully bypassed.
   * ============================================================================== */
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    let screenshotSubscription;

    const activateProtection = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
      } catch (err) {
        console.warn('[ScreenCapture] preventScreenCaptureAsync not supported:', err);
      }
    };

    activateProtection();

    // Listen for screenshot capture events (especially active on iOS)
    try {
      screenshotSubscription = ScreenCapture.addScreenshotListener(() => {
        handleSecurityBreach(
          'screenshot-attempt',
          'Screenshot capture attempt detected during active examination session.'
        );
      });
    } catch (err) {
      console.warn('[ScreenCapture] addScreenshotListener failed:', err);
    }

    return () => {
      if (screenshotSubscription && screenshotSubscription.remove) {
        screenshotSubscription.remove();
      }
      ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);

  /* ==============================================================================
   * 2. App State & Backgrounding Detection ("Tab-Switch" equivalent for mobile)
   * ============================================================================== */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/active/) &&
        (nextAppState === 'background' || nextAppState === 'inactive')
      ) {
        // App minimized, switched to another app, or notification center opened
        handleSecurityBreach(
          'tab-switch',
          'App backgrounded or focus lost. Navigating away from the exam is strictly prohibited.'
        );
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [violationCount]);

  /* ==============================================================================
   * 3. Breach Logging & Auto-Submission Handler
   * ============================================================================== */
  const handleSecurityBreach = async (violationType, description) => {
    const newCount = violationCount + 1;
    setViolationCount(newCount);
    setLastViolationMsg(description);
    setShowViolationModal(true);

    // Asynchronously log violation incident to backend contract endpoint
    await logProctorViolation({
      submissionId: submissionId || ('sub_' + (exam.id || '101')),
      examId: exam.id || exam._id,
      violationType,
      details: description,
    });

    // Check if violation limit exceeded
    if (newCount >= violationThreshold) {
      setTimeout(() => {
        executeAutoSubmit(newCount, 'Exceeded maximum permitted proctoring violations.');
      }, 1500);
    }
  };

  /* ==============================================================================
   * 4. Offline State Recovery & Timer (Starts only after admission gate passes)
   * ============================================================================== */
  useEffect(() => {
    // Attempt offline recovery
    const restoreOfflineData = async () => {
      const saved = await getExamProgress(exam.id || exam._id);
      if (saved) {
        if (saved.selectedAnswers) setSelectedAnswers(saved.selectedAnswers);
        if (saved.codingAnswers) setCodingAnswers(saved.codingAnswers);
        if (saved.secondsRemaining) setSecondsRemaining(saved.secondsRemaining);
      }
    };
    restoreOfflineData();

    if (!isGateVerified) return;

    // Timer Interval
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          executeAutoSubmit(violationCount, 'Time limit expired.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGateVerified]);

  // Save progress on answer changes
  useEffect(() => {
    saveExamProgress(exam.id || exam._id, {
      selectedAnswers,
      codingAnswers,
      secondsRemaining,
      currentIdx,
    });
  }, [selectedAnswers, codingAnswers, secondsRemaining, currentIdx]);

  /* ==============================================================================
   * 5. Answer Selection & Code Entry
   * ============================================================================== */
  const handleSelectOption = (qId, optionIdx) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: optionIdx,
    }));

    if (submissionId) {
      saveQuestionAnswer(submissionId, {
        questionId: qId,
        selectedOption: optionIdx,
      }).catch((e) => console.warn('Failed to auto-save answer:', e.message));
    }
  };

  const handleUpdateCode = useCallback((qId, newCode) => {
    setCodingAnswers((prev) => {
      if (prev[qId] === newCode) return prev;
      return {
        ...prev,
        [qId]: newCode,
      };
    });
  }, []);

  /* ==============================================================================
   * 6. Submission Handlers
   * ============================================================================== */
  const buildAnswersPayload = () => {
    return [
      ...Object.entries(selectedAnswers).map(([questionId, opt]) => ({
        questionId,
        selectedOption: opt,
      })),
      ...Object.entries(codingAnswers).map(([questionId, code]) => ({
        questionId,
        code,
      })),
    ];
  };

  const executeAutoSubmit = async (finalViolations, reason) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowViolationModal(false);

    await clearExamProgress(exam.id || exam._id);

    const subId = submissionId || ('sub_' + (exam.id || '101'));
    const submissionResult = await submitFinalExam(subId, {
      answers: buildAnswersPayload(),
      violationsCount: finalViolations,
      autoSubmitted: true,
      autoSubmitReason: reason,
    });

    navigation.replace('Results', {
      exam,
      score: submissionResult.score || 70,
      totalMarks: exam.totalMarks || 100,
      violationsCount: finalViolations,
      autoSubmitted: true,
      autoSubmitReason: reason,
    });
  };

  const handleManualSubmit = async () => {
    setShowSubmitModal(false);
    setIsSubmitting(true);

    await clearExamProgress(exam.id || exam._id);

    const subId = submissionId || ('sub_' + (exam.id || '101'));
    const submissionResult = await submitFinalExam(subId, {
      answers: buildAnswersPayload(),
      violationsCount: violationCount,
      autoSubmitted: false,
    });

    navigation.replace('Results', {
      exam,
      score: submissionResult.score || 85,
      totalMarks: exam.totalMarks || 100,
      violationsCount: violationCount,
      autoSubmitted: false,
    });
  };

  const currentQ = questions[currentIdx] || questions[0];
  const isLastQuestion = currentIdx === questions.length - 1;
  const isTimeCritical = secondsRemaining < 300; // < 5 mins

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Proctoring & Timer Header */}
      <View style={styles.topBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.examTitle} numberOfLines={1}>{exam.title}</Text>
          <View style={styles.proctorStatusRow}>
            <View style={styles.shieldPulse} />
            <Text style={styles.proctorShieldText}>Screen Lock & Proctor Active</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.timerBadge, isTimeCritical && styles.timerBadgeCritical]}>
            <Text style={[styles.timerText, isTimeCritical && styles.timerTextCritical]}>
              ⏱ {formatDuration(secondsRemaining)}
            </Text>
          </View>

          {violationCount > 0 ? (
            <View style={styles.violationIndicator}>
              <Text style={styles.violationIndicatorText}>
                ⚠️ {violationCount}/{violationThreshold}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Question Palette Carousel */}
      <View style={styles.paletteContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.paletteScroll}>
          {questions.map((q, idx) => {
            const isAnswered =
              selectedAnswers[q.id] !== undefined || codingAnswers[q.id] !== undefined;
            const isCurrent = idx === currentIdx;

            return (
              <TouchableOpacity
                key={q.id || idx}
                style={[
                  styles.paletteItem,
                  isCurrent && styles.paletteItemCurrent,
                  isAnswered && !isCurrent && styles.paletteItemAnswered,
                ]}
                onPress={() => setCurrentIdx(idx)}
              >
                <Text
                  style={[
                    styles.paletteItemText,
                    isCurrent && styles.paletteTextCurrent,
                    isAnswered && !isCurrent && styles.paletteTextAnswered,
                  ]}
                >
                  {q.type === 'coding' ? `</> ${idx + 1}` : idx + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Question Content View */}
      <ScrollView contentContainerStyle={styles.contentScroll} showsVerticalScrollIndicator={false}>
        {currentQ.type === 'coding' ? (
          <CodingQuestionView
            key={currentQ.id}
            question={currentQ}
            code={codingAnswers[currentQ.id] || currentQ.starterCode || ''}
            onChangeCode={(val) => handleUpdateCode(currentQ.id, val)}
            submissionId={'sub_' + (exam.id || '101')}
          />
        ) : (
          /* Objective (MCQ / TF) Question */
          <View>
            <View style={styles.questionCard}>
              <View style={styles.qMetaRow}>
                <View style={styles.qTypeBadge}>
                  <Text style={styles.qTypeText}>
                    {currentQ.type === 'tf' ? 'True / False' : 'Multiple Choice'}
                  </Text>
                </View>
                <Text style={styles.qMarksText}>{currentQ.marks || 25} Marks</Text>
              </View>
              <Text style={styles.qNumber}>Question {currentIdx + 1} of {questions.length}</Text>
              <Text style={styles.qPrompt}>{currentQ.text}</Text>
            </View>

            <View style={styles.optionsList}>
              {(currentQ.options || []).map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentQ.id] === optIdx;
                return (
                  <TouchableOpacity
                    key={optIdx}
                    activeOpacity={0.8}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => handleSelectOption(currentQ.id, optIdx)}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected ? <View style={styles.radioDot} /> : null}
                    </View>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Picture-in-Picture Webcam Feed (Front Camera, session filmstrip monitoring) */}
      <View style={styles.floatingCameraWrapper}>
        <MobileCameraFeed
          examId={exam.id || exam._id || 'exam_101'}
          submissionId={submissionId}
          candidateEmail="alex.student@examsphere.io"
          intervalSeconds={exam.snapshotIntervalSeconds || 30}
          enabled={isGateVerified}
          onCameraObstructed={(msg) =>
            handleSecurityBreach('camera-blocked', msg || 'Webcam feed dark or obstructed.')
          }
        />
      </View>

      {/* Footer Navigation & Submit */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          style={[styles.navBtn, currentIdx === 0 && styles.navBtnDisabled]}
          disabled={currentIdx === 0}
          onPress={() => setCurrentIdx((i) => Math.max(0, i - 1))}
        >
          <Text style={styles.navBtnText}>← Previous</Text>
        </TouchableOpacity>

        {isLastQuestion ? (
          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.8}
            onPress={() => setShowSubmitModal(true)}
          >
            <Text style={styles.submitBtnText}>Submit Assessment ✓</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.nextBtn}
            activeOpacity={0.8}
            onPress={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
          >
            <Text style={styles.nextBtnText}>Next Question →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Violation Alert Modal */}
      <Modal
        visible={showViolationModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Text style={styles.modalIcon}>⚠️</Text>
            </View>
            <Text style={styles.modalTitle}>Security Incident Detected</Text>
            <Text style={styles.modalBody}>{lastViolationMsg}</Text>

            <View style={styles.violationMeter}>
              <Text style={styles.meterLabel}>Proctoring Breach Counter:</Text>
              <Text style={styles.meterCount}>
                {violationCount} / {violationThreshold} Violations
              </Text>
            </View>

            {violationCount >= violationThreshold ? (
              <View style={styles.autoSubmitAlert}>
                <Text style={styles.autoSubmitText}>
                  Violation limit reached. Your assessment is being submitted automatically.
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.modalDismissBtn}
                onPress={() => setShowViolationModal(false)}
              >
                <Text style={styles.modalDismissText}>Acknowledge Warning & Return</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Confirmation Submit Modal */}
      <Modal
        visible={showSubmitModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubmitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Submit Examination?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to finish and submit your answers? Once submitted, answers cannot be edited.
            </Text>

            <TouchableOpacity style={styles.confirmSubmitBtn} onPress={handleManualSubmit}>
              <Text style={styles.confirmSubmitText}>Yes, Finalize & Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelModalBtn}
              onPress={() => setShowSubmitModal(false)}
            >
              <Text style={styles.cancelModalText}>Return to Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Commercial AMS-Standard Pre-Exam Diagnostic & Identity Verification Gate */}
      {!isGateVerified && (
        <MobileSystemCheckModal
          visible={!isGateVerified}
          exam={exam}
          candidateName="Alex Student"
          onComplete={handleGateComplete}
          onExit={() => navigation.goBack()}
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
  floatingCameraWrapper: {
    position: 'absolute',
    bottom: 68,
    right: 14,
    zIndex: 99,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flex: 1,
    marginRight: 10,
  },
  examTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  proctorStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  shieldPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 6,
  },
  proctorShieldText: {
    fontSize: 11,
    color: '#16A34A',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timerBadgeCritical: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    fontVariant: ['tabular-nums'],
  },
  timerTextCritical: {
    color: '#DC2626',
  },
  violationIndicator: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  violationIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  paletteContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
  },
  paletteScroll: {
    paddingHorizontal: 14,
    gap: 8,
  },
  paletteItem: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteItemCurrent: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  paletteItemAnswered: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  paletteItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  paletteTextCurrent: {
    color: '#4F46E5',
  },
  paletteTextAnswered: {
    color: '#166534',
  },
  contentScroll: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  qMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qTypeBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qTypeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4F46E5',
    textTransform: 'uppercase',
  },
  qMarksText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  qNumber: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  qPrompt: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 24,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioCircleSelected: {
    borderColor: '#4F46E5',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  optionTextSelected: {
    color: '#312E81',
    fontWeight: '700',
  },
  footerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  nextBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
  },
  modalIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalIcon: {
    fontSize: 26,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  violationMeter: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    width: '100%',
    marginBottom: 16,
    alignItems: 'center',
  },
  meterLabel: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  meterCount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#B45309',
    marginTop: 2,
  },
  autoSubmitAlert: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    width: '100%',
  },
  autoSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
  },
  modalDismissBtn: {
    backgroundColor: '#2563EB',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDismissText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  confirmSubmitBtn: {
    backgroundColor: '#16A34A',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmSubmitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelModalBtn: {
    backgroundColor: '#F1F5F9',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 14,
  },
});
