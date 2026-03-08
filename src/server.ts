import express from 'express';
import { initializeConfig } from './config/initializeConfig';
import integrationRouter from './modules/integration/router.integration';

const port = process.env.PORT || 4123;
const app = express();
app.use(express.json());
app.use('/api', integrationRouter);
const start = async () => {
  try {
    await initializeConfig();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

start();
