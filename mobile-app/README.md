# ExamSphere - Mobile Application

Cross-platform mobile examination candidate application for **ExamSphere** built with React Native and the Expo managed workflow.

---

## 📱 Features (Phase 1 & Foundational)

- **Authentication Flow**: Candidate registration and sign-in with role validation.
- **Secure Token Storage**: Encrypted JWT storage with `expo-secure-store` and automatic Axios request interception.
- **Dynamic Configuration**: API base URL dynamically injected from `app.config.js` and `.env` variables via `expo-constants`.
- **Exam Dashboard**: Scheduled and available examination discovery with duration, question count, and scoring metadata.
- **Exam-Taking Runner**: Client-side exam interface with countdown timers, question palette navigation, and response state tracking.
- **Results & Evaluation**: Instant score calculation and pass/fail candidate performance reporting.
- **Offline Resume Foundation**: Local answer caching and state recovery via `@react-native-async-storage/async-storage`.
- **Push Notification Foundation**: Push alert capability via `expo-notifications`.
- **Real-Time Proctoring Foundation**: Bi-directional event integration via `socket.io-client`.

---

## 📁 Project Structure

```text
mobile-app/
├── assets/                     # Enterprise brand assets, icons & illustrations
│   ├── branding/               # ExamSphere logotypes and standalone marks
│   ├── icons/                  # High-density navigation and feature icon set
│   └── illustrations/          # Empty states and assessment status graphics
├── src/
│   ├── components/             # Reusable UI components (Buttons, Cards, Inputs)
│   ├── context/                # Global React contexts (AuthContext)
│   ├── navigation/             # Navigation stacks (AuthStack, MainStack, RootNavigator)
│   ├── screens/                # Screen views (Login, Register, ExamList, ExamDetail, ExamTaking, Results)
│   ├── services/               # API clients, Axios interceptor, and backend gateways
│   └── utils/                  # Formatters, offline storage, and helper utilities
├── .env.example                # Template for environment variables
├── app.config.js               # Dynamic Expo app configuration
├── app.json                    # Static Expo manifest
├── eas.json                    # Expo Application Services (EAS) build profiles
├── index.js                    # Expo entry point
├── package.json                # Project dependencies and run scripts
└── README.md                   # Documentation and run guide
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v18+` (or `v20+` recommended)
- **npm** or **yarn**
- **Expo Go** app installed on your physical Android or iOS device, OR an Android Studio / Xcode emulator.

### 1. Installation

Navigate to the `mobile-app` directory and install project dependencies:

```bash
cd mobile-app
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure `EXPO_PUBLIC_API_BASE_URL` is set to your reachable backend API URL:
- **Android Emulator**: `http://10.0.2.2:5000/api`
- **iOS Simulator / Localhost**: `http://localhost:5000/api`
- **Physical Device (Expo Go)**: `http://<YOUR_LOCAL_IP>:5000/api` (e.g. `http://192.168.1.100:5000/api`)

### 3. Run the Development Server

Start the Expo development server:

```bash
npx expo start
```

Or run directly targeting a specific platform:

- **Android Emulator / Device**:
  ```bash
  npm run android
  ```
- **iOS Simulator** (macOS only):
  ```bash
  npm run ios
  ```
- **Web Browser**:
  ```bash
  npm run web
  ```

---

## 🧭 Navigation Hierarchy

- **RootNavigator**: Switches between authentication and application stacks.
  - **AuthStack**:
    - `Login`: Candidate email and password sign-in.
    - `Register`: Account creation and role assignment.
  - **MainStack**:
    - `ExamList`: Candidate examination dashboard.
    - `ExamDetail`: Examination instructions, rules, and proctoring requirements.
    - `ExamTaking`: Timed question runner with interactive choices.
    - `Results`: Auto-evaluated scoring summary and performance breakdown.

---

## 📦 Build & EAS Deployment

Build profiles are preconfigured in `eas.json`:

```bash
# Build for internal development client
npx eas-cli build --profile development --platform android

# Build preview APK / IPA for testing
npx eas-cli build --profile preview --platform android

# Build production bundle for app stores
npx eas-cli build --profile production --platform all
```
