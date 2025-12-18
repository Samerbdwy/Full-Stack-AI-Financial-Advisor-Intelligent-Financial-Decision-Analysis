const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Remove deprecated options for mongoose 6+
      // useNewUrlParser and useUnifiedTopology are no longer needed
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    console.error('Please check:');
    console.error('1. MongoDB is running (mongod command)');
    console.error('2. MONGODB_URI in .env is correct');
    console.error('3. Network connectivity');
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;