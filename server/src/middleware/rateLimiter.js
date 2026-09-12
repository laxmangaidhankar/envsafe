const rateLimit = require('express-rate-limit');

// Rate limiter for room creation: max 15 rooms per 15 minutes per IP
const roomCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    error: 'Too many room creation requests from this IP. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for joining / checking rooms: max 60 attempts per 15 minutes per IP
const roomJoinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    error: 'Too many join attempts. Rate limit exceeded.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for uploading encrypted files: max 30 uploads per 10 minutes per IP
const fileUploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: {
    error: 'File upload rate limit exceeded. Please wait before uploading again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  roomCreateLimiter,
  roomJoinLimiter,
  fileUploadLimiter
};
