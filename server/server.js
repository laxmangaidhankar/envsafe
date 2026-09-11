require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./src/app');
const env = require('./src/config/env');

const { connectDB } = require('./src/config/db');
const { startCleanupService } = require('./src/services/cleanupService');
const { initSocketService } = require('./src/services/socketService');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      env.CLIENT_URL
    ],
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true
  }
});

// Make Socket.io available to controllers
app.set('io', io);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'CipherDrop E2EE Engine',
    timestamp: new Date().toISOString()
  });
});

const startServer = async () => {
  try {
    await connectDB();

    initSocketService(io);

    // Remove expired rooms/files every 30 seconds
    startCleanupService(io, 30000);

    server.listen(env.PORT, () => {
      console.log(`CipherDrop Backend Server running on port ${env.PORT}`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};




startServer();