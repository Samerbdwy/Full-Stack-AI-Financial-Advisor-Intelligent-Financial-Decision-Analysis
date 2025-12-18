const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/financial_advisor')
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.log('❌ MongoDB connection failed:', err.message);
  console.log('⚠️ Running in demo mode with in-memory storage');
});

// Initialize Gemini AI 2.5 Flash Lite
let geminiModel = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite", // Using your specified model
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 150,
        topP: 0.8,
        topK: 40,
      }
    });
    console.log('✅ Gemini 2.5 Flash Lite initialized successfully');
  } catch (error) {
    console.log('❌ Gemini initialization failed:', error.message);
    geminiModel = null;
  }
} else {
  console.log('⚠️ GEMINI_API_KEY not found in .env file');
  console.log('⚠️ Add your key to server/.env: GEMINI_API_KEY=your_key_here');
  geminiModel = null;
}

// Create User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  avatarColor: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// In-memory user storage (fallback)
let users = [
  {
    id: 1,
    name: 'Demo User',
    email: 'demo@example.com',
    password: '$2a$10$X5K8zQNQNQNQNQNQNQNQN.3O9wR8zQNQNQNQNQNQNQNQNQNQN', // demo123
    avatarColor: '#3B82F6',
    createdAt: new Date()
  }
];

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Check MongoDB connection
const checkMongoDB = () => {
  return mongoose.connection.readyState === 1;
};

// Gemini AI function
const getGeminiAdvice = async (question) => {
  if (!geminiModel) {
    throw new Error('Gemini AI not available');
  }

  try {
    const prompt = `You are a financial advisor expert. Analyze this financial decision question and provide specific, actionable advice.

USER'S QUESTION: "${question}"

REQUIRED RESPONSE FORMAT:
VERDICT: [DO or DON'T]
REASON: [Specific, detailed reason addressing their exact situation. 20-40 words. Mention concrete factors like emergency funds, debt, income, timeline, opportunity cost.]

Important: Be specific to their situation. Give practical reasons. Consider savings vs spending, debt avoidance, long-term goals.

Now provide your financial advice:`;

    console.log('🤖 Calling Gemini 2.5 Flash Lite...');
    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📄 Gemini raw response:', text);
    
    // Parse response
    let verdict = "DON'T";
    let reason = "Consider consulting a financial advisor for personalized advice.";
    
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (const line of lines) {
      const upperLine = line.toUpperCase();
      
      if (upperLine.startsWith('VERDICT:')) {
        const verdictText = line.substring(8).trim().toUpperCase();
        if (verdictText.includes("DO") || verdictText.includes("DON'T")) {
          verdict = verdictText.includes("DON'T") ? "DON'T" : "DO";
        }
      }
      
      if (upperLine.startsWith('REASON:')) {
        reason = line.substring(7).trim();
        reason = reason.charAt(0).toUpperCase() + reason.slice(1);
      }
    }
    
    // Fallback parsing
    if (reason === "Consider consulting a financial advisor for personalized advice.") {
      const detailedLines = lines.filter(line => 
        !line.toUpperCase().startsWith('VERDICT:') && 
        line.length > 20
      );
      
      if (detailedLines.length > 0) {
        reason = detailedLines.reduce((longest, current) => 
          current.length > longest.length ? current : longest
        );
      }
    }
    
    console.log('✅ Gemini parsed result:', { verdict, reason });
    return { verdict, reason };
    
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    throw new Error('Failed to get AI advice: ' + error.message);
  }
};

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // If MongoDB is connected, use it
    if (checkMongoDB()) {
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User already exists'
        });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create user
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        avatarColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'][Math.floor(Math.random() * 4)]
      });
      
      // Create token
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );
      
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarColor: user.avatarColor
        }
      });
    } 
    // If MongoDB is not connected, use in-memory storage
    else {
      // In-memory logic (same as before)
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User already exists'
        });
      }
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      const newUser = {
        id: users.length + 1,
        name,
        email,
        password: hashedPassword,
        avatarColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'][Math.floor(Math.random() * 4)],
        createdAt: new Date()
      };
      
      users.push(newUser);
      
      const token = jwt.sign(
        { id: newUser.id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );
      
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          avatarColor: newUser.avatarColor
        }
      });
    }
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // If MongoDB is connected
    if (checkMongoDB()) {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );
      
      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarColor: user.avatarColor
        }
      });
    } 
    // In-memory storage
    else {
      const user = users.find(u => u.email === email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }
      
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );
      
      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarColor: user.avatarColor
        }
      });
    }
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    if (checkMongoDB()) {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      return res.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarColor: user.avatarColor
        }
      });
    } else {
      const user = users.find(u => u.id === decoded.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      return res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarColor: user.avatarColor
        }
      });
    }
    
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Financial Advisor API is running',
    timestamp: new Date().toISOString(),
    mongodb: checkMongoDB() ? 'Connected' : 'Not connected (using in-memory)',
    gemini: geminiModel ? 'Available (2.5 Flash Lite)' : 'Not available',
    model: 'Gemini 2.5 Flash Lite'
  });
});

// Main AI Advice endpoint
app.post('/api/advice', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || question.trim() === '') {
      return res.status(400).json({ 
        success: false,
        error: 'Please provide a financial question' 
      });
    }
    
    const userQuestion = question.trim();
    console.log(`📝 User question: "${userQuestion}"`);
    
    // Try to use Gemini AI
    if (geminiModel) {
      try {
        const { verdict, reason } = await getGeminiAdvice(userQuestion);
        
        return res.json({
          success: true,
          data: {
            question: userQuestion,
            verdict,
            reason,
            createdAt: new Date().toISOString(),
            model: 'gemini-2.5-flash-lite',
            source: 'Gemini AI'
          }
        });
      } catch (geminiError) {
        console.log('⚠️ Gemini failed, using fallback:', geminiError.message);
        // Fall through to mock response
      }
    }
    
    // Fallback mock response if Gemini fails or not available
    const mockResponses = [
      { 
        verdict: "DON'T", 
        reason: "Prioritize saving for experiences over material possessions. Vacations create lasting memories while tech depreciates quickly." 
      },
      { 
        verdict: "DO", 
        reason: "Invest in productivity tools if they directly increase your income or reduce essential costs. Quality equipment can pay for itself." 
      },
      { 
        verdict: "DON'T", 
        reason: "Build at least 3-6 months of emergency savings before making any non-essential purchases. Financial security comes first." 
      },
      { 
        verdict: "DO", 
        reason: "Consider this purchase if you can pay cash without affecting your debt payments, retirement savings, or emergency fund." 
      }
    ];
    
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    res.json({
      success: true,
      data: {
        question: userQuestion,
        verdict: randomResponse.verdict,
        reason: randomResponse.reason,
        createdAt: new Date().toISOString(),
        model: 'fallback-mock',
        source: 'Mock Response (Gemini not available)'
      }
    });
    
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Unable to process your request. Please try again in a moment.'
    });
  }
});

// Check Gemini status
app.get('/api/gemini-status', (req, res) => {
  res.json({
    success: true,
    geminiAvailable: !!geminiModel,
    model: 'gemini-2.5-flash-lite',
    message: geminiModel ? 'Gemini AI is ready' : 'Gemini AI is not available'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running: http://localhost:${PORT}`);
  console.log(`🔐 Auth endpoints: /api/auth/register, /api/auth/login`);
  console.log(`🤖 Demo user: demo@example.com / demo123`);
  console.log(`📊 MongoDB: ${checkMongoDB() ? 'Connected' : 'Not connected (using in-memory)'}`);
  console.log(`🧠 Gemini: ${geminiModel ? '2.5 Flash Lite Ready' : 'Not available - check .env file'}`);
  
  if (!process.env.GEMINI_API_KEY) {
    console.log('\n⚠️  IMPORTANT: Add Gemini API key to server/.env file:');
    console.log('GEMINI_API_KEY=your_key_here');
    console.log('Get key from: https://makersuite.google.com/app/apikey\n');
  }
});