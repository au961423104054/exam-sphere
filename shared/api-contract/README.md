# ExamSphere - API Contract & Route Groups

This directory serves as the centralized API contract definition between the `backend`, `web-frontend`, and `mobile-app` teams. Detailed OpenAPI / Swagger specifications and Postman collections will be maintained here by the backend lead.

---

## Planned API Route Groups

All REST endpoints are prefixed with `/api` and return standardized JSON responses.

```json
{
  "success": true,
  "data": {},
  "message": "Optional status message"
}
```

### 1. Authentication & Authorization (`/api/auth`)
- `POST /api/auth/register` - Register a new user account (student / teacher)
- `POST /api/auth/login` - Authenticate user credentials and issue JWT
- `POST /api/auth/oauth` - Social OAuth authentication (Google / GitHub)
- `POST /api/auth/refresh` - Refresh expired access tokens
- `POST /api/auth/logout` - Invalidate current session

### 2. User Management (`/api/users`)
- `GET /api/users/me` - Retrieve authenticated user profile
- `PUT /api/users/me` - Update personal profile information
- `GET /api/users` - List users (Admin / Teacher filtered by organization)
- `GET /api/users/:id` - Get specific user details
- `PUT /api/users/:id/role` - Update user role (Admin only)

### 3. Exam Management (`/api/exams`)
- `POST /api/exams` - Create a new exam
- `GET /api/exams` - List accessible exams (filtered by student/teacher/org)
- `GET /api/exams/:id` - Retrieve exam details and metadata
- `PUT /api/exams/:id` - Update exam configurations and scheduling
- `DELETE /api/exams/:id` - Archive or remove an exam

### 4. Question Management (`/api/questions`)
- `POST /api/questions` - Create a new question for an exam
- `GET /api/questions/exam/:examId` - List questions associated with an exam
- `GET /api/questions/:id` - Retrieve single question details
- `PUT /api/questions/:id` - Update question content, options, and marks
- `DELETE /api/questions/:id` - Remove question from an exam

### 5. Exam Submissions & Taking (`/api/submissions`)
- `POST /api/submissions/start` - Initialize exam attempt session
- `POST /api/submissions/:id/answers` - Save / autosave question answers
- `POST /api/submissions/:id/submit` - Finalize and submit the exam
- `GET /api/submissions/:id` - Retrieve candidate submission status

### 6. Proctoring & Security (`/api/proctor`)
- `POST /api/proctor/log` - Record proctoring violation incident (tab switch, face detection flag)
- `POST /api/proctor/snapshot` - Upload and link webcam snapshot to incident
- `GET /api/proctor/session/:submissionId` - Fetch all proctoring logs for a candidate submission

### 7. Results & Analytics (`/api/results`)
- `GET /api/results/exam/:examId` - Get aggregate exam results and statistics (Teacher/Admin)
- `GET /api/results/submission/:submissionId` - Get detailed score card and answer breakdown
- `GET /api/results/leaderboard/:examId` - Fetch ranked leaderboard for completed exam

### 8. Notifications (`/api/notifications`)
- `GET /api/notifications` - Retrieve in-app notifications for authenticated user
- `PUT /api/notifications/:id/read` - Mark a specific notification as read
- `POST /api/notifications/fcm-token` - Register or update device FCM token for push notifications

### 9. Organizations (`/api/orgs`)
- `POST /api/orgs` - Create a new organization profile
- `GET /api/orgs/:id` - Fetch organization details and settings
- `PUT /api/orgs/:id` - Update organization profile and member policies
