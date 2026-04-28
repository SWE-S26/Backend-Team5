import { Types } from 'mongoose';
import Notification, {
  INotification,
} from '../../shared/models/models.notification';
import User from '../../shared/models/models.user';
import Track from '../../shared/models/models.track';
import Comment from '../../shared/models/models.comment';
import Following from '../../shared/models/models.following';
import Settings from '../../shared/models/models.settings';
import BlockedList from '../../shared/models/models.blocked-list';
import FcmToken from '../../shared/models/models.fcm-token';
import {
  BadRequestError,
  NotFoundError,
} from '../../shared/errors/responseErrors';

type SettingsNotificationMode = 'email' | 'devices' | 'both' | 'off';

type UserNameDoc = {
  _id: Types.ObjectId;
  displayName: string;
  profileImg?: {
    imgLink?: string;
  };
};

type TrackBasicDoc = {
  _id: Types.ObjectId;
  posterId: Types.ObjectId;
  basicInfo?: {
    title?: string;
  };
};

type CommentDoc = {
  _id: Types.ObjectId;
  trackId: Types.ObjectId;
  content: string;
  mentionedUserId?: Types.ObjectId;
};

type MentionedUserDoc = {
  _id: Types.ObjectId;
  profileLink: string;
};

type FollowersDoc = {
  userId: Types.ObjectId;
  followers: Types.ObjectId[];
};

type FollowerSettingsDoc = {
  userId: Types.ObjectId;
  notifications?: {
    newPostByFollowedUser?: SettingsNotificationMode;
  };
};

export type NotificationRecord = INotification & {
  _id: Types.ObjectId;
};

export class NotificationsRepository {
  // ─── Notification CRUD ────────────────────────────────────────────

  async markAllAsReadForUser(userId: string): Promise<number> {
    const userObjectId = this.parseObjectId(userId, 'user id');

    const result = await Notification.updateMany(
      {
        to: {
          $in: [userObjectId, userId],
        },
        read: false,
      },
      {
        $set: {
          read: true,
        },
      },
    );

    return result.modifiedCount;
  }

  async markAsReadForUser(
    userId: string,
    notificationId: string,
  ): Promise<NotificationRecord | null> {
    const userObjectId = this.parseObjectId(userId, 'user id');
    const notificationObjectId = this.parseObjectId(
      notificationId,
      'notification id',
    );

    return Notification.findOneAndUpdate(
      {
        _id: notificationObjectId,
        to: {
          $in: [userObjectId, userId],
        },
      },
      {
        $set: {
          read: true,
        },
      },
      {
        new: true,
      },
    ).lean<NotificationRecord | null>();
  }

  async findForUser(
    userId: string,
    options?: {
      offset?: number;
      limit?: number;
      read?: boolean;
    },
  ): Promise<NotificationRecord[]> {
    const userObjectId = this.parseObjectId(userId, 'user id');
    const offset = options?.offset ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (Math.max(offset, 1) - 1) * limit;
    const filter: {
      to: { $in: Array<Types.ObjectId | string> };
      read?: boolean;
    } = {
      to: {
        $in: [userObjectId, userId],
      },
    };

    if (options?.read !== undefined) {
      filter.read = options.read;
    }

    return Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<NotificationRecord[]>();
  }

  async countForUser(userId: string, read?: boolean): Promise<number> {
    const userObjectId = this.parseObjectId(userId, 'user id');
    const filter: {
      to: { $in: Array<Types.ObjectId | string> };
      read?: boolean;
    } = {
      to: {
        $in: [userObjectId, userId],
      },
    };

    if (read !== undefined) {
      filter.read = read;
    }

    return Notification.countDocuments(filter);
  }

  async findByIdForUser(
    userId: string,
    notificationId: string,
  ): Promise<NotificationRecord | null> {
    const userObjectId = this.parseObjectId(userId, 'user id');
    const notificationObjectId = this.parseObjectId(
      notificationId,
      'notification id',
    );

    return Notification.findOne({
      _id: notificationObjectId,
      to: {
        $in: [userObjectId, userId],
      },
    }).lean<NotificationRecord | null>();
  }

  async findAll(): Promise<NotificationRecord[]> {
    return Notification.find()
      .sort({ createdAt: -1 })
      .lean<NotificationRecord[]>();
  }

  async findById(id: string): Promise<NotificationRecord | null> {
    const objectId = this.parseObjectId(id, 'notification id');
    return Notification.findById(objectId).lean<NotificationRecord | null>();
  }

  async create(data: Partial<INotification>): Promise<NotificationRecord> {
    const created = await Notification.create(data);
    return this.toNotificationRecord(created);
  }

  async update(
    id: string,
    data: Partial<INotification>,
  ): Promise<NotificationRecord | null> {
    const objectId = this.parseObjectId(id, 'notification id');
    const updated = await Notification.findByIdAndUpdate(objectId, data, {
      new: true,
    });
    if (!updated) return null;
    return this.toNotificationRecord(updated);
  }

  async delete(id: string): Promise<boolean> {
    const objectId = this.parseObjectId(id, 'notification id');
    const result = await Notification.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }

  // ─── Notification Creation ────────────────────────────────────────

  async createLikeNotification(
    actorId: string,
    trackId: string,
  ): Promise<NotificationRecord | null> {
    const actorObjectId = this.parseObjectId(actorId, 'actor id');
    const trackObjectId = this.parseObjectId(trackId, 'track id');

    const [actor, track] = await Promise.all([
      User.findById(actorObjectId)
        .select('_id displayName profileImg.imgLink')
        .lean<UserNameDoc | null>(),
      Track.findById(trackObjectId)
        .select('_id posterId basicInfo.title')
        .lean<TrackBasicDoc | null>(),
    ]);

    if (!actor) NotFoundError('Actor not found');
    if (!track) NotFoundError('Track not found');

    const actorDoc = this.requireFound(actor, 'Actor not found');
    const trackDoc = this.requireFound(track, 'Track not found');

    if (actorDoc._id.equals(trackDoc.posterId)) {
      return null;
    }

    const trackName = this.getTrackTitle(trackDoc.basicInfo?.title);

    const created = await Notification.create({
      to: trackDoc.posterId,
      from: actorDoc._id,
      type: {
        type: 'like',
        referenceId: trackDoc._id,
        payload: {
          actorName: actorDoc.displayName,
          actorId: actorDoc._id,
          avatarURL: actorDoc.profileImg?.imgLink,
          trackName,
          trackId: trackDoc._id,
        },
      },
      read: false,
    });

    return this.toNotificationRecord(created);
  }

  async createCommentNotification(
    actorId: string,
    commentId: string,
  ): Promise<NotificationRecord | null> {
    const actorObjectId = this.parseObjectId(actorId, 'actor id');
    const commentObjectId = this.parseObjectId(commentId, 'comment id');

    const [actor, comment] = await Promise.all([
      User.findById(actorObjectId)
        .select('_id displayName profileImg.imgLink')
        .lean<UserNameDoc | null>(),
      Comment.findById(commentObjectId)
        .select('_id trackId content')
        .lean<CommentDoc | null>(),
    ]);

    if (!actor) NotFoundError('Actor not found');
    if (!comment) NotFoundError('Comment not found');

    const actorDoc = this.requireFound(actor, 'Actor not found');
    const commentDoc = this.requireFound(comment, 'Comment not found');

    const commentText = commentDoc.content?.trim();
    if (!commentText) {
      BadRequestError('Comment text is missing');
    }
    const commentTextValue = commentText ?? '';

    const track = await Track.findById(commentDoc.trackId)
      .select('_id posterId')
      .lean<{ _id: Types.ObjectId; posterId: Types.ObjectId } | null>();

    if (!track) NotFoundError('Track not found');

    const trackDoc = this.requireFound(track, 'Track not found');

    if (actorDoc._id.equals(trackDoc.posterId)) {
      return null;
    }

    const created = await Notification.create({
      to: trackDoc.posterId,
      from: actorDoc._id,
      type: {
        type: 'comment',
        referenceId: commentDoc._id,
        payload: {
          actorName: actorDoc.displayName,
          actorId: actorDoc._id,
          avatarURL: actorDoc.profileImg?.imgLink,
          commentText: commentTextValue,
          trackId: commentDoc.trackId,
        },
      },
      read: false,
    });

    return this.toNotificationRecord(created);
  }

  async createMentionNotification(
    actorId: string,
    commentId: string,
  ): Promise<NotificationRecord | null> {
    const actorObjectId = this.parseObjectId(actorId, 'actor id');
    const commentObjectId = this.parseObjectId(commentId, 'comment id');

    const [actor, comment] = await Promise.all([
      User.findById(actorObjectId)
        .select('_id displayName profileImg.imgLink')
        .lean<UserNameDoc | null>(),
      Comment.findById(commentObjectId)
        .select('_id trackId content mentionedUserId')
        .lean<CommentDoc | null>(),
    ]);

    if (!actor) NotFoundError('Actor not found');
    if (!comment) NotFoundError('Comment not found');

    const actorDoc = this.requireFound(actor, 'Actor not found');
    const commentDoc = this.requireFound(comment, 'Comment not found');

    if (!commentDoc.mentionedUserId) {
      return null;
    }

    if (actorDoc._id.equals(commentDoc.mentionedUserId)) {
      return null;
    }

    const commentText = commentDoc.content?.trim();
    if (!commentText) {
      BadRequestError('Comment text is missing');
    }
    const commentTextValue = commentText ?? '';

    const [track, mentionedUser] = await Promise.all([
      Track.findById(commentDoc.trackId)
        .select('_id')
        .lean<{ _id: Types.ObjectId } | null>(),
      User.findById(commentDoc.mentionedUserId)
        .select('_id profileLink')
        .lean<MentionedUserDoc | null>(),
    ]);

    if (!track) NotFoundError('Track not found');

    const trackDoc = this.requireFound(track, 'Track not found');

    if (!mentionedUser) {
      return null;
    }

    const created = await Notification.create({
      to: mentionedUser._id,
      from: actorDoc._id,
      type: {
        type: 'mention',
        referenceId: commentDoc._id,
        payload: {
          actorName: actorDoc.displayName,
          actorId: actorDoc._id,
          avatarURL: actorDoc.profileImg?.imgLink,
          commentText: commentTextValue,
          trackId: trackDoc._id,
          mentionedUserProfileLink: mentionedUser.profileLink,
        },
      },
      read: false,
    });

    return this.toNotificationRecord(created);
  }

  async createRepostNotification(
    actorId: string,
    trackId: string,
  ): Promise<NotificationRecord | null> {
    const actorObjectId = this.parseObjectId(actorId, 'actor id');
    const trackObjectId = this.parseObjectId(trackId, 'track id');

    const [actor, track] = await Promise.all([
      User.findById(actorObjectId)
        .select('_id displayName profileImg.imgLink')
        .lean<UserNameDoc | null>(),
      Track.findById(trackObjectId)
        .select('_id posterId basicInfo.title')
        .lean<TrackBasicDoc | null>(),
    ]);

    if (!actor) NotFoundError('Actor not found');
    if (!track) NotFoundError('Track not found');

    const actorDoc = this.requireFound(actor, 'Actor not found');
    const trackDoc = this.requireFound(track, 'Track not found');

    if (actorDoc._id.equals(trackDoc.posterId)) {
      return null;
    }

    const trackName = this.getTrackTitle(trackDoc.basicInfo?.title);

    const created = await Notification.create({
      to: trackDoc.posterId,
      from: actorDoc._id,
      type: {
        type: 'repost',
        referenceId: trackDoc._id,
        payload: {
          actorName: actorDoc.displayName,
          actorId: actorDoc._id,
          avatarURL: actorDoc.profileImg?.imgLink,
          trackName,
          trackId: trackDoc._id,
        },
      },
      read: false,
    });

    return this.toNotificationRecord(created);
  }

  async createFollowNotification(
    actorId: string,
    followedUserId: string,
  ): Promise<NotificationRecord | null> {
    const actorObjectId = this.parseObjectId(actorId, 'actor id');
    const followedObjectId = this.parseObjectId(
      followedUserId,
      'followed user id',
    );

    if (actorObjectId.equals(followedObjectId)) {
      return null;
    }

    const [actor, followedUser] = await Promise.all([
      User.findById(actorObjectId)
        .select('_id displayName profileImg.imgLink')
        .lean<UserNameDoc | null>(),
      User.findById(followedObjectId)
        .select('_id')
        .lean<{ _id: Types.ObjectId } | null>(),
    ]);

    if (!actor) NotFoundError('Actor not found');
    if (!followedUser) NotFoundError('Followed user not found');

    const actorDoc = this.requireFound(actor, 'Actor not found');
    const followedUserDoc = this.requireFound(
      followedUser,
      'Followed user not found',
    );

    const created = await Notification.create({
      to: followedUserDoc._id,
      from: actorDoc._id,
      type: {
        type: 'follow',
        referenceId: followedUserDoc._id,
        payload: {
          actorName: actorDoc.displayName,
          actorId: actorDoc._id,
          avatarURL: actorDoc.profileImg?.imgLink,
        },
      },
      read: false,
    });

    return this.toNotificationRecord(created);
  }

  async createNewTrackNotifications(
    actorId: string,
    trackId: string,
  ): Promise<NotificationRecord[]> {
    const actorObjectId = this.parseObjectId(actorId, 'actor id');
    const trackObjectId = this.parseObjectId(trackId, 'track id');

    const [actor, track, followingDoc] = await Promise.all([
      User.findById(actorObjectId)
        .select('_id displayName profileImg.imgLink')
        .lean<UserNameDoc | null>(),
      Track.findById(trackObjectId)
        .select('_id posterId basicInfo.title')
        .lean<TrackBasicDoc | null>(),
      Following.findOne({ userId: actorObjectId })
        .select('userId followers')
        .lean<FollowersDoc | null>(),
    ]);

    if (!actor) NotFoundError('Actor not found');
    if (!track) NotFoundError('Track not found');

    const actorDoc = this.requireFound(actor, 'Actor not found');
    const trackDoc = this.requireFound(track, 'Track not found');

    if (!trackDoc.posterId.equals(actorDoc._id)) {
      BadRequestError('Track does not belong to actor');
    }

    const trackName = this.getTrackTitle(trackDoc.basicInfo?.title);
    const followerIds = (followingDoc?.followers ?? []).filter(
      (followerId) => !followerId.equals(actorDoc._id),
    );

    if (followerIds.length === 0) {
      return [];
    }

    const followerSettings = await Settings.find({
      userId: { $in: followerIds },
    })
      .select('userId notifications.newPostByFollowedUser')
      .lean<FollowerSettingsDoc[]>();

    const preferenceByUserId = new Map<string, SettingsNotificationMode>();
    for (const settings of followerSettings) {
      const preference = settings.notifications?.newPostByFollowedUser;
      if (preference) {
        preferenceByUserId.set(settings.userId.toString(), preference);
      }
    }

    const allowedFollowerIds = followerIds.filter((followerId) => {
      const preference =
        preferenceByUserId.get(followerId.toString()) ?? 'devices';
      return preference === 'devices' || preference === 'both';
    });

    if (allowedFollowerIds.length === 0) {
      return [];
    }

    const insertDocs = allowedFollowerIds.map((followerId) => ({
      to: followerId,
      from: actorDoc._id,
      type: {
        type: 'newTrack' as const,
        referenceId: trackDoc._id,
        payload: {
          actorName: actorDoc.displayName,
          actorId: actorDoc._id,
          avatarURL: actorDoc.profileImg?.imgLink,
          trackName,
          trackId: trackDoc._id,
        },
      },
      read: false,
    }));

    const created = await Notification.insertMany(insertDocs);
    return created.map((doc) => this.toNotificationRecord(doc));
  }

  // ─── Blocking / Following lookups ─────────────────────────────────

  async findBlockingActors(
    actorIds: Types.ObjectId[],
    recipientUserId: Types.ObjectId,
  ): Promise<Set<string>> {
    if (actorIds.length === 0) return new Set();

    const doc = await BlockedList.findOne({ blockerId: recipientUserId })
      .select('blockedIds')
      .lean<{ blockedIds?: Types.ObjectId[] } | null>();

    const blocking = new Set<string>();
    if (doc?.blockedIds) {
      for (const actorId of actorIds) {
        if (doc.blockedIds.some((id) => id.equals(actorId))) {
          blocking.add(actorId.toString());
        }
      }
    }
    return blocking;
  }

  async findFollowedUserIds(userId: Types.ObjectId): Promise<Set<string>> {
    const doc = await Following.findOne({ userId })
      .select('followed')
      .lean<{ followed?: Types.ObjectId[] } | null>();

    return new Set(doc?.followed?.map((id) => id.toString()) ?? []);
  }

  // ─── FCM Token Methods ────────────────────────────────────────────

  async saveFcmToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android',
  ): Promise<void> {
    const userObjectId = this.parseObjectId(userId, 'user id');

    await FcmToken.findOneAndUpdate(
      { token },
      {
        $set: {
          userId: userObjectId,
          platform,
        },
      },
      { upsert: true, new: true },
    );
  }

  async removeFcmToken(token: string): Promise<boolean> {
    const result = await FcmToken.deleteOne({ token });
    return result.deletedCount > 0;
  }

  async removeFcmTokensForUser(userId: string): Promise<number> {
    const userObjectId = this.parseObjectId(userId, 'user id');
    const result = await FcmToken.deleteMany({ userId: userObjectId });
    return result.deletedCount;
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private parseObjectId(id: string, fieldName: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      BadRequestError(`Invalid ${fieldName}`);
    }
    return new Types.ObjectId(id);
  }

  private getTrackTitle(title?: string): string {
    const trimmed = title?.trim() ?? '';
    if (!trimmed) {
      BadRequestError('Track title is missing');
    }
    return trimmed;
  }

  private requireFound<T>(value: T | null | undefined, message: string): T {
    if (value == null) {
      NotFoundError(message);
    }
    return value as T;
  }

  private toNotificationRecord(
    doc: INotification & { _id: Types.ObjectId },
  ): NotificationRecord {
    return {
      _id: doc._id,
      to: doc.to,
      from: doc.from,
      type: doc.type,
      read: doc.read,
      createdAt: doc.createdAt,
    };
  }
}
