import { Types } from 'mongoose';
import { NotificationsMapper } from '../../../src/modules/notifications/dtos/notifications.mapper';
import { NotificationRecord } from '../../../src/modules/notifications/notifications.repository';

describe('NotificationsMapper', () => {
  it('maps mention notifications to user_mentioned with profile link target', () => {
    const mentionNotification = {
      _id: new Types.ObjectId(),
      to: new Types.ObjectId(),
      from: new Types.ObjectId(),
      type: {
        type: 'mention',
        referenceId: new Types.ObjectId(),
        payload: {
          actorName: 'Beat Maker',
          actorId: new Types.ObjectId(),
          avatarURL: 'https://cdn.example.com/avatar.jpg',
          commentText: '@jane check this out',
          trackId: new Types.ObjectId(),
          mentionedUserProfileLink: 'jane-smith-ab12c',
        },
      },
      read: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } as NotificationRecord;

    const result = NotificationsMapper.toResponse(mentionNotification);

    expect(result.activityType).toBe('user_mentioned');
    expect(result.target).toEqual({
      targetType: 'comment',
      targetId: mentionNotification.type.referenceId.toString(),
      trackId: mentionNotification.type.payload.trackId!.toString(),
      commentText: '@jane check this out',
      mentionedUserProfileLink: 'jane-smith-ab12c',
    });
  });

  it('keeps track target mapping for like notifications', () => {
    const likeNotification = {
      _id: new Types.ObjectId(),
      to: new Types.ObjectId(),
      from: new Types.ObjectId(),
      type: {
        type: 'like',
        referenceId: new Types.ObjectId(),
        payload: {
          actorName: 'Listener',
          actorId: new Types.ObjectId(),
          trackName: 'Track Name',
          trackId: new Types.ObjectId(),
        },
      },
      read: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    } as NotificationRecord;

    const result = NotificationsMapper.toResponse(likeNotification);

    expect(result.activityType).toBe('track_liked');
    expect(result.target).toEqual({
      targetType: 'track',
      targetId: likeNotification.type.payload.trackId!.toString(),
      title: 'Track Name',
    });
  });
});
