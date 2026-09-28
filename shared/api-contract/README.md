# ExamSphere - API Contract & Route Specifications

This directory serves as the centralized API contract between the `backend`, `web-frontend`, and `mobile-app`.
ExamSphere uses a single-organization, strictly role-based architecture (`student`, `teacher`, `admin`).
All endpoints are prefixed with `/api` and return standardized JSON responses.

---

## Response Envelope Shape

### Success Response
```json
{
  "success": true,
  "data": {},
  "message": "Optional descriptive message"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error details or validation error summary"
}
```

---

## 1. Authentication (`/api/auth`)
*Rate-limited on sensitive endpoints.*

- `POST /api/auth/register`
  - Body: `{ name: string, email: string, password: string, role?: 'student'|'teacher'|'admin' }`
  - Returns: `{ user: { _id, name, email, role }, token: string }`
- `POST /api/auth/login`
  - Body: `{ email: string, password: string }`
  - Returns: `{ user: { _id, name, email, role }, token: string }`
- `POST /api/auth/refresh`
  - Body: `{ token: string }`
  - Returns: `{ token: string }`
- `POST /api/auth/logout`
  - Header: `Authorization: Bearer <token>`
  - Returns: `{ success: true, message: 'Logged out successfully' }`

---

## 2. Exam Management (`/api/exams`)
*Authentication required for all routes.*

- `POST /api/exams` *(teacher, admin)*
  - Body:
    ```json
    {
      "title": "string",
      "description": "string",
      "duration": 60,
      "startTime": "2026-09-26T10:00:00Z",
      "endTime": "2026-09-26T18:00:00Z",
      "sections": [],
      "negativeMarking": false,
      "negativeMarkValue": 0.25,
      "passingMarks": 50,
      "totalMarks": 100,
      "randomizeOrder": true,
      "allowedIpRange": "10.0.0.0/16",
      "requireIdentityVerification": true,
      "snapshotIntervalSeconds": 45,
      "enableMicrophoneMonitoring": false
    }
    ```
  - Returns: Created Exam object
- `GET /api/exams` *(all roles)*
  - Teacher/Admin: Returns exams created by user (or all if admin)
  - Student: Returns published exams within active window
  - Query params: `?status=all|active|upcoming|completed`
- `GET /api/exams/:id` *(all roles)*
  - Returns exam details with sections and questions.
  - **Security & Randomization:**
    - If student: questions are deterministically shuffled per candidate if `exam.randomizeOrder` is true.
    - `correctAnswer` and hidden test cases (`isHidden: true`) are strictly stripped from student responses.
- `PATCH /api/exams/:id` *(owner teacher, admin)*
  - Body: Partial exam properties to update
- `DELETE /api/exams/:id` *(owner teacher, admin)*
  - Deletes exam and its associated questions

---

## 3. Question Management (`/api/questions`)
*Authentication required for all routes.*

- `POST /api/questions` *(teacher, admin)*
  - Body: `{ examId: string, type: 'mcq'|'tf'|'subjective'|'coding', text: string, options?: string[], correctAnswer?: any, marks?: number, tags?: string[], language?: string, starterCode?: string, testCases?: [{ input, expectedOutput, isHidden }] }`
  - Returns: Created Question object
- `GET /api/questions/exam/:examId` *(all roles)*
  - Returns all questions for an exam (sanitized and seeded-shuffled for students if `randomizeOrder` enabled).
- `GET /api/questions/:id` *(all roles)*
  - Returns single question details (sanitized for students).
- `PATCH /api/questions/:id` *(teacher, admin)*
  - Body: Partial question properties to update
- `DELETE /api/questions/:id` *(teacher, admin)*
  - Deletes question

---

## 4. Submissions & Exam Runner (`/api/submissions`)
*Authentication required for all routes.*

- `POST /api/submissions/start` *(student)*
  - Body: `{ examId: string, verificationSnapshotUrl?: string }`
  - **Server-side Gate Enforcement:**
    - Rejects if current time is outside `startTime` / `endTime`.
    - Rejects if client IP does not match `exam.allowedIpRange` (CIDR / wildcard / IP format).
    - Rejects with `403` if `exam.requireIdentityVerification` is true and `verificationSnapshotUrl` is absent.
    - Creates or resumes `Submission` with `status: 'in-progress'`.
  - Returns: `{ submissionId, examId, studentId, status, score, answers, violationCount, snapshotIntervalSeconds, requireIdentityVerification }`
- `GET /api/submissions/mine` *(student)*
  - Returns all past and current exam submissions for authenticated student.
- `POST /api/submissions/:id/answer` *(student)*
  - Body: `{ questionId: string, selectedOption?: string|number, answerText?: string }`
  - Autosaves MCQ, True/False, or subjective answers during exam taking.
- `POST /api/submissions/:id/run-code` *(student)*
  - Body: `{ questionId: string, code: string, language: string }`
  - Executes code against public test cases via sandbox.
- `POST /api/submissions/:id/submit-code` *(student)*
  - Body: `{ questionId: string, code: string, language: string }`
  - Executes code against all test cases, awards question marks, saves code into submission record.
- `POST /api/submissions/:id/finalize` *(student)*
  - Evaluates MCQ and True/False answers, computes negative marking if enabled, grades submission, and stamps `submittedAt`.
- `GET /api/submissions/:id` *(all roles)*
  - Retrieves submission scorecard and answers.

---

## 5. Automated Proctoring & Audit Filmstrip (`/api/proctor`)
*Authentication required.*

- `POST /api/proctor/verify-identity` *(student)*
  - Multipart/form-data or JSON: `{ examId: string, snapshotBase64?: string }`
  - Validates presence of candidate face portrait, stores reference snapshot to local disk via `storageService.js` under `/uploads/proctor/verify-...`.
  - Compares with stored user avatar or computes baseline similarity score.
  - Returns:
    ```json
    {
      "verified": true,
      "snapshotUrl": "/uploads/proctor/verify-cand-123.jpg",
      "verifiedAt": "2026-09-26T20:25:00Z",
      "confidence": 0.88,
      "note": "Biometric face heuristic verified."
    }
    ```
- `POST /api/proctor/periodic-snapshot` *(student)*
  - Body: `{ submissionId: string, examId: string, snapshotBase64?: string, timestamp?: ISOString }`
  - Multipart/form-data supported with file field `snapshot`.
  - Saves periodic monitoring frame to `/uploads/proctor/periodic-...`.
  - Records in `ProctorLog` with `type: 'periodic-snapshot'`.
  - **Important:** Does NOT increment `submission.violationCount` or trigger cheat penalties. Creates an ongoing visual audit filmstrip for evaluators.
- `POST /api/proctor/log-violation` *(student)*
  - Body:
    ```json
    {
      "submissionId": "string",
      "type": "tab-switch" | "fullscreen-exit" | "devtools-opened" | "screenshot-attempt" | "copy-paste-attempt" | "multiple-faces" | "no-face" | "camera-blocked" | "camera-obstructed" | "right-click-attempt" | "print-screen-attempt" | "audio-multiple-voices",
      "details": "string",
      "snapshotBase64": "string (optional)"
    }
    ```
  - Increments `submission.violationCount`, appends tag to `submission.proctorFlags`.
  - Auto-flags submission (`status: 'flagged-for-review'`) if count exceeds `VIOLATION_FLAG_THRESHOLD`.
- `POST /api/proctor/snapshot` *(student)*
  - Multipart/form-data: `snapshot`, `submissionId`, `type`
  - Persists violation webcam capture to local disk.
- `GET /api/proctor/report/:submissionId` *(teacher, admin)*
  - Returns comprehensive Proctoring Audit Report:
    - Candidate info and assessment metadata
    - Initial admission verification snapshot & timestamp
    - Chronological periodic session filmstrip frames
    - Full security violation incidents with severity tags and timestamp trail
    - Flagged status and review actions

---

## 6. Results, Leaderboard & Certificates (`/api/results`)
*Authentication required.*

- `GET /api/results/leaderboard/:examId` *(all roles)*
  - Ranked leaderboard with live Socket.io broadcast.
- `GET /api/results/exam/:examId` *(teacher, admin)*
  - Aggregate statistics: pass/fail ratio, score distribution.
- `GET /api/results/submission/:submissionId` *(all roles)*
  - Scorecard breakdown and answers review.
- `GET /api/results/:id/certificate` *(all roles)*
  - Generates and streams official PDF certificate if score passes cutoff.

---

## 7. Platform Administration (`/api/admin`)
*Admin role required.*

- `GET /api/admin/overview` - Platform high-level KPIs.
- `GET /api/admin/users` - Paginated user management.
- `PATCH /api/admin/users/:id/role` - Role promotion/demotion.
- `DELETE /api/admin/users/:id` - Delete user account.
- `GET /api/admin/exams` - Platform-wide exams list.
- `GET /api/admin/violations` - Flagged submissions audit queue.
- `PATCH /api/admin/violations/:id/status` - Dismiss or confirm security flag.
