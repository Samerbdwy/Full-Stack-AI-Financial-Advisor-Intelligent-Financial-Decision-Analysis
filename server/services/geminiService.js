const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // Using gemini-2.5-flash-lite as requested
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      // Optional: Disable thinking for faster responses
      // generationConfig: {
      //   thinkingBudget: 0
      // }
    });
  }

  async getFinancialAdvice(userQuestion) {
    try {
      // Craft a precise prompt for consistent DO/DON'T format
      const prompt = `Act as a financial advisor. For the user's financial question, give ONLY a verdict and one-sentence reason in this EXACT format:

VERDICT: [DO or DON'T]
REASON: [One clear reason under 15 words]

Rules:
1. Always start with VERDICT: followed by either DO or DON'T
2. Then on new line: REASON: followed by brief reason
3. Keep reason practical, concise, and under 15 words
4. Consider: saving vs spending, debt avoidance, emergency funds, long-term goals
5. If uncertain, choose DON'T

Question: "${userQuestion}"

Response:`;

      console.log('🔍 Sending to Gemini 2.5 Flash Lite:', userQuestion.substring(0, 50) + '...');
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('🤖 Gemini raw response:', text);
      
      return this.parseResponse(text);
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      
      // Provide fallback advice if API fails
      return {
        verdict: "DON'T",
        reason: "Unable to get AI advice. Consider consulting a financial advisor."
      };
    }
  }

  parseResponse(text) {
    console.log('📝 Parsing Gemini response:', text);
    
    // Clean the response
    const cleanText = text.trim();
    
    // Default values
    let verdict = "DON'T";
    let reason = "Consider all financial implications before deciding.";
    
    // Method 1: Look for VERDICT: pattern
    const lines = cleanText.split('\n').map(line => line.trim()).filter(line => line);
    
    for (const line of lines) {
      // Check for VERDICT: pattern
      if (line.toUpperCase().startsWith('VERDICT:')) {
        const verdictPart = line.substring(8).trim().toUpperCase();
        if (verdictPart.includes("DO") || verdictPart.includes("DON'T")) {
          verdict = verdictPart.includes("DON'T") ? "DON'T" : "DO";
        }
      }
      
      // Check for REASON: pattern
      if (line.toUpperCase().startsWith('REASON:')) {
        reason = line.substring(7).trim();
        // Capitalize first letter
        reason = reason.charAt(0).toUpperCase() + reason.slice(1);
      }
    }
    
    // Method 2: If no REASON: found, use second line or create one
    if (reason === "Consider all financial implications before deciding." && lines.length >= 2) {
      // Try to extract reason from second line
      const potentialReason = lines.find(line => 
        !line.toUpperCase().startsWith('VERDICT:') && 
        line.length > 10
      );
      if (potentialReason) {
        reason = potentialReason;
      }
    }
    
    // Ensure reason is not empty
    if (!reason || reason.trim().length === 0) {
      reason = verdict === "DO" 
        ? "This aligns with good financial practices." 
        : "This helps avoid unnecessary financial risk.";
    }
    
    // Trim reason length
    reason = reason.substring(0, 150);
    
    console.log('✅ Parsed result:', { verdict, reason });
    
    return { verdict, reason };
  }
}

module.exports = new GeminiService();