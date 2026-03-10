import nodemailer, { Transporter } from 'nodemailer';
import 'dotenv/config';
import { tr } from 'zod/v4/locales';

class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.NODE_MAILER_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.NODE_MAILER_USER,
        pass: process.env.NODE_MAILER_PASS,
      },
    });
  }

  async isEmailServiceWorking() {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.log('Email Service Error: ', error);
    }
  }
}

const emailService = new EmailService();

export default emailService;
