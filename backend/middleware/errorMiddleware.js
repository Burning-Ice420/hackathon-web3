const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, status: 404 };
  }

  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, status: 400 };
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, status: 400 };
  }

  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, status: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, status: 401 };
  }

  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, status: 429 };
  }

  if (err.message && err.message.includes('insufficient funds')) {
    const message = 'Insufficient funds for transaction';
    error = { message, status: 400 };
  }

  if (err.message && err.message.includes('user rejected')) {
    const message = 'Transaction rejected by user';
    error = { message, status: 400 };
  }

  if (err.message && err.message.includes('already voted')) {
    const message = 'User has already voted on this proposal';
    error = { message, status: 400 };
  }

  if (err.message && err.message.includes('proposal not found')) {
    const message = 'Proposal not found';
    error = { message, status: 404 };
  }

  if (err.message && err.message.includes('proposal expired')) {
    const message = 'Proposal has expired';
    error = { message, status: 400 };
  }

  const statusCode = error.status || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

process.on('unhandledRejection', (err, promise) => {
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  process.exit(1);
});

module.exports = {
  notFound,
  errorHandler,
  asyncHandler,
  AppError
};