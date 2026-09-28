const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

const seedTeacher = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('teacher123', salt);

    // 1. Ensure teacher@examsphere.com
    await User.findOneAndUpdate(
      { email: 'teacher@examsphere.com' },
      {
        name: 'Faculty Instructor',
        email: 'teacher@examsphere.com',
        passwordHash,
        role: 'teacher',
        oauthProvider: 'local'
      },
      { upsert: true, new: true }
    );

    // 2. Ensure teacher@examsphere.edu
    await User.findOneAndUpdate(
      { email: 'teacher@examsphere.edu' },
      {
        name: 'Faculty Instructor',
        email: 'teacher@examsphere.edu',
        passwordHash,
        role: 'teacher',
        oauthProvider: 'local'
      },
      { upsert: true, new: true }
    );

    console.log('✅ Teacher accounts configured successfully:');
    console.log('   Email: teacher@examsphere.edu (or teacher@examsphere.com)');
    console.log('   Password: teacher123');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding teacher:', err.message);
    process.exit(1);
  }
};

seedTeacher();
