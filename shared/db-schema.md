# ExamSphere - Database Schema Documentation

This document defines the high-level MongoDB document schemas for ExamSphere (fields and data types only).

---

## 1. Organization
Represents an academic institution, school, or department hosting exams on the platform.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary key |
| `name` | `String` | Organization / Institution name |
| `plan` | `String` | Service tier (e.g., `'standard'`, `'institutional'`, `'enterprise'`) |
| `settings` | `Object` | Multi-tenant settings: `{ defaultViolationThreshold: Number, branding: { logoUrl, primaryColor, tagline }, enabledFeatures: { codingQuestions, webcamProctoring, liveLeaderboard, certificateGeneration } }` |
| `createdAt` | `Date` | Timestamp of organization creation |
| `updatedAt` | `Date` | Timestamp of last modification |


---

## 2. User
Represents a student, teacher/evaluator, or organization administrator.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary key |
| `name` | `String` | Full name of user |
| `email` | `String` | Unique user email address |
| `passwordHash` | `String` | Salted and hashed password string |
| `role` | `String` | Role enum: `'student'` \| `'teacher'` \| `'admin'` |
| `organizationId` | `ObjectId` | Reference to `Organization._id` |
| `oauthProvider` | `String` | OAuth provider name if federated (e.g., `'google'`, `'github'`, `'local'`) |
| `createdAt` | `Date` | Account creation timestamp |
| `updatedAt` | `Date` | Account last modified timestamp |

---

## 3. Exam
Represents an assessment with time bounds, structure, and configuration rules.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary key |
| `title` | `String` | Exam title / assessment name |
| `organizationId` | `ObjectId` | Reference to `Organization._id` |
| `createdBy` | `ObjectId` | Reference to `User._id` (Teacher/Admin who authored the exam) |
| `duration` | `Number` | Total exam duration in minutes |
| `sections` | `Array<Section>` | Array of section objects: `[{ sectionId: String, name: String, instructions: String }]` |
| `startTime` | `Date` | Exam availability start date and time |
| `endTime` | `Date` | Exam availability cutoff date and time |
| `negativeMarking`| `Boolean` | Flag indicating if incorrect answers deduct marks |
| `randomizeOrder` | `Boolean` | Flag indicating whether question order is randomized per student |
| `totalMarks` | `Number` | Maximum aggregate points possible (default: `100`) |
| `passingMarks` | `Number` | Minimum points required to pass and earn certificate (default: `50`) |
| `reminderSent` | `Boolean` | Flag indicating if 15-minute start reminder was dispatched |
| `createdAt` | `Date` | Creation timestamp |
| `updatedAt` | `Date` | Last modified timestamp |


---

## 4. Question
Represents an individual question belonging to an exam or question bank.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary key |
| `examId` | `ObjectId` | Reference to `Exam._id` |
| `type` | `String` | Question type enum: `'mcq'` \| `'tf'` \| `'subjective'` \| `'coding'` |
| `text` | `String` | The question statement / markdown text |
| `options` | `Array<String>` | List of choices (populated for `'mcq'`; optional for `'tf'` / empty for `'subjective'` / `'coding'`) |
| `correctAnswer` | `Mixed` | Correct answer reference: `String` (MCQ/TF option or text key) |
| `marks` | `Number` | Maximum marks/points allocated to this question |
| `tags` | `Array<String>` | Subject / topic / difficulty tags (e.g., `['math', 'algebra']`) |
| `language` | `String` | Programming language for `'coding'` type: `'javascript'` \| `'python'` \| `'java'` \| `'cpp'` |
| `starterCode` | `String` | Starter code template provided to the student |
| `testCases` | `Array<TestCase>` | List of test cases: `[{ input: String, expectedOutput: String, isHidden: Boolean }]` |
| `timeLimitMs` | `Number` | Execution timeout in milliseconds (default: `2000`) |
| `memoryLimitMb` | `Number` | Memory limit in megabytes (default: `128`) |
| `createdAt` | `Date` | Creation timestamp |
| `updatedAt` | `Date` | Last modified timestamp |

---

## 5. Submission
Represents a student's attempt and answers for an exam.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary key |
| `examId` | `ObjectId` | Reference to `Exam._id` |
| `studentId` | `ObjectId` | Reference to `User._id` |
| `answers` | `Array<Answer>` | Array of answer items: `[{ questionId: ObjectId, selectedOption: Mixed, answerText: String, code: String, language: String, marksAwarded: Number, testResults: Array }]` |
| `score` | `Number` | Total score achieved after grading |
| `status` | `String` | Submission status enum: `'in-progress'` \| `'submitted'` \| `'graded'` \| `'flagged-for-review'` |
| `violationCount`| `Number` | Total count of logged anti-cheat security incidents (default: `0`) |
| `proctorFlags` | `Array<String>` | Summary of triggered violation tags: `['tab-switch', 'fullscreen-exit', 'devtools-opened', 'screenshot-attempt', 'copy-paste-attempt', 'multiple-faces', 'no-face']` |
| `submittedAt` | `Date` | Timestamp of final submission |
| `createdAt` | `Date` | Attempt initialization timestamp |
| `updatedAt` | `Date` | Last updated timestamp |

---

## 6. ProctorLog
Represents an automated proctoring event or security incident recorded during an active exam session.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary key |
| `submissionId` | `ObjectId` | Reference to `Submission._id` |
| `type` | `String` | Incident type enum: `'tab-switch'` \| `'fullscreen-exit'` \| `'devtools-opened'` \| `'screenshot-attempt'` \| `'copy-paste-attempt'` \| `'multiple-faces'` \| `'no-face'` |
| `timestamp` | `Date` | Precise date and time when the violation occurred |
| `snapshotUrl` | `String` | Cloudinary storage URL for the webcam snapshot captured during event |
| `metadata` | `Mixed` | Contextual diagnostic details (e.g., face count, key codes) |
| `createdAt` | `Date` | Creation timestamp |

---

## 7. Notification
Represents transactional and push alert records sent to platform users.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | `ObjectId` | Primary key |
| `userId` | `ObjectId` | Reference to recipient `User._id` |
| `type` | `String` | Notification category (e.g., `'exam-scheduled'`, `'result-published'`, `'proctor-alert'`) |
| `message` | `String` | User-facing notification content |
| `read` | `Boolean` | Flag indicating whether notification has been read by user |
| `createdAt` | `Date` | Notification dispatch timestamp |
