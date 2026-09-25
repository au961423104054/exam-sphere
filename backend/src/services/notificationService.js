const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const Notification = require('../models/Notification');
const User = require('../models/User');

// --- 1. Email Service Initialization (Nodemailer) ---
let emailTransporter = null;

const getEmailTransporter = () => {
  if (emailTransporter) return emailTransporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Development fallback transporter (logs to console)
    emailTransporter = {
      sendMail: async (mailOptions) => {
        console.log(`📧 [Email Fallback] To: ${mailOptions.to} | Subject: "${mailOptions.subject}"`);
        return { messageId: `mock_${Date.now()}` };
      }
    };
  }
  return emailTransporter;
};

// --- 2. Firebase Push Notification Service (FCM) ---
let isFirebaseInitialized = false;

const initFirebase = () => {
  if (isFirebaseInitialized) return true;

  const projectId = process.env.FCM_PROJECT_ID;
  const clientEmail = process.env.FCM_CLIENT_EMAIL;
  let privateKey = process.env.FCM_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey && !projectId.includes('your_')) {
    try {
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
      isFirebaseInitialized = true;
      return true;
    } catch (err) {
      console.warn('⚠️ FCM initialization error:', err.message);
      return false;
    }
  }
  return false;
};

const sendPush = async ({ token, title, body, data = {} }) => {
  if (!token) return null;

  const initialized = initFirebase();
  if (initialized) {
    try {
      const response = await admin.messaging().send({
        token,
        notification: { title, body },
        data: Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        )
      });
      return response;
    } catch (error) {
      console.warn('⚠️ Failed to send FCM push notification:', error.message);
      return null;
    }
  }

  // Fallback logging for development
  console.log(`📱 [Push Notification Fallback] Token: ${token.substring(0, 10)}... | Title: "${title}" | Body: "${body}"`);
  return { success: true, simulated: true };
};

// --- 3. Core Notification Dispatcher ---
const sendNotification = async ({
  userId,
  type = 'proctor-alert',
  message,
  metadata = {},
  subject,
  email,
  fcmToken
}) => {
  try {
    // 1. Persist notification in MongoDB
    const notification = await Notification.create({
      userId,
      type,
      message,
      read: false,
      metadata
    });

    // 2. Fetch user profile for email/token if not provided
    let targetEmail = email;
    let targetToken = fcmToken;

    if (!targetEmail || !targetToken) {
      const user = await User.findById(userId).select('email fcmToken name');
      if (user) {
        if (!targetEmail) targetEmail = user.email;
        if (!targetToken) targetToken = user.fcmToken;
      }
    }

    // 3. Send Email
    if (targetEmail) {
      const transporter = getEmailTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"ExamSphere" <noreply@examsphere.com>',
        to: targetEmail,
        subject: subject || `ExamSphere Notification: ${type}`,
        text: message,
        html: `<div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #4F46E5;">ExamSphere Alert</h2>
          <p>${message}</p>
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
          <small style="color: #6B7280;">This is an automated notification from ExamSphere.</small>
        </div>`
      }).catch((e) => console.warn('Email dispatch warning:', e.message));
    }

    // 4. Send Push Notification
    if (targetToken) {
      await sendPush({
        token: targetToken,
        title: subject || 'ExamSphere Alert',
        body: message,
        data: { notificationId: notification._id.toString(), type }
      }).catch((e) => console.warn('Push dispatch warning:', e.message));
    }

    return notification;
  } catch (error) {
    console.error('Failed to dispatch notification:', error.message);
    return null;
  }
};

// --- 4. Event Trigger Functions ---

// Trigger: Exam Scheduled
const notifyExamScheduled = async ({ studentIds = [], exam }) => {
  const promises = studentIds.map((studentId) =>
    sendNotification({
      userId: studentId,
      type: 'exam-scheduled',
      subject: `New Exam Scheduled: ${exam.title}`,
      message: `You have been scheduled for "${exam.title}" on ${new Date(exam.startTime).toLocaleString()}.`,
      metadata: { examId: exam._id, startTime: exam.startTime }
    })
  );
  return Promise.all(promises);
};

// Trigger: Exam Starting Soon (within 15 minutes)
const notifyExamStartingSoon = async ({ studentIds = [], exam }) => {
  const promises = studentIds.map((studentId) =>
    sendNotification({
      userId: studentId,
      type: 'exam-starting-soon',
      subject: `Exam Starting Soon: ${exam.title}`,
      message: `Assessment "${exam.title}" will begin shortly in less than 15 minutes. Please ensure your camera and workspace are ready.`,
      metadata: { examId: exam._id, startTime: exam.startTime }
    })
  );
  return Promise.all(promises);
};

// Trigger: Results Published
const notifyResultsPublished = async ({ studentId, exam, submission }) => {
  return sendNotification({
    userId: studentId,
    type: 'result-published',
    subject: `Results Published: ${exam.title}`,
    message: `Your results for assessment "${exam.title}" are now available. Total Score: ${submission.score}.`,
    metadata: { examId: exam._id, submissionId: submission._id, score: submission.score }
  });
};

// Trigger: Submission Flagged For Review
const notifySubmissionFlagged = async ({ creatorId, exam, submission, violationType }) => {
  return sendNotification({
    userId: creatorId,
    type: 'proctor-alert',
    subject: `⚠️ Proctor Alert: Submission Flagged for Review`,
    message: `Submission ${submission._id} for assessment "${exam.title}" has been flagged for review due to ${submission.violationCount} proctoring violations (latest: ${violationType}).`,
    metadata: {
      submissionId: submission._id,
      examId: exam._id,
      studentId: submission.studentId,
      violationCount: submission.violationCount
    }
  });
};

module.exports = {
  sendNotification,
  notifyExamScheduled,
  notifyExamStartingSoon,
  notifyResultsPublished,
  notifySubmissionFlagged
};
