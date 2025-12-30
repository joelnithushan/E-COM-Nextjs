import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../src/config/database.js';
import User from '../src/models/User.js';
import { hashPassword } from '../src/utils/password.util.js';
import { USER_ROLES } from '../src/config/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function createAdmin() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Get admin details from command line arguments or use defaults
    const email = process.argv[2] || 'admin@zyra.lk';
    const password = process.argv[3] || 'Admin123!';
    const name = process.argv[4] || 'Admin User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      if (existingAdmin.role === USER_ROLES.ADMIN) {
        console.log(`✅ Admin user already exists: ${email}`);
        console.log('   You can login with this email and password');
        await mongoose.disconnect();
        return;
      } else {
        // Update existing user to admin
        existingAdmin.role = USER_ROLES.ADMIN;
        existingAdmin.password = await hashPassword(password);
        await existingAdmin.save();
        console.log(`✅ Updated user to admin: ${email}`);
        await mongoose.disconnect();
        return;
      }
    }

    // Create admin user
    const hashedPassword = await hashPassword(password);
    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: USER_ROLES.ADMIN,
      isEmailVerified: true,
      isActive: true,
    });

    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Name: ${name}`);
    console.log('\n🔐 You can now login at: http://localhost:3000/login');
    console.log('   After login, you will be redirected to: http://localhost:3000/admin');

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('   Email already exists. Use a different email or update the existing user.');
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
createAdmin();

