const dotenv = require("dotenv");

dotenv.config();

const requiredEnvVariables = [
  "PORT",
  "MONGO_URI",
  "CLIENT_URL",
  "NODE_ENV",
  "LOG_LEVEL",
];

requiredEnvVariables.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  CLIENT_URL:process.env.CLIENT_URL,
  NODE_ENV: process.env.NODE_ENV,
  LOG_LEVEL: process.env.LOG_LEVEL,
};
