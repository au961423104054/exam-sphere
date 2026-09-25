# ExamSphere - Web Frontend

The web portal for **ExamSphere** — a full-featured MERN examination and automated proctoring platform. Built using **React**, **Vite**, and **Tailwind CSS**.

---

## Tech Stack & Core Libraries

- **Framework & Build**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **HTTP Client**: [Axios](https://axios-http.com/) (configured with JWT request interceptor)
- **Server State / Caching**: [@tanstack/react-query](https://tanstack.com/query)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/)
- **Client State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Real-Time WebSockets**: [Socket.io Client](https://socket.io/)
- **Hosting / Deployment**: [Netlify](https://www.netlify.com/) (configured via `netlify.toml`)

---

## Directory Structure

```text
web-frontend/
├── netlify.toml          # Netlify build and SPA rewrite configuration
├── package.json          # Project dependencies and npm scripts
├── postcss.config.js     # PostCSS plugins (Tailwind, Autoprefixer)
├── tailwind.config.js    # Tailwind theme & content configuration
├── vite.config.js        # Vite bundler and development server config
├── index.html            # Single page application HTML entry point
├── .env.example          # Environment variables template
├── README.md             # Setup and run documentation
└── src/
    ├── assets/           # Static images, icons, and media files
    ├── components/       # Reusable UI components (buttons, modals, inputs)
    ├── context/          # React Context providers (Auth, Socket)
    ├── hooks/            # Custom React hooks (useTimer, useProctor)
    ├── layouts/          # Layout containers (AuthLayout, DashboardLayout)
    ├── pages/            # View pages (/login, /register, dashboards)
    ├── services/         # Axios API clients (api.js) and socket connections
    └── utils/            # Helper functions, formatters, and constants
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher (v22+ supported)
- **npm**: v9.0.0 or higher

### 1. Environment Configuration

Copy the example environment file into `.env`:

```bash
cp .env.example .env
```

Ensure `VITE_API_BASE_URL` points to your active backend API (default: `http://localhost:5000/api`):

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

> **Note**: In Vite, client-side environment variables must start with the `VITE_` prefix and are accessed via `import.meta.env.VITE_*`.

### 2. Install Dependencies

Install all dependencies listed in `package.json`:

```bash
npm install
```

### 3. Run Development Server

Start the local development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The portal will be accessible at:
```
http://localhost:3000
```

### 4. Build for Production

Compile optimized production assets into the `dist/` directory:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## Routes Overview

| Route | View Component | Description |
| :--- | :--- | :--- |
| `/` | `Home.jsx` | Navigation portal hub & Tailwind verification view |
| `/login` | `Login.jsx` | User sign-in interface |
| `/register` | `Register.jsx` | Account registration interface |
| `/student/dashboard` | `StudentDashboard.jsx` | Candidate portal: exams, history & scores |
| `/teacher/dashboard` | `TeacherDashboard.jsx` | Educator portal: exam authoring & proctoring |
| `/admin/dashboard` | `AdminDashboard.jsx` | Admin console: user management & platform settings |

---

## Deployment (Netlify)

This project includes a `netlify.toml` preconfigured for single-page applications:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Redirects**: Rewrites all routes (`/*`) to `/index.html` with status `200` to support client-side React Router routing.
