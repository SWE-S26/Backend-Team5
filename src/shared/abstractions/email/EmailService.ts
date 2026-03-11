import nodemailer, { Transporter } from 'nodemailer';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

interface EmailOptions {
  userEmail: string;
  subject: string;
  htmlContent: string;
}

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

  async sendEmail(options: EmailOptions) {
    try {
      const imagePath = path.join(__dirname, './templates/assets/beatza.png');
      // assuming email is correct
      const info = await this.transporter.sendMail({
        from: `Beatza Team <${process.env.NODE_MAILER_USER}>`,
        to: options.userEmail,
        subject: options.subject,
        html: options.htmlContent,
        attachments: [
          {
            filename: 'beatza.png',
            path: imagePath,
            cid: 'beatza-logo',
          },
        ],
      });
      return true;
    } catch (error) {
      console.log('Email Service Error: ', error);
      return false;
    }
  }

  async sendResetPassowordLink(
    username: string,
    userEmail: string,
    resetLink: string,
  ) {
    const filePath = path.join(
      __dirname,
      './templates/requestPasswordReset.html',
    );
    let htmlContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    htmlContent = htmlContent.replace('[User]', username);
    htmlContent = htmlContent.replace(
      '[resetLink]',
      'https://beatza-swagger.netlify.app/',
    );
    return await this.sendEmail({
      userEmail: userEmail,
      subject: `Request to change ${username}'s BeatZa password`,
      htmlContent: htmlContent,
    });
  }

  async sendVerifyAccountLink(
    username: string,
    userEmail: string,
    verifyLink: string,
  ) {
    const filePath = path.join(__dirname, './templates/verifyAccount.html');
    let htmlContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    htmlContent = htmlContent
      .replace('[User]', username)
      .replace('[verifyLink]', verifyLink);
    return await this.sendEmail({
      userEmail: userEmail,
      subject: `Welcome to BeatZa!`,
      htmlContent: htmlContent,
    });
  }
}

const emailService = new EmailService();

export default emailService;
