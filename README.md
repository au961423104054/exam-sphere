# ExamSphere

> A full-featured MERN examination and proctoring platform featuring a React.js web portal, React Native mobile application, and a Node.js / Express / MongoDB backend.

---

## Overview

**ExamSphere** provides academic institutions and educators with an end-to-end platform to author assessments, administer scheduled exams, monitor test integrity with automated proctoring, and evaluate student submissions instantly.

The platform is organized as a monorepo containing three core sub-applications alongside shared API contracts and documentation:
- **`backend`**: Node.js, Express, and MongoDB Atlas REST & WebSocket API.
- **`web-frontend`**: React.js single-page application for teachers, administrators, and web candidates.
- **`mobile-app`**: React Native & Expo mobile application for student exam taking and push alerts.

---

## Tech Stack

| Layer / Service | Technology | Hosting / Platform | Responsibility |
| :--- | :--- | :--- | :--- |
| **Web Frontend** | React.js (SPA) | Netlify | Teacher exam builder, admin console, web exam-taking interface |
| **Mobile App** | React Native, Expo | Expo Application Services (EAS) | Cross-platform student exam application for iOS & Android |
| **Backend API** | Node.js, Express.js | Render | REST API, role-based access control, auto-evaluation engine |
| **Database** | MongoDB | MongoDB Atlas | Multi-tenant NoSQL document database |
| **Real-Time Engine** | Socket.io | Node.js / Render | Live proctoring incident streaming & competitive leaderboards |
| **Media Storage** | Cloudinary | Cloudinary CDN | Proctoring webcam snapshot capture and certificate PDF storage |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Google Cloud | Push notifications for upcoming exams and released grades |
| **Job Queue & Scheduling** | BullMQ & `node-cron` | Redis / Render Worker | Time-based exam start/stop triggers and background report tasks |

---

## Monorepo Structure

```text
exam-sphere/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Cloudinary, FCM, and Redis configurations
│   │   ├── controllers/     # HTTP request controllers
│   │   ├── middleware/      # JWT auth, RBAC, and error handlers
│   │   ├── models/          # Mongoose data models
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic & 3rd-party integrations
│   │   └── utils/           # Helper functions and validators
│   └── .env.example         # Backend environment variables template
├── web-frontend/
│   ├── src/
│   │   ├── assets/          # Static images, styles, and icons
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React Context providers (Auth, Socket)
│   │   ├── hooks/           # Custom React hooks (useTimer, useProctor)
│   │   ├── layouts/         # Layout wrappers (Auth, Dashboard, Exam)
│   │   ├── pages/           # Route views (Login, ExamBuilder, ExamRunner)
│   │   ├── services/        # Axios API clients & WebSocket services
│   │   └── utils/           # Formatters, constants, and validators
│   └── .env.example         # Web frontend environment template
├── mobile-app/
│   ├── src/
│   │   ├── assets/          # Images, logos, and fonts
│   │   ├── components/      # Mobile UI components
│   │   ├── context/         # State management context providers
│   │   ├── navigation/      # React Navigation stacks and tabs
│   │   ├── screens/         # Mobile screens (Auth, Exams, TestRunner, Results)
│   │   ├── services/        # Mobile API and socket connection clients
│   │   └── utils/           # Mobile utilities and helpers
│   └── .env.example         # Mobile app environment template
├── shared/
│   ├── api-contract/        # REST route specifications and Postman collections
│   └── db-schema.md         # High-level database schema documentation
├── docs/
│   ├── architecture.md      # Detailed system architecture and data flow
│   └── phase-roadmap.md     # 4-phase project implementation roadmap
├── .github/
│   ├── ISSUE_TEMPLATE/      # Issue templates
│   ├── workflows/           # CI/CD GitHub Actions workflows
│   └── PULL_REQUEST_TEMPLATE.md # PR submission checklist
├── .gitattributes           # Git line-ending normalization rules
├── .gitignore               # Ignored dependencies, build artifacts, and secrets
├── LICENSE                  # MIT License
└── README.md                # Project documentation and setup guide
```

---

## Getting Started & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or `pnpm` / `yarn`)
- **Git**
- **Expo Go App** (for testing mobile app on physical devices) or Android/iOS Emulator

---

### 1. Backend Setup (`backend/`)

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy the sample environment file and configure variables:
   ```bash
   cp .env.example .env
   ```
   *Fill in your MongoDB Atlas URI, JWT secret, Cloudinary credentials, and FCM keys.*
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server with live reload:
   ```bash
   npm run dev
   ```
   *The backend will be running at `http://localhost:5000`.*

---

### 2. Web Frontend Setup (`web-frontend/`)

1. Open a terminal and navigate to the web frontend directory:
   ```bash
   cd web-frontend
   ```
2. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
   *Ensure `REACT_APP_API_BASE_URL` points to `http://localhost:5000/api`.*
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the React development server:
   ```bash
   npm start
   ```
   *The web portal will open at `http://localhost:3000`.*

---

### 3. Mobile App Setup (`mobile-app/`)

1. Open a terminal and navigate to the mobile app directory:
   ```bash
   cd mobile-app
   ```
2. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
   *Set `EXPO_PUBLIC_API_BASE_URL` to your local machine IP or `http://10.0.2.2:5000/api` for Android emulators.*
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Expo development server:
   ```bash
   npx expo start
   ```
5. Scan the QR code using the **Expo Go** app (Android/iOS) or press `a` for Android Emulator / `i` for iOS Simulator.

---

## Branching & Collaboration Strategy

The repository follows a GitFlow-inspired branching strategy tailored for the 3-person development team:

- **`main`**: Production-ready branch. Deployed to production environments. Direct commits are restricted.
- **`develop`**: Integration branch for current release development. All feature branches branch off and merge back into `develop`.
- **Feature Branches**: Named according to phase and scope:
  - `feature/phase1-auth`
  - `feature/phase1-exam-crud`
  - `feature/phase1-taking-ui`
  - `feature/phase1-grading`
- **Pull Requests**:
  - All PRs target `develop`.
  - Must complete the checklist defined in `.github/PULL_REQUEST_TEMPLATE.md`.
  - Require at least one peer review before merging.

---

## Project Roadmap

- **Phase 1**: Auth, exam CRUD, exam-taking, auto-grading, basic results.
- **Phase 2**: Proctoring (tab-switch, fullscreen, snapshot webcam), analytics, notifications.
- **Phase 3**: Live webcam + face detection, leaderboard, certificates.
- **Phase 4**: Multi-tenancy, admin reports.

See [docs/phase-roadmap.md](file:///c:/Users/Belbin%20Joevit%20B%20S/Downloads/ExamSphere/docs/phase-roadmap.md) for detailed phase breakdowns and team ownership.

---

## License

This project is licensed under the [MIT License](file:///c:/Users/Belbin%20Joevit%20B%20S/Downloads/ExamSphere/LICENSE).
