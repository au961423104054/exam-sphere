import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import CodeEditor, { CodeEditorSyntaxStyles } from '@rivascva/react-native-code-editor';
import { executeCodeRun } from '../services/api';

export default function CodingQuestionView({
  question,
  code,
  onChangeCode,
  submissionId,
}) {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'results'

  // Preserve initial code in ref so CodeEditor doesn't re-mount or fire on every render
  const initialCodeRef = useRef(code);

  // Keep a ref to the latest code to prevent feedback loops
  const lastCodeRef = useRef(code);
  useEffect(() => {
    lastCodeRef.current = code;
  }, [code]);

  // Keep a ref to onChangeCode so handleEditorChange callback identity is 100% stable
  const onChangeRef = useRef(onChangeCode);
  useEffect(() => {
    onChangeRef.current = onChangeCode;
  }, [onChangeCode]);

  const handleEditorChange = useCallback((newVal) => {
    if (newVal === lastCodeRef.current) return;
    lastCodeRef.current = newVal;
    if (onChangeRef.current) {
      onChangeRef.current(newVal);
    }
  }, []);

  const handleRunCode = async () => {
    setIsRunning(true);
    setActiveTab('results');
    try {
      const response = await executeCodeRun(submissionId, {
        language: question.language || 'javascript',
        code: code,
        testCases: question.testCases || [],
      });
      setTestResults(response);
    } catch (err) {
      console.warn('Error running code:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Problem Header */}
      <View style={styles.problemCard}>
        <View style={styles.badgeRow}>
          <View style={styles.langBadge}>
            <Text style={styles.langText}>{(question.language || 'javascript').toUpperCase()}</Text>
          </View>
          <Text style={styles.marksBadge}>{question.marks || 30} Marks</Text>
        </View>
        <Text style={styles.problemTitle}>{question.title || 'Coding Challenge'}</Text>
        <Text style={styles.problemPrompt}>{question.text}</Text>
      </View>

      {/* Editor & Results Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'editor' && styles.tabActive]}
          onPress={() => setActiveTab('editor')}
        >
          <Text style={[styles.tabText, activeTab === 'editor' && styles.tabTextActive]}>
            Code Solution
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'results' && styles.tabActive]}
          onPress={() => setActiveTab('results')}
        >
          <Text style={[styles.tabText, activeTab === 'results' && styles.tabTextActive]}>
            Test Cases {testResults ? (testResults.allPassed ? '✓' : '⚠️') : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Editor View */}
      {activeTab === 'editor' ? (
        <View style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <Text style={styles.editorFilename}>
              solution.{question.language === 'python' ? 'py' : 'js'}
            </Text>
            <TouchableOpacity
              style={styles.runButton}
              activeOpacity={0.8}
              onPress={handleRunCode}
              disabled={isRunning}
            >
              {isRunning ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.runButtonText}>▶ Run Tests</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Code Editor with Fallback (Web uses plainCodeInput to prevent infinite render loops) */}
          <View style={styles.editorBox}>
            {CodeEditor && Platform.OS !== 'web' ? (
              <CodeEditor
                style={{
                  ...styles.codeEditorStyle,
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                }}
                language={question.language || 'javascript'}
                syntaxStyle={CodeEditorSyntaxStyles.atomOneDark}
                showLineNumbers
                initialValue={initialCodeRef.current}
                onChange={handleEditorChange}
              />
            ) : (
              <TextInput
                multiline
                value={code}
                onChangeText={handleEditorChange}
                style={styles.plainCodeInput}
                autoCapitalize="none"
                autoCorrect={false}
                spellCheck={false}
              />
            )}
          </View>
        </View>
      ) : (
        /* Test Results View */
        <ScrollView style={styles.resultsContainer} contentContainerStyle={{ padding: 14 }}>
          <View style={styles.runActionsRow}>
            <Text style={styles.resultsHeading}>Execution Output</Text>
            <TouchableOpacity
              style={styles.rerunBtn}
              onPress={handleRunCode}
              disabled={isRunning}
            >
              <Text style={styles.rerunBtnText}>Re-run Tests ⟳</Text>
            </TouchableOpacity>
          </View>

          {isRunning ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Executing test cases in sandbox...</Text>
            </View>
          ) : testResults ? (
            <View>
              {/* Summary Banner */}
              <View
                style={[
                  styles.summaryBanner,
                  testResults.allPassed ? styles.bannerPass : styles.bannerFail,
                ]}
              >
                <Text
                  style={[
                    styles.summaryTitle,
                    testResults.allPassed ? styles.textPass : styles.textFail,
                  ]}
                >
                  {testResults.allPassed ? '✓ All Tests Passed' : '⚠️ Test Assertions Failed'}
                </Text>
                <Text style={styles.summarySub}>
                  {testResults.passCount} of {testResults.totalCount} test cases succeeded
                </Text>
              </View>

              {/* Individual Test Cases */}
              {(testResults.results || []).map((tc, idx) => (
                <View key={idx} style={styles.testCaseCard}>
                  <View style={styles.tcHeader}>
                    <Text style={styles.tcTitle}>Test Case #{tc.testCaseIndex}</Text>
                    <View
                      style={[
                        styles.tcBadge,
                        tc.passed ? styles.tcBadgePass : styles.tcBadgeFail,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tcBadgeText,
                          tc.passed ? styles.textPass : styles.textFail,
                        ]}
                      >
                        {tc.passed ? 'PASSED' : 'FAILED'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tcDetailRow}>
                    <Text style={styles.tcLabel}>Input:</Text>
                    <Text style={styles.tcCode}>{tc.input}</Text>
                  </View>
                  <View style={styles.tcDetailRow}>
                    <Text style={styles.tcLabel}>Expected:</Text>
                    <Text style={[styles.tcCode, { color: '#16A34A' }]}>{tc.expected}</Text>
                  </View>
                  <View style={styles.tcDetailRow}>
                    <Text style={styles.tcLabel}>Actual:</Text>
                    <Text
                      style={[
                        styles.tcCode,
                        { color: tc.passed ? '#16A34A' : '#DC2626' },
                      ]}
                    >
                      {tc.actual}
                    </Text>
                  </View>
                  <Text style={styles.tcRuntime}>Execution Time: {tc.executionTimeMs}ms</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyResults}>
              <Text style={styles.emptyResultsText}>
                No test results yet. Click "Run Tests" to verify your solution.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  problemCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  langBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  langText: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '700',
  },
  marksBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  problemTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  problemPrompt: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 3,
    marginBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  editorContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1E293B',
    minHeight: 280,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  editorFilename: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  runButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  runButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  editorBox: {
    minHeight: 240,
    maxHeight: 340,
  },
  codeEditorStyle: {
    fontSize: 14,
    inputLineHeight: 20,
    highlighterLineHeight: 20,
    backgroundColor: '#0F172A',
  },
  plainCodeInput: {
    color: '#E2E8F0',
    backgroundColor: '#0F172A',
    padding: 14,
    fontSize: 14,
    fontFamily: 'monospace',
    minHeight: 240,
    textAlignVertical: 'top',
  },
  resultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 280,
  },
  runActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  rerunBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  rerunBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#64748B',
  },
  summaryBanner: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  bannerPass: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  bannerFail: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  summarySub: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  textPass: {
    color: '#166534',
  },
  textFail: {
    color: '#991B1B',
  },
  testCaseCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tcTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  tcBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tcBadgePass: {
    backgroundColor: '#DCFCE7',
  },
  tcBadgeFail: {
    backgroundColor: '#FEE2E2',
  },
  tcBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tcDetailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  tcLabel: {
    fontSize: 12,
    color: '#64748B',
    width: 65,
    fontWeight: '500',
  },
  tcCode: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#0F172A',
  },
  tcRuntime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  emptyResults: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyResultsText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});
