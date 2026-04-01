import { Types } from 'mongoose';
import { EngagementService } from '../../../src/modules/engagement/engagement.service';
import { EngagementRepository } from '../../../src/modules/engagement/engagement.repository';
import { EngagementMapper } from '../../../src/modules/engagement/dtos/engagement.mapper';

jest.mock('../../../src/modules/engagement/engagement.repository');
jest.mock('../../../src/modules/engagement/dtos/engagement.mapper');

describe('EngagementService', () => {
  let service: EngagementService;
  let mockRepository: jest.Mocked<EngagementRepository>;

  beforeEach(() => {
    mockRepository =
      new EngagementRepository() as jest.Mocked<EngagementRepository>;
    service = new EngagementService(mockRepository);
    jest.clearAllMocks();
  });

  describe('toggleTrackLike', () => {
    const trackId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';

    it('should add like when track is not already liked', async () => {
      const mockTrack = {
        _id: new Types.ObjectId(trackId),
        likedBy: [],
        numOfLikes: 0,
      };

      const updatedTrack = {
        _id: new Types.ObjectId(trackId),
        numOfLikes: 1,
      };

      (
        EngagementRepository.prototype.findTrackById as jest.Mock
      ).mockResolvedValue(mockTrack);
      (
        EngagementRepository.prototype.addLikeToTrack as jest.Mock
      ).mockResolvedValue(updatedTrack);
      (
        EngagementRepository.prototype.addTrackToUserLikes as jest.Mock
      ).mockResolvedValue(undefined);

      (EngagementMapper.toTrackLikeResponse as jest.Mock).mockReturnValue({
        liked: true,
        numOfLikes: 1,
      });

      const result = await service.toggleTrackLike(trackId, userId);

      expect(
        EngagementRepository.prototype.addLikeToTrack,
      ).toHaveBeenCalledWith(trackId, userId);
      expect(
        EngagementRepository.prototype.addTrackToUserLikes,
      ).toHaveBeenCalledWith(userId, trackId);
      expect(result).toEqual({ liked: true, numOfLikes: 1 });
    });

    it('should remove like when track is already liked', async () => {
      const userObjectId = new Types.ObjectId(userId);
      const mockTrack = {
        _id: new Types.ObjectId(trackId),
        likedBy: [userObjectId],
        numOfLikes: 1,
      };

      const updatedTrack = {
        _id: new Types.ObjectId(trackId),
        numOfLikes: 0,
      };

      (
        EngagementRepository.prototype.findTrackById as jest.Mock
      ).mockResolvedValue(mockTrack);
      (
        EngagementRepository.prototype.removeLikeFromTrack as jest.Mock
      ).mockResolvedValue(updatedTrack);
      (
        EngagementRepository.prototype.removeTrackFromUserLikes as jest.Mock
      ).mockResolvedValue(undefined);

      (EngagementMapper.toTrackLikeResponse as jest.Mock).mockReturnValue({
        liked: false,
        numOfLikes: 0,
      });

      const result = await service.toggleTrackLike(trackId, userId);

      expect(
        EngagementRepository.prototype.removeLikeFromTrack,
      ).toHaveBeenCalledWith(trackId, userId);
      expect(
        EngagementRepository.prototype.removeTrackFromUserLikes,
      ).toHaveBeenCalledWith(userId, trackId);
      expect(result).toEqual({ liked: false, numOfLikes: 0 });
    });

    it('should throw NotFoundError when track does not exist', async () => {
      (
        EngagementRepository.prototype.findTrackById as jest.Mock
      ).mockResolvedValue(null);

      await expect(service.toggleTrackLike(trackId, userId)).rejects.toThrow();
    });

    it('should call mapper with correct parameters', async () => {
      const mockTrack = {
        _id: new Types.ObjectId(trackId),
        likedBy: [],
        numOfLikes: 0,
      };

      const updatedTrack = {
        _id: new Types.ObjectId(trackId),
        numOfLikes: 1,
      };

      (
        EngagementRepository.prototype.findTrackById as jest.Mock
      ).mockResolvedValue(mockTrack);
      (
        EngagementRepository.prototype.addLikeToTrack as jest.Mock
      ).mockResolvedValue(updatedTrack);
      (
        EngagementRepository.prototype.addTrackToUserLikes as jest.Mock
      ).mockResolvedValue(undefined);

      await service.toggleTrackLike(trackId, userId);

      expect(EngagementMapper.toTrackLikeResponse).toHaveBeenCalledWith(
        updatedTrack,
        true,
      );
    });
  });

  describe('togglePlaylistLike', () => {
    const playlistId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';

    it('should add like when playlist is not already liked', async () => {
      const mockPlaylist = {
        _id: new Types.ObjectId(playlistId),
        likedUser: [],
        numOfLikes: 0,
      };

      const updatedPlaylist = {
        _id: new Types.ObjectId(playlistId),
        numOfLikes: 1,
      };

      (
        EngagementRepository.prototype.findPlaylistById as jest.Mock
      ).mockResolvedValue(mockPlaylist);
      (
        EngagementRepository.prototype.addLikeToPlaylist as jest.Mock
      ).mockResolvedValue(updatedPlaylist);
      (
        EngagementRepository.prototype.addPlaylistToUserLikes as jest.Mock
      ).mockResolvedValue(undefined);

      (EngagementMapper.toPlaylistLikeResponse as jest.Mock).mockReturnValue({
        liked: true,
        numOfLikes: 1,
      });

      const result = await service.togglePlaylistLike(playlistId, userId);

      expect(
        EngagementRepository.prototype.addLikeToPlaylist,
      ).toHaveBeenCalledWith(playlistId, userId);
      expect(
        EngagementRepository.prototype.addPlaylistToUserLikes,
      ).toHaveBeenCalledWith(userId, playlistId);
      expect(result).toEqual({ liked: true, numOfLikes: 1 });
    });

    it('should remove like when playlist is already liked', async () => {
      const userObjectId = new Types.ObjectId(userId);
      const mockPlaylist = {
        _id: new Types.ObjectId(playlistId),
        likedUser: [userObjectId],
        numOfLikes: 1,
      };

      const updatedPlaylist = {
        _id: new Types.ObjectId(playlistId),
        numOfLikes: 0,
      };

      (
        EngagementRepository.prototype.findPlaylistById as jest.Mock
      ).mockResolvedValue(mockPlaylist);
      (
        EngagementRepository.prototype.removeLikeFromPlaylist as jest.Mock
      ).mockResolvedValue(updatedPlaylist);
      (
        EngagementRepository.prototype.removePlaylistFromUserLikes as jest.Mock
      ).mockResolvedValue(undefined);

      (EngagementMapper.toPlaylistLikeResponse as jest.Mock).mockReturnValue({
        liked: false,
        numOfLikes: 0,
      });

      const result = await service.togglePlaylistLike(playlistId, userId);

      expect(
        EngagementRepository.prototype.removeLikeFromPlaylist,
      ).toHaveBeenCalledWith(playlistId, userId);
      expect(
        EngagementRepository.prototype.removePlaylistFromUserLikes,
      ).toHaveBeenCalledWith(userId, playlistId);
      expect(result).toEqual({ liked: false, numOfLikes: 0 });
    });

    it('should throw NotFoundError when playlist does not exist', async () => {
      (
        EngagementRepository.prototype.findPlaylistById as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.togglePlaylistLike(playlistId, userId),
      ).rejects.toThrow();
    });
  });

  describe('getTrackLikers', () => {
    const trackId = '507f1f77bcf86cd799439011';

    it('should return paginated list of track likers', async () => {
      const userId1 = new Types.ObjectId('507f1f77bcf86cd799439022');
      const userId2 = new Types.ObjectId('507f1f77bcf86cd799439033');

      const mockTrack = {
        _id: new Types.ObjectId(trackId),
        likedBy: [userId1, userId2],
        numOfLikes: 2,
      };

      const mockUsers = [
        {
          _id: userId1,
          displayName: 'User One',
          profileImg: 'img1.jpg',
        },
        {
          _id: userId2,
          displayName: 'User Two',
          profileImg: 'img2.jpg',
        },
      ];

      const mockFollowerCounts = {
        [userId1.toString()]: 10,
        [userId2.toString()]: 5,
      };

      (
        EngagementRepository.prototype.findTrackById as jest.Mock
      ).mockResolvedValue(mockTrack);
      (
        EngagementRepository.prototype.findTrackLikers as jest.Mock
      ).mockResolvedValue(mockUsers);
      (
        EngagementRepository.prototype.findFollowersCountByUserIds as jest.Mock
      ).mockResolvedValue(mockFollowerCounts);

      (EngagementMapper.toTrackLikersResponse as jest.Mock).mockReturnValue({
        users: mockUsers,
        total: 2,
        page: 1,
        limit: 20,
      });

      const result = await service.getTrackLikers(trackId, '1', '20');

      expect(
        EngagementRepository.prototype.findTrackLikers,
      ).toHaveBeenCalledWith([userId1, userId2]);
      expect(
        EngagementRepository.prototype.findFollowersCountByUserIds,
      ).toHaveBeenCalledWith([userId1, userId2]);
      expect(result).toEqual({
        users: mockUsers,
        total: 2,
        page: 1,
        limit: 20,
      });
    });

    it('should throw NotFoundError when track does not exist', async () => {
      (
        EngagementRepository.prototype.findTrackById as jest.Mock
      ).mockResolvedValue(null);

      await expect(service.getTrackLikers(trackId)).rejects.toThrow();
    });

    it('should handle pagination correctly', async () => {
      const mockTrack = {
        _id: new Types.ObjectId(trackId),
        likedBy: [new Types.ObjectId(), new Types.ObjectId()],
        numOfLikes: 2,
      };

      (
        EngagementRepository.prototype.findTrackById as jest.Mock
      ).mockResolvedValue(mockTrack);
      (
        EngagementRepository.prototype.findTrackLikers as jest.Mock
      ).mockResolvedValue([]);
      (
        EngagementRepository.prototype.findFollowersCountByUserIds as jest.Mock
      ).mockResolvedValue({});

      await service.getTrackLikers(trackId, '2', '10');

      expect(EngagementMapper.toTrackLikersResponse).toHaveBeenCalledWith(
        [],
        {},
        2,
        2,
        10,
      );
    });
  });

  describe('postTrackComment', () => {
    const trackId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';
    const content = 'Great track!';

    it('should create a comment successfully', async () => {
      const mockTrack = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(),
      };

      const mockComment = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        trackId: new Types.ObjectId(trackId),
        content,
        timestampSeconds: 0,
        numLikes: 0,
        likedList: [],
        replyList: [],
      };

      (
        EngagementRepository.prototype.findTrackById as jest.Mock
      ).mockResolvedValue(mockTrack);
      (
        EngagementRepository.prototype.createComment as jest.Mock
      ).mockResolvedValue(mockComment);
      (
        EngagementRepository.prototype.addCommentToTrack as jest.Mock
      ).mockResolvedValue(undefined);

      (EngagementMapper.toPostCommentResponse as jest.Mock).mockReturnValue({
        commentId: mockComment._id.toString(),
        content,
      });

      const result = await service.postTrackComment(
        trackId,
        userId,
        content,
        undefined,
        undefined,
      );

      expect(EngagementRepository.prototype.createComment).toHaveBeenCalledWith(
        userId,
        trackId,
        content,
        0,
      );
      expect(
        EngagementRepository.prototype.addCommentToTrack,
      ).toHaveBeenCalledWith(trackId, mockComment._id.toString());
      expect(result).toEqual({
        commentId: mockComment._id.toString(),
        content,
      });
    });

    it('should create a comment with timestamp', async () => {
      const mockTrack = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(),
      };

      const mockComment = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        trackId: new Types.ObjectId(trackId),
        content,
        timestampSeconds: 120,
      };

      (
        EngagementRepository.prototype.findTrackById as jest.Mock
      ).mockResolvedValue(mockTrack);
      (
        EngagementRepository.prototype.createComment as jest.Mock
      ).mockResolvedValue(mockComment);
      (
        EngagementRepository.prototype.addCommentToTrack as jest.Mock
      ).mockResolvedValue(undefined);

      await service.postTrackComment(trackId, userId, content, 120, undefined);

      expect(EngagementRepository.prototype.createComment).toHaveBeenCalledWith(
        userId,
        trackId,
        content,
        120,
      );
    });

    it('should throw NotFoundError when track does not exist', async () => {
      (
        EngagementRepository.prototype.findTrackById as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.postTrackComment(trackId, userId, content),
      ).rejects.toThrow();
    });

    it('should throw BadRequestError when parent comment does not exist', async () => {
      const mockTrack = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(),
      };

      (
        EngagementRepository.prototype.findTrackById as jest.Mock
      ).mockResolvedValue(mockTrack);
      (
        EngagementRepository.prototype.findCommentById as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.postTrackComment(
          trackId,
          userId,
          content,
          undefined,
          '507f1f77bcf86cd799439033',
        ),
      ).rejects.toThrow();
    });

    it('should add reply to parent comment when parentCommentId provided', async () => {
      const parentCommentId = '507f1f77bcf86cd799439033';
      const mockTrack = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(),
      };

      const mockParentComment = {
        _id: new Types.ObjectId(parentCommentId),
        trackId: new Types.ObjectId(trackId),
      };

      const mockComment = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        trackId: new Types.ObjectId(trackId),
        content,
      };

      (
        EngagementRepository.prototype.findTrackById as jest.Mock
      ).mockResolvedValue(mockTrack);
      (
        EngagementRepository.prototype.findCommentById as jest.Mock
      ).mockResolvedValue(mockParentComment);
      (
        EngagementRepository.prototype.createComment as jest.Mock
      ).mockResolvedValue(mockComment);
      (
        EngagementRepository.prototype.addCommentToTrack as jest.Mock
      ).mockResolvedValue(undefined);
      (
        EngagementRepository.prototype.addReplyToComment as jest.Mock
      ).mockResolvedValue(undefined);

      await service.postTrackComment(
        trackId,
        userId,
        content,
        undefined,
        parentCommentId,
      );

      expect(
        EngagementRepository.prototype.addReplyToComment,
      ).toHaveBeenCalledWith(parentCommentId, mockComment._id.toString());
      expect(EngagementRepository.prototype.createComment).toHaveBeenCalledWith(
        userId,
        trackId,
        content,
        0,
      );
    });
  });

  describe('toggleCommentLike', () => {
    const commentId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';

    it('should add like when comment is not already liked', async () => {
      const mockComment = {
        _id: new Types.ObjectId(commentId),
        likedList: [],
        numLikes: 0,
      };

      const updatedComment = {
        _id: new Types.ObjectId(commentId),
        numLikes: 1,
      };

      (
        EngagementRepository.prototype.findCommentByIdWithLikes as jest.Mock
      ).mockResolvedValue(mockComment);
      (
        EngagementRepository.prototype.addLikeToComment as jest.Mock
      ).mockResolvedValue(updatedComment);

      (EngagementMapper.toCommentLikeResponse as jest.Mock).mockReturnValue({
        liked: true,
        numLikes: 1,
      });

      const result = await service.toggleCommentLike(commentId, userId);

      expect(
        EngagementRepository.prototype.addLikeToComment,
      ).toHaveBeenCalledWith(commentId, userId);
      expect(result).toEqual({ liked: true, numLikes: 1 });
    });

    it('should remove like when comment is already liked', async () => {
      const userObjectId = new Types.ObjectId(userId);
      const mockComment = {
        _id: new Types.ObjectId(commentId),
        likedList: [userObjectId],
        numLikes: 1,
      };

      const updatedComment = {
        _id: new Types.ObjectId(commentId),
        numLikes: 0,
      };

      (
        EngagementRepository.prototype.findCommentByIdWithLikes as jest.Mock
      ).mockResolvedValue(mockComment);
      (
        EngagementRepository.prototype.removeLikeFromComment as jest.Mock
      ).mockResolvedValue(updatedComment);

      (EngagementMapper.toCommentLikeResponse as jest.Mock).mockReturnValue({
        liked: false,
        numLikes: 0,
      });

      const result = await service.toggleCommentLike(commentId, userId);

      expect(
        EngagementRepository.prototype.removeLikeFromComment,
      ).toHaveBeenCalledWith(commentId, userId);
      expect(result).toEqual({ liked: false, numLikes: 0 });
    });

    it('should throw NotFoundError when comment does not exist', async () => {
      (
        EngagementRepository.prototype.findCommentByIdWithLikes as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.toggleCommentLike(commentId, userId),
      ).rejects.toThrow();
    });
  });
});
