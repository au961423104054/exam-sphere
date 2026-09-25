/**
 * Code Execution Service using Judge0 Sandbox API
 * Ensures isolated, sandboxed execution without executing code on the application server.
 */

const LANGUAGE_MAP = {
  javascript: 93, // Node.js 18.15.0 (fallback 63)
  js: 93,
  python: 71,     // Python 3.8.1 (or 92)
  py: 71,
  java: 62,       // OpenJDK 13.0.1 (or 91)
  cpp: 54,        // C++ (GCC 9.2.0)
  'c++': 54
};

/**
 * Resolve Judge0 language ID from language string or number
 */
const getLanguageId = (language) => {
  if (typeof language === 'number') return language;
  const langKey = String(language).toLowerCase().trim();
  const id = LANGUAGE_MAP[langKey];
  if (!id) {
    throw new Error(`Unsupported programming language: "${language}". Supported: javascript, python, java, cpp`);
  }
  return id;
};

/**
 * Execute a single test case against Judge0 sandbox
 */
const runSingleTestCase = async (sourceCode, languageId, testCase, options = {}) => {
  const apiUrl = (process.env.JUDGE0_API_URL || 'https://ce.judge0.com').replace(/\/+$/, '');
  const apiKey = process.env.JUDGE0_API_KEY;
  const apiHost = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';

  const timeLimitSeconds = options.timeLimitMs ? (options.timeLimitMs / 1000).toFixed(2) : '2.00';
  const memoryLimitKb = options.memoryLimitMb ? options.memoryLimitMb * 1024 : 128000;

  const payload = {
    source_code: sourceCode,
    language_id: languageId,
    stdin: testCase.input || '',
    expected_output: testCase.expectedOutput || '',
    cpu_time_limit: parseFloat(timeLimitSeconds),
    memory_limit: memoryLimitKb
  };

  const headers = {
    'Content-Type': 'application/json'
  };

  if (apiKey) {
    headers['x-rapidapi-key'] = apiKey;
    headers['x-rapidapi-host'] = apiHost;
  }

  try {
    const response = await fetch(`${apiUrl}/submissions?base64_encoded=false&wait=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        passed: false,
        input: testCase.input || '',
        expectedOutput: testCase.expectedOutput,
        actualOutput: '',
        error: `Judge0 execution error (HTTP ${response.status}): ${errText}`,
        statusDescription: 'Service Error',
        time: 0,
        memory: 0,
        isHidden: !!testCase.isHidden
      };
    }

    const data = await response.json();
    const actualOutput = (data.stdout || '').trim();
    const expectedOutput = (testCase.expectedOutput || '').trim();

    // Judge0 status id: 3 is Accepted
    const isAccepted = data.status?.id === 3;
    const isOutputMatch = actualOutput === expectedOutput;
    const passed = isAccepted && (testCase.expectedOutput ? isOutputMatch : true);

    const errorMessage = data.compile_output || data.stderr || (passed ? null : data.status?.description || 'Wrong Answer');

    return {
      passed,
      input: testCase.input || '',
      expectedOutput: testCase.expectedOutput,
      actualOutput,
      error: passed ? null : errorMessage,
      statusDescription: data.status?.description || (passed ? 'Accepted' : 'Failed'),
      time: parseFloat(data.time) || 0,
      memory: parseInt(data.memory, 10) || 0,
      isHidden: !!testCase.isHidden
    };
  } catch (networkError) {
    return {
      passed: false,
      input: testCase.input || '',
      expectedOutput: testCase.expectedOutput,
      actualOutput: '',
      error: `Network failure connecting to Judge0 sandbox: ${networkError.message}`,
      statusDescription: 'Network Error',
      time: 0,
      memory: 0,
      isHidden: !!testCase.isHidden
    };
  }
};

/**
 * Execute multiple test cases sequentially/batched
 */
const executeCode = async (sourceCode, language, testCases = [], options = {}) => {
  const languageId = getLanguageId(language);

  const results = [];
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const result = await runSingleTestCase(sourceCode, languageId, tc, options);
    results.push({
      testCaseIndex: i,
      ...result
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const allPassed = totalCount > 0 && passedCount === totalCount;

  return {
    success: true,
    allPassed,
    passedCount,
    totalCount,
    results
  };
};

module.exports = {
  executeCode,
  getLanguageId,
  LANGUAGE_MAP
};
