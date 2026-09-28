const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
require('../src/models/User');
require('../src/models/Exam');
const Submission = require('../src/models/Submission');
const ProctorLog = require('../src/models/ProctorLog');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const subs = await Submission.find({}).populate('studentId', 'name email').populate('examId', 'title').lean();
  console.log(`=== ALL ${subs.length} SUBMISSIONS IN SYSTEM ===\n`);
  for (const s of subs) {
    const allLogs = await ProctorLog.find({ submissionId: s._id }).lean();
    const violationLogs = allLogs.filter(l => !['periodic-snapshot', 'identity-verification'].includes(l.type));
    console.log(JSON.stringify({
      submissionId: s._id,
      candidateName: s.candidateDetails?.name || s.studentId?.name || 'N/A',
      candidateEmail: s.candidateDetails?.email || s.studentId?.email || 'N/A',
      registerNo: s.candidateDetails?.collegeId || 'N/A',
      examTitle: s.examId?.title || 'N/A',
      status: s.status,
      violationCount: s.violationCount || 0,
      proctorFlags: s.proctorFlags || [],
      totalProctorEvents: allLogs.length,
      violationsDetected: violationLogs.map(v => ({ type: v.type, time: v.timestamp }))
    }, null, 2));
  }
  await mongoose.connection.close();
}
run();
