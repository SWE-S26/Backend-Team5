import express from 'express';
import pinoHttp from 'pino-http';
import integrationRouter from './modules/integration/router.integration';
import { errorHandler } from './shared/errors/errorHandlerMiddleware';
import invalidRouter from './shared/errors/router.invalid';
import logger from './shared/logger/logger';
import authRouter from './modules/auth/auth.routes';

const app = express();

app.use(express.json());
app.use(pinoHttp({ logger }));
app.use('/api', integrationRouter);
app.use('/auth', authRouter);
app.use(invalidRouter);
app.use(errorHandler);

export default app;
