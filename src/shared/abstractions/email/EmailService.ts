import nodemailer, { Transporter } from 'nodemailer';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import logger from '../../logger/logger';

interface EmailOptions {
  userEmail: string;
  subject: string;
  htmlContent: string;
}

enum Engagement {
  REPOST_TRACK,
  COMMENT_TRACK,
  LIKE_TRACK,
  REPOST_PLAYLIST,
  COMMENT_PLAYLIST,
  LIKE_PLAYLIST,
}

type ActivityParams = {
  action: string;
  buttonValue: string;
};

class EmailService {
  private readonly transporter: Transporter;

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

  private getHtmlTemplate(templateName: string) {
    const filePath = path.join(__dirname, `./templates/${templateName}.html`);
    return fs.readFileSync(filePath, { encoding: 'utf-8' });
  }

  private async sendEmail(options: EmailOptions) {
    try {
      logger.info(
        `Sending email to ${options.userEmail} with subject: ${options.subject}`,
      );
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
      logger.error(`Failed to send email to ${options.userEmail}: ${error}`);
      return false;
    }
  }

  async sendResetPassowordLink(
    username: string,
    userEmail: string,
    resetLink: string,
  ) {
    let htmlContent = this.getHtmlTemplate('requestPasswordReset');
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
    let htmlContent = this.getHtmlTemplate('verifyAccount');
    htmlContent = htmlContent
      .replace('[User]', username)
      .replace('[verifyLink]', verifyLink);
    return await this.sendEmail({
      userEmail: userEmail,
      subject: `Welcome to BeatZa!`,
      htmlContent: htmlContent,
    });
  }

  async sendNewMessageNotification(
    userEmail: string,
    sender: string,
    messageURL: string,
  ) {
    let htmlContent = this.getHtmlTemplate('newMessageSent');
    htmlContent = htmlContent
      .replace('[Sender]', sender)
      .replace('[messageURL]', messageURL);

    return await this.sendEmail({
      userEmail: userEmail,
      subject: `You got a new DM from ${sender}`,
      htmlContent: htmlContent,
    });
  }

  private getProperEngagementValues(Action: Engagement, activiyValue: string) {
    const activityParams: ActivityParams = {
      action: '',
      buttonValue: '',
    };
    switch (Action) {
      case Engagement.REPOST_TRACK:
        activityParams['action'] = `reposted your track : ${activiyValue}`;
        activityParams['buttonValue'] = 'Check it out 〉';
        break;
      case Engagement.REPOST_PLAYLIST:
        activityParams['action'] = `reposted your playlist : ${activiyValue}`;
        activityParams['buttonValue'] = 'Check it out 〉';
        break;
      case Engagement.COMMENT_TRACK:
        activityParams['action'] = `commented on your track : ${activiyValue}`;
        activityParams['buttonValue'] = 'View in Comment 〉';
        break;
      case Engagement.COMMENT_PLAYLIST:
        activityParams['action'] =
          `commented on your PLAYLIST : ${activiyValue}`;
        activityParams['buttonValue'] = 'View in Comment 〉';
        break;
      case Engagement.LIKE_PLAYLIST:
        activityParams['action'] = `likes your playlist : ${activiyValue}`;
        activityParams['buttonValue'] = 'Check it out 〉';
        break;
      case Engagement.LIKE_TRACK:
        activityParams['action'] = `likes your track  : ${activiyValue}`;
        activityParams['buttonValue'] = 'Check it out 〉';
        break;
      default:
        throw new Error('Unsupported engagement type');
    }
    return activityParams;
  }

  async sendEngagementNotification(
    userEmail: string,
    sender: string,
    activityURL: string,
    action: Engagement,
    activiyValue: string,
  ) {
    const activityParams = this.getProperEngagementValues(action, activiyValue);

    let htmlContent = this.getHtmlTemplate('newActivity');
    htmlContent = htmlContent
      .replace('[Sender]', sender)
      .replace('[ActivityURL]', activityURL)
      .replace('[Action]', activityParams.action)
      .replace('[ButtonValue]', activityParams.buttonValue)
      .replace('[EmailValue]', userEmail);

    return await this.sendEmail({
      userEmail: userEmail,
      subject: `${sender} ${activityParams.action}`,
      htmlContent: htmlContent,
    });
  }

  async sendNewFollowerRelease(
    userEmail: string,
    sender: string,
    relaseName: string,
    releaseURL: string,
  ) {
    let htmlContent = this.getHtmlTemplate('newRelease');
    htmlContent = htmlContent
      .replace('[Sender]', sender)
      .replace('[messageURL]', releaseURL)
      .replace('[EmailValue]', userEmail)
      .replace('[newRelease]', relaseName);

    return await this.sendEmail({
      userEmail: userEmail,
      subject: `New Release 🔥`,
      htmlContent: htmlContent,
    });
  }
}

const emailService = new EmailService();

export default emailService;
