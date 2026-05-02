import { Types } from 'mongoose';
import {
  NotificationsRepository,
  NotificationRecord,
} from '../../../src/modules/notifications/notifications.repository';
import Notification from '../../../src/shared/models/models.notification';
import User from '../../../src/shared/models/models.user';
import Track from '../../../src/shared/models/models.track';
import Comment from '../../../src/shared/models/models.comment';
import Following from '../../../src/shared/models/models.following';
import Settings from '../../../src/shared/models/models.settings';
import BlockedList from '../../../src/shared/models/models.blocked-list';
import FcmToken from '../../../src/shared/models/models.fcm-token';

jest.mock('../../../src/shared/models/models.notification');
jest.mock('../../../src/shared/models/models.user');
jest.mock('../../../src/shared/models/models.track');
jest.mock('../../../src/shared/models/models.comment');
jest.mock('../../../src/shared/models/models.following');
jest.mock('../../../src/shared/models/models.settings');
jest.mock('../../../src/shared/models/models.blocked-list');
jest.mock('../../../src/shared/models/models.fcm-token');

describe('NotificationsRepository', () => {
  let repo: NotificationsRepository;

  const userId = '507f1f77bcf86cd799439011';
  const notificationId = '507f1f77bcf86cd799439099';

  beforeEach(() => {
    repo = new NotificationsRepository();
    jest.clearAllMocks();
  });

  // =========================
  // markAllAsReadForUser
  // =========================
  describe('markAllAsReadForUser', () => {
    it('should update all unread notifications and return modified count', async () => {
      (Notification.updateMany as jest.Mock).mockResolvedValue({
        modifiedCount: 3,
      });

      const result = await repo.markAllAsReadForUser(userId);

      expect(Notification.updateMany).toHaveBeenCalledWith(
        { to: { $in: [expect.any(Types.ObjectId), userId] }, read: false },
        { $set: { read: true } },
      );
      expect(result).toBe(3);
    });

    it('should return 0 when no unread notifications exist', async () => {
      (Notification.updateMany as jest.Mock).mockResolvedValue({
        modifiedCount: 0,
      });

      const result = await repo.markAllAsReadForUser(userId);

      expect(result).toBe(0);
    });
  });

  // =========================
  // markAsReadForUser
  // =========================
  describe('markAsReadForUser', () => {
    it('should update notification and return updated doc', async () => {
      const updatedNotification = { _id: notificationId, read: true };
      const leanMock = jest.fn().mockResolvedValue(updatedNotification);
      (Notification.findOneAndUpdate as jest.Mock).mockReturnValue({
        lean: leanMock,
      });

      const result = await repo.markAsReadForUser(userId, notificationId);

      expect(Notification.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: expect.any(Types.ObjectId),
          to: { $in: [expect.any(Types.ObjectId), userId] },
        },
        { $set: { read: true } },
        { new: true },
      );
      expect(result).toEqual(updatedNotification);
    });

    it('should return null when notification not found', async () => {
      const leanMock = jest.fn().mockResolvedValue(null);
      (Notification.findOneAndUpdate as jest.Mock).mockReturnValue({
        lean: leanMock,
      });

      const result = await repo.markAsReadForUser(userId, notificationId);

      expect(result).toBeNull();
    });
  });

  // =========================
  // findForUser
  // =========================
  describe('findForUser', () => {
    it('should return paginated notifications sorted by createdAt desc', async () => {
      const fakeNotifications = [{ _id: notificationId }];
      const leanMock = jest.fn().mockResolvedValue(fakeNotifications);
      const limitMock = jest.fn().mockReturnValue({ lean: leanMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
      (Notification.find as jest.Mock).mockReturnValue({ sort: sortMock });

      const result = await repo.findForUser(userId, { offset: 1, limit: 20 });

      expect(Notification.find).toHaveBeenCalledWith({
        to: { $in: [expect.any(Types.ObjectId), userId] },
      });
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(skipMock).toHaveBeenCalledWith(0);
      expect(limitMock).toHaveBeenCalledWith(20);
      expect(result).toEqual(fakeNotifications);
    });

    it('should apply read filter when provided', async () => {
      const leanMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ lean: leanMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
      (Notification.find as jest.Mock).mockReturnValue({ sort: sortMock });

      await repo.findForUser(userId, { offset: 1, limit: 20, read: true });

      expect(Notification.find).toHaveBeenCalledWith(
        expect.objectContaining({ read: true }),
      );
    });

    it('should calculate skip correctly for offset > 1', async () => {
      const leanMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ lean: leanMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
      (Notification.find as jest.Mock).mockReturnValue({ sort: sortMock });

      await repo.findForUser(userId, { offset: 3, limit: 10 });

      expect(skipMock).toHaveBeenCalledWith(20);
    });

    it('should use default offset and limit', async () => {
      const leanMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ lean: leanMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });
      (Notification.find as jest.Mock).mockReturnValue({ sort: sortMock });

      await repo.findForUser(userId);

      expect(skipMock).toHaveBeenCalledWith(0);
      expect(limitMock).toHaveBeenCalledWith(20);
    });
  });

  // =========================
  // countForUser
  // =========================
  describe('countForUser', () => {
    it('should return total count', async () => {
      (Notification.countDocuments as jest.Mock).mockResolvedValue(75);

      const result = await repo.countForUser(userId);

      expect(Notification.countDocuments).toHaveBeenCalledWith({
        to: { $in: [expect.any(Types.ObjectId), userId] },
      });
      expect(result).toBe(75);
    });

    it('should filter by read state when provided', async () => {
      (Notification.countDocuments as jest.Mock).mockResolvedValue(5);

      const result = await repo.countForUser(userId, false);

      expect(Notification.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ read: false }),
      );
      expect(result).toBe(5);
    });
  });

  // =========================
  // findByIdForUser
  // =========================
  describe('findByIdForUser', () => {
    it('should return notification when found for user', async () => {
      const fakeNotification = { _id: notificationId };
      const leanMock = jest.fn().mockResolvedValue(fakeNotification);
      (Notification.findOne as jest.Mock).mockReturnValue({ lean: leanMock });

      const result = await repo.findByIdForUser(userId, notificationId);

      expect(Notification.findOne).toHaveBeenCalledWith({
        _id: expect.any(Types.ObjectId),
        to: { $in: [expect.any(Types.ObjectId), userId] },
      });
      expect(result).toEqual(fakeNotification);
    });

    it('should return null when not found', async () => {
      const leanMock = jest.fn().mockResolvedValue(null);
      (Notification.findOne as jest.Mock).mockReturnValue({ lean: leanMock });

      const result = await repo.findByIdForUser(userId, notificationId);

      expect(result).toBeNull();
    });
  });

  // =========================
  // findById
  // =========================
  describe('findById', () => {
    it('should return notification when found', async () => {
      const fakeNotification = { _id: notificationId };
      const leanMock = jest.fn().mockResolvedValue(fakeNotification);
      (Notification.findById as jest.Mock).mockReturnValue({ lean: leanMock });

      const result = await repo.findById(notificationId);

      expect(Notification.findById).toHaveBeenCalledWith(
        expect.any(Types.ObjectId),
      );
      expect(result).toEqual(fakeNotification);
    });

    it('should return null when not found', async () => {
      const leanMock = jest.fn().mockResolvedValue(null);
      (Notification.findById as jest.Mock).mockReturnValue({ lean: leanMock });

      const result = await repo.findById(notificationId);

      expect(result).toBeNull();
    });
  });

  // =========================
  // create
  // =========================
  describe('create', () => {
    it('should create and return notification record', async () => {
      const fakeCreated = {
        _id: new Types.ObjectId(),
        to: new Types.ObjectId(userId),
        from: new Types.ObjectId(),
        type: { type: 'like', referenceId: new Types.ObjectId(), payload: {} },
        read: false,
        createdAt: new Date(),
      };
      (Notification.create as jest.Mock).mockResolvedValue(fakeCreated);

      const result = await repo.create({ to: userId });

      expect(Notification.create).toHaveBeenCalledWith({ to: userId });
      expect(result._id).toEqual(fakeCreated._id);
    });
  });

  // =========================
  // update
  // =========================
  describe('update', () => {
    it('should update and return notification', async () => {
      const fakeUpdated = { _id: notificationId, read: true };
      (Notification.findByIdAndUpdate as jest.Mock).mockResolvedValue(
        fakeUpdated,
      );

      const result = await repo.update(notificationId, { read: true });

      expect(Notification.findByIdAndUpdate).toHaveBeenCalledWith(
        expect.any(Types.ObjectId),
        { read: true },
        { new: true },
      );
      expect(result).toEqual(fakeUpdated);
    });

    it('should return null when not found', async () => {
      (Notification.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

      const result = await repo.update(notificationId, { read: true });

      expect(result).toBeNull();
    });
  });

  // =========================
  // delete
  // =========================
  describe('delete', () => {
    it('should return true when deleted', async () => {
      (Notification.deleteOne as jest.Mock).mockResolvedValue({
        deletedCount: 1,
      });

      const result = await repo.delete(notificationId);

      expect(Notification.deleteOne).toHaveBeenCalledWith({
        _id: expect.any(Types.ObjectId),
      });
      expect(result).toBe(true);
    });

    it('should return false when not found', async () => {
      (Notification.deleteOne as jest.Mock).mockResolvedValue({
        deletedCount: 0,
      });

      const result = await repo.delete(notificationId);

      expect(result).toBe(false);
    });
  });

  // =========================
  // createLikeNotification
  // =========================
  describe('createLikeNotification', () => {
    const actorId = '507f1f77bcf86cd799439022';
    const trackId = '507f1f77bcf86cd799439033';
    const posterId = new Types.ObjectId();

    it('should create like notification when actor is not the poster', async () => {
      const actorDoc = {
        _id: new Types.ObjectId(actorId),
        displayName: 'Liker',
        profileImg: { imgLink: 'https://img.test/avatar.jpg' },
      };
      const trackDoc = {
        _id: new Types.ObjectId(trackId),
        posterId,
        basicInfo: { title: 'My Track' },
      };
      const createdDoc = {
        _id: new Types.ObjectId(),
        to: posterId,
        from: actorDoc._id,
        type: { type: 'like', referenceId: trackDoc._id, payload: {} },
        read: false,
        createdAt: new Date(),
      };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(actorDoc) }),
      });
      (Track.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(trackDoc) }),
      });
      (Notification.create as jest.Mock).mockResolvedValue(createdDoc);

      const result = await repo.createLikeNotification(actorId, trackId);

      expect(Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          to: posterId,
          from: actorDoc._id,
          type: expect.objectContaining({ type: 'like' }),
        }),
      );
      expect(result).not.toBeNull();
    });

    it('should return null when actor is the track poster (self-like)', async () => {
      const sameUserId = new Types.ObjectId(actorId);
      const actorDoc = { _id: sameUserId, displayName: 'Self', profileImg: {} };
      const trackDoc = {
        _id: new Types.ObjectId(trackId),
        posterId: sameUserId,
        basicInfo: { title: 'My Track' },
      };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(actorDoc) }),
      });
      (Track.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(trackDoc) }),
      });

      const result = await repo.createLikeNotification(actorId, trackId);

      expect(result).toBeNull();
      expect(Notification.create).not.toHaveBeenCalled();
    });

    it('should throw when actor not found', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      });
      (Track.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue({}) }),
      });

      await expect(
        repo.createLikeNotification(actorId, trackId),
      ).rejects.toThrow('Actor not found');
    });

    it('should throw when track not found', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({
            lean: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
          }),
      });
      (Track.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      });

      await expect(
        repo.createLikeNotification(actorId, trackId),
      ).rejects.toThrow('Track not found');
    });
  });

  // =========================
  // createFollowNotification
  // =========================
  describe('createFollowNotification', () => {
    const actorId = '507f1f77bcf86cd799439022';
    const followedUserId = '507f1f77bcf86cd799439033';

    it('should create follow notification', async () => {
      const actorDoc = {
        _id: new Types.ObjectId(actorId),
        displayName: 'Follower',
        profileImg: { imgLink: 'https://img.test/avatar.jpg' },
      };
      const followedUserDoc = { _id: new Types.ObjectId(followedUserId) };
      const createdDoc = {
        _id: new Types.ObjectId(),
        to: followedUserDoc._id,
        from: actorDoc._id,
        type: { type: 'follow', referenceId: followedUserDoc._id, payload: {} },
        read: false,
        createdAt: new Date(),
      };

      (User.findById as jest.Mock).mockImplementation((id: any) => ({
        select: jest.fn().mockReturnValue({
          lean: jest
            .fn()
            .mockResolvedValue(
              id.toString() === actorId ? actorDoc : followedUserDoc,
            ),
        }),
      }));
      (Notification.create as jest.Mock).mockResolvedValue(createdDoc);

      const result = await repo.createFollowNotification(
        actorId,
        followedUserId,
      );

      expect(Notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          to: followedUserDoc._id,
          from: actorDoc._id,
          type: expect.objectContaining({ type: 'follow' }),
        }),
      );
      expect(result).not.toBeNull();
    });

    it('should return null when user follows themselves', async () => {
      const result = await repo.createFollowNotification(actorId, actorId);

      expect(result).toBeNull();
      expect(Notification.create).not.toHaveBeenCalled();
    });
  });

  // =========================
  // createNewTrackNotifications
  // =========================
  describe('createNewTrackNotifications', () => {
    const actorId = '507f1f77bcf86cd799439022';
    const trackId = '507f1f77bcf86cd799439033';

    it('should create notifications for followers with devices/both preference', async () => {
      const actorObjectId = new Types.ObjectId(actorId);
      const follower1 = new Types.ObjectId('507f1f77bcf86cd799439044');
      const follower2 = new Types.ObjectId('507f1f77bcf86cd799439055');

      const actorDoc = {
        _id: actorObjectId,
        displayName: 'Artist',
        profileImg: {},
      };
      const trackDoc = {
        _id: new Types.ObjectId(trackId),
        posterId: actorObjectId,
        basicInfo: { title: 'New Track' },
      };
      const followingDoc = {
        userId: actorObjectId,
        followers: [follower1, follower2],
      };
      const followerSettings = [
        {
          userId: follower1,
          notifications: { newPostByFollowedUser: 'devices' },
        },
        { userId: follower2, notifications: { newPostByFollowedUser: 'both' } },
      ];

      (User.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(actorDoc) }),
      });
      (Track.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(trackDoc) }),
      });
      (Following.findOne as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(followingDoc) }),
      });
      (Settings.find as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({
            lean: jest.fn().mockResolvedValue(followerSettings),
          }),
      });
      (Notification.insertMany as jest.Mock).mockResolvedValue([
        {
          _id: new Types.ObjectId(),
          to: follower1,
          from: actorObjectId,
          type: {},
          read: false,
          createdAt: new Date(),
        },
        {
          _id: new Types.ObjectId(),
          to: follower2,
          from: actorObjectId,
          type: {},
          read: false,
          createdAt: new Date(),
        },
      ]);

      const result = await repo.createNewTrackNotifications(actorId, trackId);

      expect(Notification.insertMany).toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no followers', async () => {
      const actorObjectId = new Types.ObjectId(actorId);
      const actorDoc = {
        _id: actorObjectId,
        displayName: 'Artist',
        profileImg: {},
      };
      const trackDoc = {
        _id: new Types.ObjectId(trackId),
        posterId: actorObjectId,
        basicInfo: { title: 'New Track' },
      };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(actorDoc) }),
      });
      (Track.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(trackDoc) }),
      });
      (Following.findOne as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
      });

      const result = await repo.createNewTrackNotifications(actorId, trackId);

      expect(result).toEqual([]);
      expect(Notification.insertMany).not.toHaveBeenCalled();
    });

    it('should skip followers with email/off preference', async () => {
      const actorObjectId = new Types.ObjectId(actorId);
      const follower1 = new Types.ObjectId('507f1f77bcf86cd799439044');
      const follower2 = new Types.ObjectId('507f1f77bcf86cd799439055');

      const actorDoc = {
        _id: actorObjectId,
        displayName: 'Artist',
        profileImg: {},
      };
      const trackDoc = {
        _id: new Types.ObjectId(trackId),
        posterId: actorObjectId,
        basicInfo: { title: 'New Track' },
      };
      const followingDoc = {
        userId: actorObjectId,
        followers: [follower1, follower2],
      };
      const followerSettings = [
        {
          userId: follower1,
          notifications: { newPostByFollowedUser: 'email' },
        },
        { userId: follower2, notifications: { newPostByFollowedUser: 'off' } },
      ];

      (User.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(actorDoc) }),
      });
      (Track.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(trackDoc) }),
      });
      (Following.findOne as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(followingDoc) }),
      });
      (Settings.find as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({
            lean: jest.fn().mockResolvedValue(followerSettings),
          }),
      });

      const result = await repo.createNewTrackNotifications(actorId, trackId);

      expect(result).toEqual([]);
      expect(Notification.insertMany).not.toHaveBeenCalled();
    });

    it('should include followers with no settings as devices default', async () => {
      const actorObjectId = new Types.ObjectId(actorId);
      const follower1 = new Types.ObjectId('507f1f77bcf86cd799439044');

      const actorDoc = {
        _id: actorObjectId,
        displayName: 'Artist',
        profileImg: {},
      };
      const trackDoc = {
        _id: new Types.ObjectId(trackId),
        posterId: actorObjectId,
        basicInfo: { title: 'New Track' },
      };
      const followingDoc = { userId: actorObjectId, followers: [follower1] };
      const followerSettings: any[] = [];

      (User.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(actorDoc) }),
      });
      (Track.findById as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(trackDoc) }),
      });
      (Following.findOne as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({ lean: jest.fn().mockResolvedValue(followingDoc) }),
      });
      (Settings.find as jest.Mock).mockReturnValue({
        select: jest
          .fn()
          .mockReturnValue({
            lean: jest.fn().mockResolvedValue(followerSettings),
          }),
      });
      (Notification.insertMany as jest.Mock).mockResolvedValue([
        {
          _id: new Types.ObjectId(),
          to: follower1,
          from: actorObjectId,
          type: {},
          read: false,
          createdAt: new Date(),
        },
      ]);

      const result = await repo.createNewTrackNotifications(actorId, trackId);

      expect(Notification.insertMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  // =========================
  // findBlockingActors
  // =========================
  describe('findBlockingActors', () => {
    it('should return set of blocked actor ids', async () => {
      const actorId1 = new Types.ObjectId('507f1f77bcf86cd799439022');
      const actorId2 = new Types.ObjectId('507f1f77bcf86cd799439033');
      const recipientId = new Types.ObjectId(userId);

      (BlockedList.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            blockedIds: [actorId1],
          }),
        }),
      });

      const result = await repo.findBlockingActors(
        [actorId1, actorId2],
        recipientId,
      );

      expect(result.has(actorId1.toString())).toBe(true);
      expect(result.has(actorId2.toString())).toBe(false);
    });

    it('should return empty set when no blocked list exists', async () => {
      (BlockedList.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await repo.findBlockingActors(
        [new Types.ObjectId()],
        new Types.ObjectId(userId),
      );

      expect(result.size).toBe(0);
    });

    it('should return empty set when actorIds is empty', async () => {
      const result = await repo.findBlockingActors(
        [],
        new Types.ObjectId(userId),
      );

      expect(result.size).toBe(0);
      expect(BlockedList.findOne).not.toHaveBeenCalled();
    });
  });

  // =========================
  // findFollowedUserIds
  // =========================
  describe('findFollowedUserIds', () => {
    it('should return set of followed user ids', async () => {
      const followed1 = new Types.ObjectId('507f1f77bcf86cd799439022');
      const followed2 = new Types.ObjectId('507f1f77bcf86cd799439033');

      (Following.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest
            .fn()
            .mockResolvedValue({ followed: [followed1, followed2] }),
        }),
      });

      const result = await repo.findFollowedUserIds(new Types.ObjectId(userId));

      expect(result.has(followed1.toString())).toBe(true);
      expect(result.has(followed2.toString())).toBe(true);
    });

    it('should return empty set when no following doc exists', async () => {
      (Following.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await repo.findFollowedUserIds(new Types.ObjectId(userId));

      expect(result.size).toBe(0);
    });
  });

  // =========================
  // saveFcmToken
  // =========================
  describe('saveFcmToken', () => {
    it('should upsert FCM token', async () => {
      (FcmToken.findOneAndUpdate as jest.Mock).mockResolvedValue({});

      await repo.saveFcmToken(userId, 'fcm_token_123', 'android');

      expect(FcmToken.findOneAndUpdate).toHaveBeenCalledWith(
        { token: 'fcm_token_123' },
        {
          $set: {
            userId: expect.any(Types.ObjectId),
            platform: 'android',
          },
        },
        { upsert: true, new: true },
      );
    });
  });

  // =========================
  // removeFcmToken
  // =========================
  describe('removeFcmToken', () => {
    it('should return true when token is deleted', async () => {
      (FcmToken.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 1 });

      const result = await repo.removeFcmToken('fcm_token_123');

      expect(FcmToken.deleteOne).toHaveBeenCalledWith({
        token: 'fcm_token_123',
      });
      expect(result).toBe(true);
    });

    it('should return false when token not found', async () => {
      (FcmToken.deleteOne as jest.Mock).mockResolvedValue({ deletedCount: 0 });

      const result = await repo.removeFcmToken('nonexistent_token');

      expect(result).toBe(false);
    });
  });

  // =========================
  // removeFcmTokensForUser
  // =========================
  describe('removeFcmTokensForUser', () => {
    it('should return deleted count', async () => {
      (FcmToken.deleteMany as jest.Mock).mockResolvedValue({ deletedCount: 3 });

      const result = await repo.removeFcmTokensForUser(userId);

      expect(FcmToken.deleteMany).toHaveBeenCalledWith({
        userId: expect.any(Types.ObjectId),
      });
      expect(result).toBe(3);
    });
  });
});
