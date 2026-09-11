const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const env = require('./config/env');
const router = require('./routes/index');

const app = express();

// CORS
app.use(
  cors({
    origin: [
      env.CLIENT_URL
    ],
    credentials: true
  })
);

// Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// API routes
app.use('/api/v1', router);

module.exports = app;