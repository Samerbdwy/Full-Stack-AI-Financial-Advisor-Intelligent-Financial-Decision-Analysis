const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);
  
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  
  // MongoDB errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  }
  
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }
  
  // Duplicate key
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  }
  
  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;