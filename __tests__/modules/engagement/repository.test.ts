import { Types } from 'mongoose';
import { EngagementRepository } from '../../../src/modules/engagement/engagement.repository';
import Track from '../../../src/shared/models/models.track';
import Playlist from '../../../src/shared/models/models.playlist';
import User from '../../../src/shared/models/models.user';
import Following from '../../../src/shared/models/models.following';
import Comment from '../../../src/shared/models/models.comment';
import Settings from '../../../src/shared/models/models.settings';

jest.mock('../../../src/shared/models/models.track');
jest.mock('../../../src/shared/models/models.playlist');
jest.mock('../../../src/shared/models/models.user');
jest.mock('../../../src/shared/models/models.following');
jest.mock('../../../src/shared/models/models.comment');
jest.mock('../../../src/shared/models/models.settings');

describe('EngagementRepository', () => {
  let repository: EngagementRepository;

  beforeEach(() => {
    repository = new EngagementRepository();
    jest.clearAllMocks();
  });

  describe('findTrackById', () => {
    it('should return track when found', async () => {
      const fakeTrack = {
        _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
        likedBy: [],
        numOfLikes: 0,
      };

      (Track.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(fakeTrack),
      });

      const result = await repository.findTrackById('507f1f77bcf86cd799439011');

      expect(Track.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(result).toEqual(fakeTrack);
    });

    it('should return null when track not found', async () => {
      (Track.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findTrackById('nonexistent');

      expect(result).toBeNull();
    });

    it('should select correct fields', async () => {
      const selectMock = jest.fn().mockResolvedValue({});
      (Track.findById as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      await repository.findTrackById('507f1f77bcf86cd799439011');

      expect(selectMock).toHaveBeenCalledWith('likedBy numOfLikes');
    });

    it('should throw when database error occurs', async () => {
      (Track.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('DB Error')),
      });

      await expect(
        repository.findTrackById('507f1f77bcf86cd799439011'),
      ).rejects.toThrow('DB Error');
    });
  });

  describe('findTrackWithOwner', () => {
    const trackId = '507f1f77bcf86cd799439011';
    const ownerId = '507f1f77bcf86cd799439022';

    it('should return track with owner when both exist', async () => {
      const fakeTrack = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(ownerId),
        basicInfo: { title: 'Test Track' },
      };

      const fakeOwner = {
        _id: new Types.ObjectId(ownerId),
        email: 'owner@test.com',
        displayName: 'Track Owner',
      };

      (Track.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(fakeTrack),
        }),
      });

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(fakeOwner),
        }),
      });

      const result = await repository.findTrackWithOwner(trackId);

      expect(result).toEqual({
        _id: fakeTrack._id,
        posterId: fakeTrack.posterId,
        basicInfo: fakeTrack.basicInfo,
        owner: {
          _id: fakeOwner._id,
          email: fakeOwner.email,
          displayName: fakeOwner.displayName,
        },
      });
    });

    it('should return null when track not found', async () => {
      (Track.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await repository.findTrackWithOwner(trackId);

      expect(result).toBeNull();
    });

    it('should return null when owner not found', async () => {
      const fakeTrack = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(ownerId),
        basicInfo: { title: 'Test Track' },
      };

      (Track.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(fakeTrack),
        }),
      });

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await repository.findTrackWithOwner(trackId);

      expect(result).toBeNull();
    });
  });

  describe('findUserNotificationSettings', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should return notification settings when found', async () => {
      const fakeSettings = {
        userId: new Types.ObjectId(userId),
        notifications: {
          likesAndPlaysOnYourPost: 'email',
          repostOfYourPost: 'both',
          commentOnYourPost: 'devices',
          newFollower: 'off',
        },
      };

      (Settings.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(fakeSettings),
        }),
      });

      const result = await repository.findUserNotificationSettings(userId);

      expect(Settings.findOne).toHaveBeenCalledWith({ userId });
      expect(result).toEqual(fakeSettings.notifications);
    });

    it('should return null when settings not found', async () => {
      (Settings.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await repository.findUserNotificationSettings(userId);

      expect(result).toBeNull();
    });

    it('should select only notifications field', async () => {
      const selectMock = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ notifications: {} }),
      });

      (Settings.findOne as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      await repository.findUserNotificationSettings(userId);

      expect(selectMock).toHaveBeenCalledWith('notifications');
    });
  });

  describe('addLikeToTrack', () => {
    const trackId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';

    it('should add like to track and increment count', async () => {
      const updatedTrack = { numOfLikes: 1 };

      (Track.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedTrack),
      });

      const result = await repository.addLikeToTrack(trackId, userId);

      expect(Track.findByIdAndUpdate).toHaveBeenCalledWith(
        trackId,
        {
          $addToSet: { likedBy: expect.any(Types.ObjectId) },
          $inc: { numOfLikes: 1 },
        },
        { new: true },
      );
      expect(result).toEqual(updatedTrack);
    });

    it('should throw when database update fails', async () => {
      (Track.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Update failed')),
      });

      await expect(repository.addLikeToTrack(trackId, userId)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  describe('removeLikeFromTrack', () => {
    const trackId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';

    it('should remove like from track and decrement count', async () => {
      const updatedTrack = { numOfLikes: 0 };

      (Track.findByIdAndUpdate as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(updatedTrack),
      });

      const result = await repository.removeLikeFromTrack(trackId, userId);

      expect(Track.findByIdAndUpdate).toHaveBeenCalledWith(
        trackId,
        {
          $pull: { likedBy: expect.any(Types.ObjectId) },
          $inc: { numOfLikes: -1 },
        },
        { new: true },
      );
      expect(result).toEqual(updatedTrack);
    });
  });

  describe('addTrackToUserLikes', () => {
    const userId = '507f1f77bcf86cd799439011';
    const trackId = '507f1f77bcf86cd799439022';

    it('should add track to user liked tracks', async () => {
      (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({});

      await repository.addTrackToUserLikes(userId, trackId);

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(userId, {
        $addToSet: { likedTracks: expect.any(Types.ObjectId) },
      });
    });

    it('should throw when user update fails', async () => {
      (User.findByIdAndUpdate as jest.Mock).mockRejectedValue(
        new Error('User update failed'),
      );

      await expect(
        repository.addTrackToUserLikes(userId, trackId),
      ).rejects.toThrow('User update failed');
    });
  });

  describe('findUserDisplayName', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should return display name when user exists', async () => {
      const fakeUser = {
        _id: new Types.ObjectId(userId),
        displayName: 'John Doe',
      };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(fakeUser),
        }),
      });

      const result = await repository.findUserDisplayName(userId);

      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toBe('John Doe');
    });

    it('should return null when user not found', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await repository.findUserDisplayName(userId);

      expect(result).toBeNull();
    });

    it('should return null when displayName is undefined', async () => {
      const fakeUser = {
        _id: new Types.ObjectId(userId),
        displayName: undefined,
      };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(fakeUser),
        }),
      });

      const result = await repository.findUserDisplayName(userId);

      expect(result).toBeNull();
    });
  });

  describe('findPlaylistWithOwner', () => {
    const playlistId = '507f1f77bcf86cd799439011';
    const artistId = '507f1f77bcf86cd799439022';

    it('should return playlist with owner when both exist', async () => {
      const fakePlaylist = {
        _id: new Types.ObjectId(playlistId),
        artistId: new Types.ObjectId(artistId),
        title: 'Test Playlist',
      };

      const fakeOwner = {
        _id: new Types.ObjectId(artistId),
        email: 'artist@test.com',
        displayName: 'Artist Name',
      };

      (Playlist.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(fakePlaylist),
        }),
      });

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(fakeOwner),
        }),
      });

      const result = await repository.findPlaylistWithOwner(playlistId);

      expect(result).toEqual({
        _id: fakePlaylist._id,
        artistId: fakePlaylist.artistId,
        title: fakePlaylist.title,
        owner: {
          _id: fakeOwner._id,
          email: fakeOwner.email,
          displayName: fakeOwner.displayName,
        },
      });
    });

    it('should return null when playlist not found', async () => {
      (Playlist.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await repository.findPlaylistWithOwner(playlistId);

      expect(result).toBeNull();
    });
  });

  describe('findFollowersCountByUserIds', () => {
    it('should return follower counts for users', async () => {
      const userId1 = new Types.ObjectId('507f1f77bcf86cd799439011');
      const userId2 = new Types.ObjectId('507f1f77bcf86cd799439022');

      const aggregateResult = [
        { userId: userId1, followersCount: 10 },
        { userId: userId2, followersCount: 5 },
      ];

      (Following.aggregate as jest.Mock).mockResolvedValue(aggregateResult);

      const result = await repository.findFollowersCountByUserIds([
        userId1,
        userId2,
      ]);

      expect(result).toEqual({
        [userId1.toString()]: 10,
        [userId2.toString()]: 5,
      });
    });

    it('should return empty object when no followers found', async () => {
      (Following.aggregate as jest.Mock).mockResolvedValue([]);

      const result = await repository.findFollowersCountByUserIds([
        new Types.ObjectId(),
      ]);

      expect(result).toEqual({});
    });
  });

  describe('getCommentReplies', () => {
    const commentId = '507f1f77bcf86cd799439011';

    it('should query replies ordered by createdAt ascending with pagination', async () => {
      const reply1Id = new Types.ObjectId();
      const reply2Id = new Types.ObjectId();
      const reply3Id = new Types.ObjectId();

      const parentComment = {
        _id: new Types.ObjectId(commentId),
        replyList: [reply3Id, reply1Id, reply2Id],
      };

      const selectMock = jest.fn().mockResolvedValue(parentComment);
      (Comment.findById as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const populatedReplies = [
        {
          _id: reply2Id,
          userId: {
            _id: new Types.ObjectId(),
            displayName: 'User 2',
            profileImg: null,
          },
          createdAt: new Date('2026-01-01T00:00:02.000Z'),
          content: 'Reply 2',
        },
      ];

      const leanMock = jest.fn().mockResolvedValue(populatedReplies);
      const populateMock = jest.fn().mockReturnValue({ lean: leanMock });
      const limitMock = jest.fn().mockReturnValue({ populate: populateMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const sortMock = jest.fn().mockReturnValue({ skip: skipMock });

      (Comment.find as jest.Mock).mockReturnValue({ sort: sortMock });

      const result = await repository.getCommentReplies(commentId, 2, 1);

      expect(Comment.find).toHaveBeenCalledWith({
        _id: { $in: parentComment.replyList },
      });
      expect(sortMock).toHaveBeenCalledWith({ createdAt: 1 });
      expect(skipMock).toHaveBeenCalledWith(1);
      expect(limitMock).toHaveBeenCalledWith(1);
      expect(result.total).toBe(3);
      expect(result.replies).toHaveLength(1);
      expect(result.replies[0]).toMatchObject({
        _id: reply2Id,
        content: 'Reply 2',
        user: {
          displayName: 'User 2',
        },
      });
    });

    it('should return empty when parent comment does not exist', async () => {
      const selectMock = jest.fn().mockResolvedValue(null);
      (Comment.findById as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const result = await repository.getCommentReplies(commentId, 1, 20);

      expect(result).toEqual({ replies: [], total: 0 });
      expect(Comment.find).not.toHaveBeenCalled();
    });

    it('should return empty when comment has no replies', async () => {
      const parentComment = {
        _id: new Types.ObjectId(commentId),
        replyList: [],
      };

      const selectMock = jest.fn().mockResolvedValue(parentComment);
      (Comment.findById as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const result = await repository.getCommentReplies(commentId, 1, 20);

      expect(result).toEqual({ replies: [], total: 0 });
      expect(Comment.find).not.toHaveBeenCalled();
    });
  });
});
