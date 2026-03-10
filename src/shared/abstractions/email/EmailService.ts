import nodemailer, { Transporter } from 'nodemailer';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

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

  async sendResetPassowordLink(username: string, userEmail: string) {
    try {
      // get paths of html files and image assets
      const filePath = path.join(
        __dirname,
        './templates/requestPasswordReset.html',
      );
      const imagePath = path.join(__dirname, './templates/assets/beatza.png');
      let htmlContent = fs.readFileSync(filePath, { encoding: 'utf-8' });

      // replace in html file with proper params
      htmlContent = htmlContent.replace('[User]', username);
      htmlContent = htmlContent.replace(
        '[resetLink]',
        'https://beatza-swagger.netlify.app/',
      );

      // assuming email is correct
      const info = await this.transporter.sendMail({
        from: `Beatza Team <${process.env.NODE_MAILER_USER}>`,
        to: userEmail,
        subject: `Request to change ${username}'s BeatZa password`,
        html: htmlContent,
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
    }
  }
}

const emailService = new EmailService();

export default emailService;
