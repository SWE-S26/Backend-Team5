import { Types } from 'mongoose';
import {
  NotificationsMapper,
  ActorRelationStatus,
} from '../../../src/modules/notifications/dtos/notifications.mapper';
import { NotificationRecord } from '../../../src/modules/notifications/notifications.repository';

function buildNotification(overrides: {
  type: NotificationRecord['type']['type'];
  referenceId?: Types.ObjectId;
  payload?: Partial<NotificationRecord['type']['payload']>;
  to?: Types.ObjectId;
  from?: Types.ObjectId;
  read?: boolean;
  createdAt?: Date;
}): NotificationRecord {
  const actorId = overrides.payload?.actorId ?? new Types.ObjectId();
  return {
    _id: new Types.ObjectId(),
    to: overrides.to ?? new Types.ObjectId(),
    from: overrides.from ?? actorId,
    type: {
      type: overrides.type,
      referenceId: overrides.referenceId ?? new Types.ObjectId(),
      payload: {
        actorName: 'Test Actor',
        actorId,
        avatarURL: 'https://cdn.example.com/avatar.jpg',
        trackName: 'Test Track',
        trackId: new Types.ObjectId(),
        commentText: undefined,
        mentionedUserProfileLink: undefined,
        ...overrides.payload,
      },
    },
    read: overrides.read ?? false,
    createdAt: overrides.createdAt ?? new Date('2025-06-15T12:00:00Z'),
  };
}

describe('NotificationsMapper', () => {
  describe('toResponse', () => {
    it('maps like notification to track_liked with track target', () => {
      const trackId = new Types.ObjectId();
      const notification = buildNotification({
        type: 'like',
        referenceId: trackId,
        payload: { trackName: 'My Track', trackId },
      });

      const result = NotificationsMapper.toResponse(notification);

      expect(result.activityType).toBe('track_liked');
      expect(result.target).toEqual({
        targetType: 'track',
        targetId: trackId.toString(),
        title: 'My Track',
      });
    });

    it('maps comment notification to track_commented with comment target', () => {
      const commentId = new Types.ObjectId();
      const trackId = new Types.ObjectId();
      const notification = buildNotification({
        type: 'comment',
        referenceId: commentId,
        payload: { commentText: 'Great track!', trackId },
      });

      const result = NotificationsMapper.toResponse(notification);

      expect(result.activityType).toBe('track_commented');
      expect(result.target).toEqual({
        targetType: 'comment',
        targetId: commentId.toString(),
        trackId: trackId.toString(),
        commentText: 'Great track!',
        mentionedUserProfileLink: undefined,
      });
    });

    it('maps mention notification to user_mentioned with profile link target', () => {
      const commentId = new Types.ObjectId();
      const trackId = new Types.ObjectId();
      const notification = buildNotification({
        type: 'mention',
        referenceId: commentId,
        payload: {
          commentText: '@jane check this out',
          trackId,
          mentionedUserProfileLink: 'jane-smith-ab12c',
        },
      });

      const result = NotificationsMapper.toResponse(notification);

      expect(result.activityType).toBe('user_mentioned');
      expect(result.target).toEqual({
        targetType: 'comment',
        targetId: commentId.toString(),
        trackId: trackId.toString(),
        commentText: '@jane check this out',
        mentionedUserProfileLink: 'jane-smith-ab12c',
      });
    });

    it('maps repost notification to track_reposted with track target', () => {
      const trackId = new Types.ObjectId();
      const notification = buildNotification({
        type: 'repost',
        referenceId: trackId,
        payload: { trackName: 'Reposted Track', trackId },
      });

      const result = NotificationsMapper.toResponse(notification);

      expect(result.activityType).toBe('track_reposted');
      expect(result.target).toEqual({
        targetType: 'track',
        targetId: trackId.toString(),
        title: 'Reposted Track',
      });
    });

    it('maps follow notification to user_followed with user target', () => {
      const followedUserId = new Types.ObjectId();
      const notification = buildNotification({
        type: 'follow',
        referenceId: followedUserId,
        payload: { trackName: undefined, trackId: undefined },
      });

      const result = NotificationsMapper.toResponse(notification);

      expect(result.activityType).toBe('user_followed');
      expect(result.target).toEqual({
        targetType: 'user',
        targetId: followedUserId.toString(),
      });
    });

    it('maps newTrack notification to new_track with track target', () => {
      const trackId = new Types.ObjectId();
      const notification = buildNotification({
        type: 'newTrack',
        referenceId: trackId,
        payload: { trackName: 'New Release', trackId },
      });

      const result = NotificationsMapper.toResponse(notification);

      expect(result.activityType).toBe('new_track');
      expect(result.target).toEqual({
        targetType: 'track',
        targetId: trackId.toString(),
        title: 'New Release',
      });
    });

    it('uses referenceId as fallback targetId when trackId is missing for track types', () => {
      const referenceId = new Types.ObjectId();
      const notification = buildNotification({
        type: 'like',
        referenceId,
        payload: { trackId: undefined, trackName: 'Some Track' },
      });

      const result = NotificationsMapper.toResponse(notification);

      expect(result.target.targetId).toBe(referenceId.toString());
    });

    it('defaults actorRelation to false when not provided', () => {
      const notification = buildNotification({ type: 'like' });

      const result = NotificationsMapper.toResponse(notification);

      expect(result.isBlockingActor).toBe(false);
      expect(result.isFollowingActor).toBe(false);
    });

    it('applies actorRelation when provided', () => {
      const notification = buildNotification({ type: 'like' });
      const actorRelation: ActorRelationStatus = {
        isBlockingActor: true,
        isFollowingActor: false,
      };

      const result = NotificationsMapper.toResponse(
        notification,
        actorRelation,
      );

      expect(result.isBlockingActor).toBe(true);
      expect(result.isFollowingActor).toBe(false);
    });

    it('maps actor fields from payload', () => {
      const actorId = new Types.ObjectId();
      const notification = buildNotification({
        type: 'like',
        payload: {
          actorId,
          actorName: 'Jane Smith',
          avatarURL: 'https://cdn.example.com/jane.jpg',
        },
      });

      const result = NotificationsMapper.toResponse(notification);

      expect(result.actor).toEqual({
        userId: actorId.toString(),
        displayName: 'Jane Smith',
        avatarUrl: 'https://cdn.example.com/jane.jpg',
      });
    });

    it('converts createdAt to ISO string', () => {
      const date = new Date('2025-01-15T12:00:00Z');
      const notification = buildNotification({ type: 'like', createdAt: date });

      const result = NotificationsMapper.toResponse(notification);

      expect(result.createdAt).toBe(date.toISOString());
    });

    it('maps notificationId from _id', () => {
      const id = new Types.ObjectId();
      const notification = { ...buildNotification({ type: 'like' }), _id: id };

      const result = NotificationsMapper.toResponse(notification);

      expect(result.notificationId).toBe(id.toString());
    });
  });

  describe('toListResponse', () => {
    it('maps list of notifications with pagination', () => {
      const n1 = buildNotification({ type: 'like' });
      const n2 = buildNotification({ type: 'follow' });

      const result = NotificationsMapper.toListResponse([n1, n2], 1, 20, 50);

      expect(result).toEqual({
        total: 50,
        offset: 1,
        limit: 20,
        notifications: [
          NotificationsMapper.toResponse(n1),
          NotificationsMapper.toResponse(n2),
        ],
      });
    });

    it('returns empty notifications array when given empty list', () => {
      const result = NotificationsMapper.toListResponse([], 1, 20, 0);

      expect(result.notifications).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('applies actor relations from map for each notification', () => {
      const actorId1 = new Types.ObjectId();
      const actorId2 = new Types.ObjectId();
      const n1 = buildNotification({
        type: 'like',
        payload: { actorId: actorId1 },
      });
      const n2 = buildNotification({
        type: 'follow',
        payload: { actorId: actorId2 },
      });

      const actorRelations = new Map<string, ActorRelationStatus>();
      actorRelations.set(actorId1.toString(), {
        isBlockingActor: true,
        isFollowingActor: false,
      });
      actorRelations.set(actorId2.toString(), {
        isBlockingActor: false,
        isFollowingActor: true,
      });

      const result = NotificationsMapper.toListResponse(
        [n1, n2],
        1,
        20,
        2,
        actorRelations,
      );

      expect(result.notifications[0].isBlockingActor).toBe(true);
      expect(result.notifications[0].isFollowingActor).toBe(false);
      expect(result.notifications[1].isBlockingActor).toBe(false);
      expect(result.notifications[1].isFollowingActor).toBe(true);
    });

    it('defaults actorRelation to false when actorId is not in the map', () => {
      const n1 = buildNotification({ type: 'like' });

      const actorRelations = new Map<string, ActorRelationStatus>();

      const result = NotificationsMapper.toListResponse(
        [n1],
        1,
        20,
        1,
        actorRelations,
      );

      expect(result.notifications[0].isBlockingActor).toBe(false);
      expect(result.notifications[0].isFollowingActor).toBe(false);
    });
  });
});
