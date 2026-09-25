# ExamSphere - Backend API

Backend REST and WebSocket API service for ExamSphere built with Node.js, Express.js, and MongoDB Atlas.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended, v20+ LTS supported)
- [npm](https://www.npmjs.com/) (v9 or higher)
- [MongoDB Atlas](https://www.mongodb.com/atlas) account and database connection URI

---

## Getting Started

### 1. Navigate to the backend directory

```bash
cd backend
```

### 2. Configure Environment Variables

Copy the template environment configuration file and adjust variables as necessary:

```bash
cp .env.example .env
```

Ensure the following variables are configured in `.env`:
- `PORT`: Port on which the Express server listens (default: `5000`)
- `MONGO_URI`: MongoDB Atlas connection URI
- `JWT_SECRET`: Secret key for signing access JWTs
- `JWT_REFRESH_SECRET`: Secret key for signing refresh JWTs
- `CLIENT_URL`: URL of the web frontend client (e.g., `http://localhost:3000`)
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name for media assets
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret

### 3. Install Dependencies

Install all production and development dependencies:

```bash
npm install
```

### 4. Run the Server

#### Development Mode (with automatic restart via nodemon)

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

---

## Health Check Endpoint

Once the server is running, verify its health status:

- **Method**: `GET`
- **URL**: `http://localhost:5000/api/health`
- **Response**:
  ```json
  {
    "status": "ok"
  }
  ```

---

## Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `start` | `node src/server.js` | Runs the server in production mode using Node.js |
| `dev` | `nodemon src/server.js` | Runs the server in development mode with automatic reload |
