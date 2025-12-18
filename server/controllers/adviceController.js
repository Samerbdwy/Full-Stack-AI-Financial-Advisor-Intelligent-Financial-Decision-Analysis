const geminiService = require('../services/geminiService');

// @desc    Get financial advice
// @route   POST /api/advice
// @access  Public
const getAdvice = async (req, res, next) => {
  try {
    const { question } = req.body;
    
    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a financial question'
      });
    }
    
    const cleanQuestion = question.trim();
    console.log(`📋 User question: "${cleanQuestion}"`);
    
    // Get AI advice from Gemini
    const { verdict, reason } = await geminiService.getFinancialAdvice(cleanQuestion);
    console.log('✅ Gemini response:', { verdict, reason });
    
    res.status(200).json({
      success: true,
      data: {
        question: cleanQuestion,
        verdict,
        reason,
        createdAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to process your request. Please try again.'
    });
  }
};

// @desc    Get query history
// @route   GET /api/advice/history
// @access  Public
const getHistory = async (req, res, next) => {
  try {
    // For now, return empty array since we're not using MongoDB yet
    res.status(200).json({
      success: true,
      data: [],
      message: 'History feature coming soon'
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch history'
    });
  }
};

// Export the functions
module.exports = {
  getAdvice,
  getHistory
};