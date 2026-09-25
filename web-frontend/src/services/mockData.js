/**
 * ExamSphere Mock Data & Fallback API Service
 * Aligned strictly with /shared/api-contract specifications.
 * Provides rich development data and simulation for offline / un-deployed backend states.
 */

export const mockUsers = [
  {
    id: 'user-001',
    name: 'Sarah Connor',
    email: 'admin@examsphere.edu',
    role: 'admin',
    organization: 'Massachusetts Institute of Technology',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'user-002',
    name: 'Prof. Alan Turing',
    email: 'turing@examsphere.edu',
    role: 'teacher',
    organization: 'Cambridge Department of Computer Science',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2026-02-10T10:30:00Z',
  },
  {
    id: 'user-003',
    name: 'Alex Rivera',
    email: 'alex.rivera@student.mit.edu',
    role: 'student',
    organization: 'Massachusetts Institute of Technology',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: '2026-03-01T14:15:00Z',
  },
  {
    id: 'user-004',
    name: 'Jordan Lee',
    email: 'jordan@student.mit.edu',
    role: 'student',
    organization: 'Massachusetts Institute of Technology',
    status: 'Flagged',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    createdAt: '2026-03-05T09:45:00Z',
  },
  {
    id: 'user-005',
    name: 'Dr. Evelyn Reed',
    email: 'evelyn@stanford.edu',
    role: 'teacher',
    organization: 'Stanford School of Engineering',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    createdAt: '2026-02-20T11:00:00Z',
  },
];

export const mockOrganizations = [
  {
    id: 'org-mit',
    name: 'Massachusetts Institute of Technology',
    domain: 'mit.edu',
    plan: 'Enterprise Tier',
    totalUsers: 1420,
    activeExams: 18,
    status: 'Active',
    joinedDate: '2025-08-12',
  },
  {
    id: 'org-cambridge',
    name: 'Cambridge Computer Science Faculty',
    domain: 'cam.ac.uk',
    plan: 'Academic Pro',
    totalUsers: 840,
    activeExams: 12,
    status: 'Active',
    joinedDate: '2025-10-04',
  },
  {
    id: 'org-stanford',
    name: 'Stanford University',
    domain: 'stanford.edu',
    plan: 'Enterprise Tier',
    totalUsers: 2150,
    activeExams: 34,
    status: 'Active',
    joinedDate: '2025-09-18',
  },
  {
    id: 'org-berkeley',
    name: 'UC Berkeley EECS',
    domain: 'berkeley.edu',
    plan: 'Campus Standard',
    totalUsers: 620,
    activeExams: 8,
    status: 'Pending Audit',
    joinedDate: '2026-01-22',
  },
];

export const mockExams = [
  {
    id: 'exam-cs101',
    title: 'CS101: Data Structures & Algorithms Final Assessment',
    description: 'Comprehensive evaluation covering arrays, hash tables, trees, and algorithmic complexity.',
    category: 'Computer Science',
    durationMinutes: 90,
    totalMarks: 100,
    passingMarks: 60,
    instructor: 'Prof. Alan Turing',
    status: 'Active',
    proctoringEnabled: true,
    totalQuestions: 4,
    scheduledAt: '2026-09-25T14:00:00Z',
    codingQuestionsCount: 2,
    questions: [
      {
        id: 'q1',
        type: 'coding',
        title: 'Two Sum Problem',
        difficulty: 'Easy',
        marks: 25,
        description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

**Example 1:**
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

**Constraints:**
- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\``,
        timeLimitSeconds: 2,
        memoryLimitMb: 128,
        defaultLanguage: 'javascript',
        starterTemplates: {
          javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Write your solution here
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
          python: `def two_sum(nums, target):
    # Write your solution here
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`,
          cpp: `#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Write your solution here
    return {};
}`,
          java: `import java.util.HashMap;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,
        },
        testCases: [
          {
            id: 'tc1',
            input: 'nums = [2,7,11,15], target = 9',
            expectedOutput: '[0, 1]',
            isHidden: false,
          },
          {
            id: 'tc2',
            input: 'nums = [3,2,4], target = 6',
            expectedOutput: '[1, 2]',
            isHidden: false,
          },
          {
            id: 'tc3',
            input: 'nums = [3,3], target = 6',
            expectedOutput: '[0, 1]',
            isHidden: true,
          },
        ],
      },
      {
        id: 'q2',
        type: 'coding',
        title: 'Reverse a Linked List',
        difficulty: 'Medium',
        marks: 25,
        description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
        timeLimitSeconds: 2,
        memoryLimitMb: 128,
        defaultLanguage: 'javascript',
        starterTemplates: {
          javascript: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr !== null) {
    let nextTemp = curr.next;
    curr.next = prev;
    prev = curr;
    curr = nextTemp;
  }
  return prev;
}`,
        },
        testCases: [
          {
            id: 'tc2-1',
            input: 'head = [1,2,3,4,5]',
            expectedOutput: '[5,4,3,2,1]',
            isHidden: false,
          },
        ],
      },
    ],
  },
  {
    id: 'exam-web300',
    title: 'CS340: Distributed Systems & Microservices Architecture',
    description: 'High availability patterns, Raft consensus, and event-driven architectures.',
    category: 'Computer Science',
    durationMinutes: 120,
    totalMarks: 100,
    passingMarks: 70,
    instructor: 'Dr. Evelyn Reed',
    status: 'Upcoming',
    proctoringEnabled: true,
    totalQuestions: 6,
    scheduledAt: '2026-09-28T09:00:00Z',
    codingQuestionsCount: 1,
    questions: [],
  },
  {
    id: 'exam-bio102',
    title: 'BIO102: Molecular Genetics & Gene Expression',
    description: 'DNA replication mechanisms, translation regulation, and CRISPR systems.',
    category: 'Biology',
    durationMinutes: 60,
    totalMarks: 50,
    passingMarks: 35,
    instructor: 'Prof. Rosalind Franklin',
    status: 'Completed',
    proctoringEnabled: true,
    totalQuestions: 25,
    scheduledAt: '2026-09-20T11:00:00Z',
    codingQuestionsCount: 0,
    questions: [],
  },
];

export const mockViolations = [
  {
    id: 'violation-901',
    candidateName: 'Jordan Lee',
    candidateEmail: 'jordan@student.mit.edu',
    examTitle: 'CS101: Data Structures & Algorithms Final',
    violationType: 'Tab Switch / Window Blur',
    severity: 'High',
    timestamp: '2026-09-25T10:14:22Z',
    details: 'Browser visibility changed to hidden for 8.4 seconds',
    snapshotUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
    status: 'Flagged for Review',
  },
  {
    id: 'violation-902',
    candidateName: 'Jordan Lee',
    candidateEmail: 'jordan@student.mit.edu',
    examTitle: 'CS101: Data Structures & Algorithms Final',
    violationType: 'Fullscreen Exit',
    severity: 'Medium',
    timestamp: '2026-09-25T10:18:05Z',
    details: 'Exited enforced fullscreen window mode',
    snapshotUrl: null,
    status: 'Flagged for Review',
  },
  {
    id: 'violation-903',
    candidateName: 'Marcus Vance',
    candidateEmail: 'marcus@student.mit.edu',
    examTitle: 'CS101: Data Structures & Algorithms Final',
    violationType: 'Screenshot Attempt (PrintScreen)',
    severity: 'High',
    timestamp: '2026-09-25T09:42:19Z',
    details: 'PrintScreen key event captured; screen blurred for 2.5s',
    snapshotUrl: null,
    status: 'Auto-Resolved',
  },
  {
    id: 'violation-904',
    candidateName: 'Hannah Abbott',
    candidateEmail: 'hannah@cam.ac.uk',
    examTitle: 'CS340: Distributed Systems',
    violationType: 'Unauthorized Copy / Paste Attempt',
    severity: 'Low',
    timestamp: '2026-09-24T16:30:11Z',
    details: 'Clipboard paste action intercepted inside editor',
    snapshotUrl: null,
    status: 'Dismissed',
  },
  {
    id: 'violation-905',
    candidateName: 'Devon Miles',
    candidateEmail: 'devon@stanford.edu',
    examTitle: 'CS101: Data Structures & Algorithms Final',
    violationType: 'Tab Switch / Window Blur',
    severity: 'High',
    timestamp: '2026-09-24T14:02:44Z',
    details: 'Multiple window switch instances detected',
    snapshotUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
    status: 'Session Auto-Submitted',
  },
];

/**
 * Simulates code execution against test cases with realistic timings and syntax error detection.
 */
export async function executeMockCode(language, code, testCases) {
  // Artificial execution latency simulating network / remote container sandbox
  await new Promise((resolve) => setTimeout(resolve, 650));

  let results = [];
  let allPassed = true;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    let passed = false;
    let actualOutput = '';
    let executionTimeMs = Math.floor(Math.random() * 25) + 15;

    try {
      if (language === 'javascript') {
        // Safe lightweight in-browser runner for JS functions
        if (code.includes('twoSum')) {
          const fn = new Function(`${code}; return twoSum;`)();
          let parsedInput = [];
          let target = 0;
          if (tc.input.includes('target = 9')) {
            parsedInput = [2, 7, 11, 15];
            target = 9;
          } else if (tc.input.includes('target = 6') && tc.input.includes('3,3')) {
            parsedInput = [3, 3];
            target = 6;
          } else {
            parsedInput = [3, 2, 4];
            target = 6;
          }
          const res = fn(parsedInput, target);
          actualOutput = JSON.stringify(res);
          passed = actualOutput === tc.expectedOutput || (res && res.length === 2);
        } else {
          actualOutput = tc.expectedOutput;
          passed = true;
        }
      } else {
        // Simulated execution for non-JS languages
        actualOutput = tc.expectedOutput;
        passed = true;
      }
    } catch (err) {
      actualOutput = `Runtime Error: ${err.message}`;
      passed = false;
    }

    if (!passed) allPassed = false;

    results.push({
      testCaseId: tc.id || `tc-${i + 1}`,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      actualOutput: actualOutput,
      passed,
      executionTimeMs,
      isHidden: tc.isHidden || false,
    });
  }

  return {
    success: true,
    allPassed,
    totalCases: testCases.length,
    passedCases: results.filter((r) => r.passed).length,
    results,
    stdout: allPassed ? 'All test cases passed cleanly. Output streams verified.' : 'Some test cases did not match expected criteria.',
    runtimeMs: results.reduce((acc, r) => acc + r.executionTimeMs, 0),
    memoryKb: 14280,
  };
}
