const pino = require('pino');
const env = require('../config/env');

const logger = pino({
  level: env.LOG_LEVEL,

  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard'
          }
        }
      : undefined
});

module.exports = logger;