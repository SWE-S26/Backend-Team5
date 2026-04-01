import express from 'express';
import pinoHttp from 'pino-http';
import integrationRouter from './modules/integration/router.integration';
import { errorHandler } from './shared/errors/errorHandlerMiddleware';
import invalidRouter from './shared/errors/router.invalid';
import logger from './shared/logger/logger';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import shutDown from './config/shutDown';

const app = express();

export const allowedOrigins = [
  'http://localhost:4123/api/docs',
  'http://localhost:3000',
  process.env.HOST_URL,
  process.env.SWAGGER_URL,
];

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(pinoHttp({ logger }));
app.use(cookieParser());
app.use('/api', integrationRouter);
app.use(invalidRouter);
app.use(errorHandler);

process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);

export default app;
