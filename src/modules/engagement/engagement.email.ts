import emailService from '../../shared/abstractions/email/EmailService';
import { EngagementRepository } from './engagement.repository';

// Engagement enum for email notifications
enum Engagement {
  REPOST_TRACK,
  COMMENT_TRACK,
  LIKE_TRACK,
  REPOST_PLAYLIST,
  COMMENT_PLAYLIST,
  LIKE_PLAYLIST,
}

export class EngagementEmailService {
  constructor(private readonly repository: EngagementRepository) {}

  async sendTrackLikeEmail(trackId: string, userId: string): Promise<void> {
    try {
      const [trackWithOwner, userDisplayName] = await Promise.all([
        this.repository.findTrackWithOwner(trackId),
        this.repository.findUserDisplayName(userId),
      ]);

      if (
        !trackWithOwner ||
        !trackWithOwner.owner ||
        trackWithOwner.posterId.toString() === userId
      ) {
        return; // Don't send email if owner likes their own track
      }

      // Check user notification settings
      const ownerSettings = await this.repository.findUserNotificationSettings(
        trackWithOwner.posterId.toString(),
      );

      // Check if user wants to receive email notifications for likes
      if (
        !ownerSettings ||
        (ownerSettings.likesAndPlaysOnYourPost !== 'email' &&
          ownerSettings.likesAndPlaysOnYourPost !== 'both')
      ) {
        return; // Don't send email if user has disabled email notifications for likes
      }

      // to be changed when frontend is done with it
      const activityURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tracks/${trackId}`;
      await emailService.sendEngagementNotification(
        trackWithOwner.owner.email,
        userDisplayName || 'A user',
        activityURL,
        Engagement.LIKE_TRACK,
        trackWithOwner.basicInfo.title,
      );
    } catch (error) {
      console.error('Error sending track like email:', error);
    }
  }

  async sendTrackRepostEmail(trackId: string, userId: string): Promise<void> {
    try {
      const [trackWithOwner, userDisplayName] = await Promise.all([
        this.repository.findTrackWithOwner(trackId),
        this.repository.findUserDisplayName(userId),
      ]);

      if (
        !trackWithOwner ||
        !trackWithOwner.owner ||
        trackWithOwner.posterId.toString() === userId
      ) {
        return; // Don't send email if owner reposts their own track
      }

      // Check user notification settings
      const ownerSettings = await this.repository.findUserNotificationSettings(
        trackWithOwner.posterId.toString(),
      );

      // Check if user wants to receive email notifications for reposts
      if (
        !ownerSettings ||
        (ownerSettings.repostOfYourPost !== 'email' &&
          ownerSettings.repostOfYourPost !== 'both')
      ) {
        return; // Don't send email if user has disabled email notifications for reposts
      }

      // to be changed when frontend is done with it
      const activityURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tracks/${trackId}`;
      await emailService.sendEngagementNotification(
        trackWithOwner.owner.email,
        userDisplayName || 'A user',
        activityURL,
        Engagement.REPOST_TRACK,
        trackWithOwner.basicInfo.title,
      );
    } catch (error) {
      console.error('Error sending track repost email:', error);
    }
  }

  async sendPlaylistLikeEmail(
    playlistId: string,
    userId: string,
  ): Promise<void> {
    try {
      const [playlistWithOwner, userDisplayName] = await Promise.all([
        this.repository.findPlaylistWithOwner(playlistId),
        this.repository.findUserDisplayName(userId),
      ]);

      if (
        !playlistWithOwner ||
        !playlistWithOwner.owner ||
        playlistWithOwner.artistId.toString() === userId
      ) {
        return; // Don't send email if owner likes their own playlist
      }

      // Check user notification settings
      const ownerSettings = await this.repository.findUserNotificationSettings(
        playlistWithOwner.artistId.toString(),
      );

      // Check if user wants to receive email notifications for likes
      if (
        !ownerSettings ||
        (ownerSettings.likesAndPlaysOnYourPost !== 'email' &&
          ownerSettings.likesAndPlaysOnYourPost !== 'both')
      ) {
        return; // Don't send email if user has disabled email notifications for likes
      }

      // to be changed when frontend is done with it
      const activityURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/playlists/${playlistId}`;
      await emailService.sendEngagementNotification(
        playlistWithOwner.owner.email,
        userDisplayName || 'A user',
        activityURL,
        Engagement.LIKE_PLAYLIST,
        playlistWithOwner.title,
      );
    } catch (error) {
      console.error('Error sending playlist like email:', error);
    }
  }

  async sendPlaylistRepostEmail(
    playlistId: string,
    userId: string,
  ): Promise<void> {
    try {
      const [playlistWithOwner, userDisplayName] = await Promise.all([
        this.repository.findPlaylistWithOwner(playlistId),
        this.repository.findUserDisplayName(userId),
      ]);

      if (
        !playlistWithOwner ||
        !playlistWithOwner.owner ||
        playlistWithOwner.artistId.toString() === userId
      ) {
        return; // Don't send email if owner reposts their own playlist
      }

      // Check user notification settings
      const ownerSettings = await this.repository.findUserNotificationSettings(
        playlistWithOwner.artistId.toString(),
      );

      // Check if user wants to receive email notifications for reposts
      if (
        !ownerSettings ||
        (ownerSettings.repostOfYourPost !== 'email' &&
          ownerSettings.repostOfYourPost !== 'both')
      ) {
        return; // Don't send email if user has disabled email notifications for reposts
      }

      // to be changed when frontend is done with it
      const activityURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/playlists/${playlistId}`;
      await emailService.sendEngagementNotification(
        playlistWithOwner.owner.email,
        userDisplayName || 'A user',
        activityURL,
        Engagement.REPOST_PLAYLIST,
        playlistWithOwner.title,
      );
    } catch (error) {
      console.error('Error sending playlist repost email:', error);
    }
  }

  async sendTrackCommentEmail(trackId: string, userId: string): Promise<void> {
    try {
      const [trackWithOwner, userDisplayName] = await Promise.all([
        this.repository.findTrackWithOwner(trackId),
        this.repository.findUserDisplayName(userId),
      ]);

      if (
        !trackWithOwner ||
        !trackWithOwner.owner ||
        trackWithOwner.posterId.toString() === userId
      ) {
        return; // Don't send email if owner comments on their own track
      }

      // Check user notification settings
      const ownerSettings = await this.repository.findUserNotificationSettings(
        trackWithOwner.posterId.toString(),
      );

      // Check if user wants to receive email notifications for comments
      if (
        !ownerSettings ||
        (ownerSettings.commentOnYourPost !== 'email' &&
          ownerSettings.commentOnYourPost !== 'both')
      ) {
        return; // Don't send email if user has disabled email notifications for comments
      }

      // to be changed when frontend is done with it
      const activityURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/tracks/${trackId}`;
      await emailService.sendEngagementNotification(
        trackWithOwner.owner.email,
        userDisplayName || 'A user',
        activityURL,
        Engagement.COMMENT_TRACK,
        trackWithOwner.basicInfo.title,
      );
    } catch (error) {
      console.error('Error sending track comment email:', error);
    }
  }
}
