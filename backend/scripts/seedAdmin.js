const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD must be configured in environment variables (.env)');
    process.exit(1);
  }

  try {
    await connectDB();

    const normalizedEmail = adminEmail.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.role === 'admin') {
        console.log(`ℹ️  Admin user already exists with email: ${normalizedEmail}. Skipping seed.`);
      } else {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log(`ℹ️  Existing user with email: ${normalizedEmail} upgraded to admin role.`);
      }
      await mongoose.connection.close();
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const newAdmin = await User.create({
      name: 'Platform Administrator',
      email: normalizedEmail,
      passwordHash,
      role: 'admin',
      oauthProvider: 'local'
    });

    console.log(`✅ Successfully created admin user: ${newAdmin.email} [ID: ${newAdmin._id}]`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running seedAdmin:', error.message);
    await mongoose.connection.close().catch(() => {});
    process.exit(1);
  }
};

seedAdmin();
