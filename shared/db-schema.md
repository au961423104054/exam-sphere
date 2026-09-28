# ExamSphere - Database Schema Documentation

This document defines the high-level MongoDB document schemas and indexes for ExamSphere.
ExamSphere uses a single-organization, strictly role-based access model (`student`, `teacher`, `admin`).
All uploads (webcam snapshots, periodic filmstrips, identity verification portraits, and achievement certificates) are stored on local disk via `backend/src/services/storageService.js` and statically served from `/uploads`.

---

## 1. User
Represents a student, teacher/evaluator, or system administrator.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary key |
| `name` | `String` | Full name of user |
| `email` | `String` | Unique user email address (indexed, lowercase) |
| `password` | `String` | Salted and hashed password string (bcrypt, `select: false`) |
| `role` | `String` | Role enum: `'student'` \| `'teacher'` \| `'admin'` (default: `'student'`, indexed) |
| `avatarUrl` | `String` | Profile avatar / reference photo url |
| `idPhotoUrl` | `String` | Government or Institution ID reference photo for biometric proctor comparison |
| `fcmToken` | `String` | Optional Firebase Cloud Messaging token for push notifications |
| `createdAt` | `Date` | Account creation timestamp |
| `updatedAt` | `Date` | Account last modified timestamp |

**Indexes:**
- `email`: Unique index (`{ email: 1 }, { unique: true }`)
- `role`: Standard index (`{ role: 1 }`)

---

## 2. Exam
Represents an assessment with time bounds, structure, access controls, security, and scoring rules.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary key |
| `title` | `String` | Exam title / assessment name |
| `description` | `String` | Description or general instructions |
| `createdBy` | `ObjectId` | Reference to `User._id` (Teacher/Admin author, indexed) |
| `duration` | `Number` | Total exam duration in minutes |
| `sections` | `Array<Section>` | Section objects: `[{ sectionId: String, name: String, instructions: String }]` |
| `startTime` | `Date` | Exam availability start date and time (enforced server-side) |
| `endTime` | `Date` | Exam availability cutoff date and time (enforced server-side) |
| `negativeMarking`| `Boolean` | Flag indicating if incorrect answers deduct marks (default: `false`) |
| `negativeMarkValue` | `Number` | Marks deducted per incorrect answer if enabled (default: `0.25`) |
| `randomizeOrder` | `Boolean` | Flag indicating whether question order is randomized per student (deterministic seeded shuffle) |
| `allowedIpRange` | `String` | Optional CIDR, IP range, or wildcard restriction (e.g. `10.0.0.0/16`, `192.168.1.*`) |
| `requireIdentityVerification` | `Boolean` | Flag requiring webcam face capture matching before submission starts (default: `false`) |
| `snapshotIntervalSeconds` | `Number` | Frequency of continuous session filmstrip captures in seconds (min 15s, max 300s, default: `45`) |
| `enableMicrophoneMonitoring` | `Boolean` | Flag enabling ambient microphone and voice anomaly detection (default: `false`) |
| `totalMarks` | `Number` | Maximum aggregate points possible (default: `100`) |
| `passingMarks` | `Number` | Minimum points required to pass and earn certificate (default: `50`) |
| `published` | `Boolean` | Whether exam is visible/live for students (default: `true`, indexed) |
| `reminderSent` | `Boolean` | Flag indicating if 15-minute start reminder was dispatched |
| `createdAt` | `Date` | Creation timestamp |
| `updatedAt` | `Date` | Last modified timestamp |

**Indexes:**
- `createdBy`: `{ createdBy: 1 }`
- `startTime & endTime`: `{ startTime: 1, endTime: 1 }`
- `published`: `{ published: 1 }`

---

## 3. Question
Represents an individual question belonging to an exam.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary key |
| `examId` | `ObjectId` | Reference to `Exam._id` (indexed) |
| `type` | `String` | Question type enum: `'mcq'` \| `'tf'` \| `'subjective'` \| `'coding'` |
| `text` | `String` | The question statement / markdown text |
| `options` | `Array<String>` | List of choices (for `'mcq'` and `'tf'`) |
| `correctAnswer` | `Mixed` | Correct answer reference: `String` (stripped from student API responses) |
| `marks` | `Number` | Maximum marks/points allocated to this question (default: `1`) |
| `tags` | `Array<String>` | Subject / topic / difficulty tags (e.g., `['math', 'algebra']`) |
| `language` | `String` | Programming language for `'coding'` type: `'javascript'` \| `'python'` \| `'java'` \| `'cpp'` |
| `starterCode` | `String` | Starter code template provided to the student |
| `testCases` | `Array<TestCase>` | List of test cases: `[{ input: String, expectedOutput: String, isHidden: Boolean }]` (hidden test cases stripped from student API responses) |
| `timeLimitMs` | `Number` | Execution timeout in milliseconds (default: `2000`) |
| `memoryLimitMb` | `Number` | Memory limit in megabytes (default: `128`) |
| `createdAt` | `Date` | Creation timestamp |
| `updatedAt` | `Date` | Last modified timestamp |

**Indexes:**
- `examId`: `{ examId: 1 }`

---

## 4. Submission
Represents a student's attempt, answers, violations, biometric identity verification status, and graded score for an exam.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary key |
| `examId` | `ObjectId` | Reference to `Exam._id` (indexed) |
| `studentId` | `ObjectId` | Reference to `User._id` (indexed) |
| `answers` | `Array<Answer>` | Array of answers: `[{ questionId: ObjectId, selectedOption: Mixed, answerText: String, code: String, language: String, marksAwarded: Number, testResults: Array }]` |
| `score` | `Number` | Total score achieved after grading (default: `0`) |
| `status` | `String` | Submission status enum: `'in-progress'` \| `'submitted'` \| `'graded'` \| `'flagged-for-review'` |
| `violationCount`| `Number` | Total count of logged anti-cheat security incidents (default: `0`) |
| `proctorFlags` | `Array<String>` | Summary of triggered violation tags: `['tab-switch', 'fullscreen-exit', 'devtools-opened', 'screenshot-attempt', 'copy-paste-attempt', 'multiple-faces', 'no-face', 'camera-blocked', 'camera-obstructed', 'right-click-attempt', 'print-screen-attempt', 'audio-multiple-voices']` |
| `verifiedAt` | `Date` | Timestamp when pre-exam biometric face identity check passed |
| `verificationSnapshotUrl` | `String` | Relative path to local disk verification portrait (`/uploads/proctor/...`) |
| `identityStatus` | `String` | Status enum: `'pending'` \| `'verified'` \| `'bypassed'` \| `'failed'` |
| `submittedAt` | `Date` | Timestamp of final submission |
| `createdAt` | `Date` | Attempt initialization timestamp |
| `updatedAt` | `Date` | Last updated timestamp |

**Indexes:**
- `examId & studentId`: Compound index `{ examId: 1, studentId: 1 }`
- `studentId`: `{ studentId: 1 }`
- `examId & status`: `{ examId: 1, status: 1 }`

---

## 5. ProctorLog
Represents an automated proctoring event, periodic session filmstrip frame, or security incident recorded during an active exam session.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary key |
| `submissionId` | `ObjectId` | Reference to `Submission._id` (indexed) |
| `type` | `String` | Incident/Event type enum:<br>- Security Violations: `'tab-switch'`, `'fullscreen-exit'`, `'devtools-opened'`, `'screenshot-attempt'`, `'copy-paste-attempt'`, `'multiple-faces'`, `'no-face'`, `'camera-blocked'`, `'camera-obstructed'`, `'right-click-attempt'`, `'print-screen-attempt'`, `'audio-multiple-voices'`<br>- Session Monitoring: `'periodic-snapshot'` (does not increment violation count)<br>- Audit Events: `'identity-verification'` |
| `timestamp` | `Date` | Date and time when event occurred |
| `snapshotUrl` | `String` | Relative path to local disk snapshot served via `/uploads/...` |
| `metadata` | `Mixed` | Contextual diagnostic details (e.g. luminance level, confidence score, detected faces, key combinations) |
| `createdAt` | `Date` | Creation timestamp |

**Indexes:**
- `submissionId`: `{ submissionId: 1 }`
- `submissionId & type`: `{ submissionId: 1, type: 1 }`

---

## 6. Notification
Represents in-app and transactional alert records sent to platform users.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary key |
| `userId` | `ObjectId` | Reference to recipient `User._id` (indexed) |
| `type` | `String` | Notification category (e.g., `'exam-scheduled'`, `'result-published'`, `'proctor-alert'`) |
| `message` | `String` | User-facing notification content |
| `read` | `Boolean` | Flag indicating whether notification has been read by user (default: `false`) |
| `createdAt` | `Date` | Notification dispatch timestamp |

**Indexes:**
- `userId`: `{ userId: 1 }`

---

## 7. Heuristic Disclosures & Non-Forensic Limitations
In compliance with production-grade engineering standards:
- **Biometric Identity Verification:** The face detection and comparison routine uses client-side face landmark/luminance validation and reference photo cross-matching. This is a **best-effort heuristic** designed for educational exam admissions, not a forensic-grade or biometric passport check.
- **Camera Obstruction Detection:** Detected when average luminance across video sample blocks falls below calibrated thresholds (e.g. `< 12` on a 0–255 scale).
- **Audio Monitoring:** Detects presence of sustained ambient speech energy or secondary harmonic frequencies.
- **IP Enforcement:** Hard server-side CIDR/subnet validation (`ipChecker.js`).
