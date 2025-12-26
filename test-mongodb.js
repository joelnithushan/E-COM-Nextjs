/**
 * Quick MongoDB Connection Test Script
 * Run this to test your MongoDB connection string
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from backend directory
dotenv.config({ path: join(__dirname, '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in backend/.env');
  console.log('\nPlease add your MongoDB connection string to backend/.env:');
  console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ecommerce?retryWrites=true&w=majority');
  process.exit(1);
}

console.log('🔍 Testing MongoDB Connection...\n');
console.log('Connection String:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide password

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('\n✅ MongoDB Connection: SUCCESS!');
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Ready State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    // Test a simple operation
    return mongoose.connection.db.admin().ping();
  })
  .then(() => {
    console.log('\n✅ Database Ping: SUCCESS!');
    console.log('\n🎉 Your MongoDB connection is working perfectly!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ MongoDB Connection: FAILED');
    console.error('\nError Details:');
    console.error(`   Message: ${error.message}`);
    
    if (error.message.includes('authentication failed')) {
      console.error('\n💡 Possible Issues:');
      console.error('   - Incorrect username or password');
      console.error('   - Special characters in password need URL encoding');
      console.error('   - User doesn\'t have proper permissions');
    } else if (error.message.includes('IP')) {
      console.error('\n💡 Possible Issues:');
      console.error('   - Your IP address is not whitelisted in MongoDB Atlas');
      console.error('   - Go to MongoDB Atlas → Network Access → Add IP Address');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('timeout')) {
      console.error('\n💡 Possible Issues:');
      console.error('   - Incorrect connection string');
      console.error('   - Network/firewall issues');
      console.error('   - MongoDB Atlas cluster is paused');
    }
    
    console.error('\n📖 See MONGODB_SETUP.md for detailed setup instructions');
    process.exit(1);
  });

