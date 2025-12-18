const express = require('express');
const router = express.Router();
const {
  getAdvice,
  getHistory
} = require('../controllers/adviceController');

// POST /api/advice - Get financial advice
router.post('/', getAdvice);

// GET /api/advice/history - Get query history
router.get('/history', getHistory);

module.exports = router;