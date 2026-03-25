import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'PROD';

const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? 'warn' : 'debug'),
  transport: !isProduction
    ? { target: 'pino-pretty' } // colored, human-readable in dev
    : undefined, // raw JSON in production
});

export default logger;
