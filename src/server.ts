import express from 'express';
import emailService from './shared/abstractions/email/EmailService';
// import { initializeConfig } from './config/initializeConfig';

const port = process.env.PORT || 4123;
const app = express();
app.use(express.json());

const start = async () => {
  try {
    // await initializeConfig();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
};

start();
