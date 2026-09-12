const mongoose = require('mongoose');
const logger = require('../utils/logger');


const env = require("./env");

async function connectDB(){
  const db_uri = env.MONGO_URI;
  if(!db_uri) throw new Error('MONGODB_URI is not set in env');


  mongoose.connection.on('error', (err) => logger.error('MongoDB connection error', { error: err.message }));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
 
  await mongoose.connect(db_uri);
  logger.info('MongoDB connected');
}

async function disconnectDB() {
  await mongoose.connection.close();
  logger.info('MongoDB disconnected gracefully');
}


module.exports = {
  connectDB,
  disconnectDB
}