const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    minlength: [5, 'Question must be at least 5 characters'],
    maxlength: [500, 'Question cannot exceed 500 characters']
  },
  verdict: {
    type: String,
    required: true,
    enum: {
      values: ['DO', 'DON\'T'],
      message: 'Verdict must be either DO or DON\'T'
    }
  },
  reason: {
    type: String,
    required: true,
    maxlength: [200, 'Reason cannot exceed 200 characters']
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  }
}, {
  timestamps: true  // Adds createdAt and updatedAt automatically
});

// Create index for faster queries
QuerySchema.index({ createdAt: -1 });

const Query = mongoose.model('Query', QuerySchema);
module.exports = Query;