const { Server } = require('socket.io');

let io = null;

/**
 * Initialize Socket.io server
 * @param {import('http').Server} server
 */
const initSocket = (server) => {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    // 1. Join Exam Session Room
    socket.on('join:exam', ({ examId, role = 'student', studentId, name }) => {
      if (!examId) return;
      const examRoom = `exam:${examId}`;
      socket.join(examRoom);

      // If proctor/teacher/admin, join proctor oversight room
      if (role === 'teacher' || role === 'admin') {
        const proctorRoom = `exam:${examId}:proctors`;
        socket.join(proctorRoom);
        console.log(`👨‍🏫 Proctor joined room: ${proctorRoom} (socket: ${socket.id})`);
      } else {
        console.log(`🎓 Candidate ${name || studentId} joined room: ${examRoom}`);
      }
    });

    // 2. Periodic Live Snapshot Frame Transmission
    socket.on('proctor:snapshot-frame', ({ examId, submissionId, studentId, studentName, snapshotUrl, frameData }) => {
      if (!examId) return;
      // Broadcast live webcam frame directly to teachers/proctors monitoring this assessment
      io.to(`exam:${examId}:proctors`).emit('proctor:live-frame', {
        submissionId,
        studentId,
        studentName,
        snapshotUrl: snapshotUrl || frameData,
        timestamp: new Date()
      });
    });

    // 3. Client-side Face Detection & Security Flag Ingestion
    socket.on('proctor:flag', ({ examId, submissionId, studentId, studentName, type, snapshotUrl }) => {
      if (!examId) return;
      io.to(`exam:${examId}:proctors`).emit('proctor:incident-alert', {
        submissionId,
        studentId,
        studentName,
        type, // 'no-face' | 'multiple-faces' | 'tab-switch'
        snapshotUrl,
        timestamp: new Date()
      });
    });

    // Leave rooms on disconnect
    socket.on('disconnect', () => {
      // Automatic cleanup handled by socket.io
    });
  });

  console.log('⚡ Socket.io real-time proctoring and leaderboard service initialized.');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized yet. Call initSocket(server) first.');
  }
  return io;
};

/**
 * Broadcast live leaderboard update to all candidates and proctors in an exam room
 */
const broadcastLeaderboardUpdate = (examId, leaderboard) => {
  if (!io || !examId) return;
  io.to(`exam:${examId}`).emit('leaderboard:update', {
    examId,
    leaderboard,
    updatedAt: new Date()
  });
};

/**
 * Broadcast live proctoring security alert to proctors
 */
const broadcastProctorAlert = (examId, alert) => {
  if (!io || !examId) return;
  io.to(`exam:${examId}:proctors`).emit('proctor:incident-alert', {
    ...alert,
    timestamp: new Date()
  });
};

module.exports = {
  initSocket,
  getIO,
  broadcastLeaderboardUpdate,
  broadcastProctorAlert
};
