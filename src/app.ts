import express from 'express';
import pinoHttp from 'pino-http';
import integrationRouter from './modules/integration/router.integration';
import { errorHandler } from './shared/errors/errorHandlerMiddleware';
import invalidRouter from './shared/errors/router.invalid';
import logger from './shared/logger/logger';
import cookieParser from 'cookie-parser';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(cors({ origin: '*' }));
app.use(pinoHttp({ logger }));
app.use(cookieParser());
app.use('/api', integrationRouter);
app.use(invalidRouter);
app.use(errorHandler);

export default app;
