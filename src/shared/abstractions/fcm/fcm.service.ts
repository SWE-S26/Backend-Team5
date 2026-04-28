import * as admin from 'firebase-admin';
import { getMessaging } from '../../../config/firebase';
import logger from '../../logger/logger';
import FcmToken from '../../models/models.fcm-token';
import { Types } from 'mongoose';

export type FcmNotificationPayload = {
  notificationId: string;
  to: string;
  read: boolean;
  activityType: string;
  actor: {
    userId: string;
    displayName: string;
    avatarUrl?: string;
  };
  target: {
    targetType: string;
    targetId: string;
    title?: string;
    trackId?: string;
    commentText?: string;
    mentionedUserProfileLink?: string;
  };
  isBlockingActor: boolean;
  isFollowingActor: boolean;
  createdAt: string;
};

type FcmSendResult = {
  successCount: number;
  failureCount: number;
  deletedTokens: string[];
};

function buildSystemNotification(notification: FcmNotificationPayload): {
  title: string;
  body: string;
  imageUrl?: string;
} {
  switch (notification.activityType) {
    case 'track_liked':
      return {
        title: `${notification.actor.displayName} liked your track`,
        body: notification.target.title ?? '',
        imageUrl: notification.actor.avatarUrl,
      };
    case 'track_commented':
      return {
        title: `${notification.actor.displayName} commented on your track`,
        body: notification.target.commentText
          ? notification.target.commentText.length > 80
            ? notification.target.commentText.slice(0, 80) + '...'
            : notification.target.commentText
          : (notification.target.title ?? ''),
        imageUrl: notification.actor.avatarUrl,
      };
    case 'user_mentioned':
      return {
        title: `${notification.actor.displayName} mentioned you`,
        body: notification.target.commentText
          ? notification.target.commentText.length > 80
            ? notification.target.commentText.slice(0, 80) + '...'
            : notification.target.commentText
          : '',
        imageUrl: notification.actor.avatarUrl,
      };
    case 'track_reposted':
      return {
        title: `${notification.actor.displayName} reposted your track`,
        body: notification.target.title ?? '',
        imageUrl: notification.actor.avatarUrl,
      };
    case 'user_followed':
      return {
        title: `${notification.actor.displayName} started following you`,
        body: 'Tap to view their profile',
        imageUrl: notification.actor.avatarUrl,
      };
    case 'new_track':
      return {
        title: `New track from ${notification.actor.displayName}`,
        body: notification.target.title ?? '',
        imageUrl: notification.actor.avatarUrl,
      };
    default:
      return {
        title: 'New activity',
        body: '',
        imageUrl: notification.actor.avatarUrl,
      };
  }
}

export class FcmService {
  async sendToUser(
    userId: string,
    payload: FcmNotificationPayload,
  ): Promise<FcmSendResult> {
    const tokens = await FcmToken.find({
      userId: new Types.ObjectId(userId),
    })
      .select('token')
      .lean<{ token: string }[]>();

    if (tokens.length === 0) {
      return { successCount: 0, failureCount: 0, deletedTokens: [] };
    }

    const tokenValues = tokens.map((t) => t.token);
    const systemNotification = buildSystemNotification(payload);

    const message: admin.messaging.MulticastMessage = {
      tokens: tokenValues,
      notification: {
        title: systemNotification.title,
        body: systemNotification.body,
        ...(systemNotification.imageUrl
          ? { image: systemNotification.imageUrl }
          : {}),
      },
      data: {
        notificationId: payload.notificationId,
        to: payload.to,
        read: String(payload.read),
        activityType: payload.activityType,
        actorUserId: payload.actor.userId,
        actorDisplayName: payload.actor.displayName,
        actorAvatarUrl: payload.actor.avatarUrl ?? '',
        targetTargetType: payload.target.targetType,
        targetTargetId: payload.target.targetId,
        targetTitle: payload.target.title ?? '',
        targetTrackId: payload.target.trackId ?? '',
        targetCommentText: payload.target.commentText ?? '',
        targetMentionedUserProfileLink:
          payload.target.mentionedUserProfileLink ?? '',
        isBlockingActor: String(payload.isBlockingActor),
        isFollowingActor: String(payload.isFollowingActor),
        createdAt: payload.createdAt,
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'notifications',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    try {
      const messaging = getMessaging();
      const response = await messaging.sendEachForMulticast(message);

      const deletedTokens: string[] = [];

      if (response.failureCount > 0) {
        response.responses.forEach((resp, index) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              deletedTokens.push(tokenValues[index]);
            }
          }
        });
      }

      if (deletedTokens.length > 0) {
        await FcmToken.deleteMany({ token: { $in: deletedTokens } });
        logger.info(
          `[FCM] Cleaned up ${deletedTokens.length} invalid tokens for user ${userId}`,
        );
      }

      logger.info(
        `[FCM] Sent to user ${userId}: ${response.successCount} success, ${response.failureCount} failed`,
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        deletedTokens,
      };
    } catch (error) {
      logger.error(`[FCM] Failed to send to user ${userId}: ${error}`);
      return {
        successCount: 0,
        failureCount: tokenValues.length,
        deletedTokens: [],
      };
    }
  }
}

const fcmService = new FcmService();
export default fcmService;
