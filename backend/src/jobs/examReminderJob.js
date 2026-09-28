const cron = require('node-cron');
const mongoose = require('mongoose');
const Exam = require('../models/Exam');
const User = require('../models/User');
const { notifyExamStartingSoon } = require('../services/notificationService');

/**
 * Checks for exams starting in the next 15 minutes and sends reminder notifications
 */
const checkUpcomingExams = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return 0;
    }

    const now = new Date();
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);

    // Find exams starting between now and next 15 minutes that haven't been reminded
    const upcomingExams = await Exam.find({
      startTime: { $gte: now, $lte: fifteenMinutesFromNow },
      reminderSent: { $ne: true }
    });

    if (upcomingExams.length === 0) return 0;

    console.log(`⏰ [ExamReminderJob] Found ${upcomingExams.length} upcoming exam(s) starting in next 15 minutes.`);

    for (const exam of upcomingExams) {
      // Find all registered students for reminder
      const students = await User.find({ role: 'student' }).select('_id');
      const studentIds = students.map((s) => s._id);

      if (studentIds.length > 0) {
        await notifyExamStartingSoon({ studentIds, exam });
      }

      exam.reminderSent = true;
      await exam.save();

      console.log(`📢 [ExamReminderJob] Sent starting soon reminders for "${exam.title}" to ${studentIds.length} candidate(s).`);
    }

    return upcomingExams.length;
  } catch (error) {
    console.error('❌ [ExamReminderJob] Error checking upcoming exams:', error.message);
    return 0;
  }
};

/**
 * Start recurring background cron job (runs every minute)
 */
const startExamReminderJob = () => {
  // Run once every minute
  const task = cron.schedule('* * * * *', async () => {
    await checkUpcomingExams();
  });
  console.log('⏳ [ExamReminderJob] Scheduled to check upcoming exams every minute.');
  return task;
};

module.exports = {
  checkUpcomingExams,
  startExamReminderJob
};
