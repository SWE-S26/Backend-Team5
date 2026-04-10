/// <reference types="jest" />
import { Request, Response } from 'express';
import { EngagementController } from '../../../src/modules/engagement/engagement.controller';
import { EngagementService } from '../../../src/modules/engagement/engagement.service';

jest.mock('../../../src/modules/engagement/engagement.service');

describe('EngagementController', () => {
  let controller: EngagementController;
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    controller = new EngagementController(new EngagementService({} as any));
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('toggleTrackLike', () => {
    const trackId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';

    it('should toggle track like and return result', async () => {
      mockReq = {
        params: { trackId },
        userInfo: { _id: userId } as any,
        body: {},
        query: {},
      };

      const mockResult = { liked: true, numOfLikes: 5 };
      (
        EngagementService.prototype.toggleTrackLike as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.toggleTrackLike(mockReq as Request, mockRes as Response);

      expect(EngagementService.prototype.toggleTrackLike).toHaveBeenCalledWith(
        trackId,
        userId,
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should throw error when trackId is invalid', async () => {
      mockReq = {
        params: { trackId: 'invalid-id' },
        userInfo: { _id: userId } as any,
        body: {},
        query: {},
      };

      await expect(
        controller.toggleTrackLike(mockReq as Request, mockRes as Response),
      ).rejects.toThrow();
    });

    it('should throw error when trackId is missing', async () => {
      mockReq = {
        params: {},
        userInfo: { _id: userId } as any,
        body: {},
        query: {},
      };

      await expect(
        controller.toggleTrackLike(mockReq as Request, mockRes as Response),
      ).rejects.toThrow();
    });
  });

  describe('toggleTrackRepost', () => {
    const trackId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';

    it('should toggle track repost without caption', async () => {
      mockReq = {
        params: { trackId },
        userInfo: { _id: userId } as any,
        body: {},
        query: {},
      };

      const mockResult = { reposted: true, numberOfReposts: 3 };
      (
        EngagementService.prototype.toggleTrackRepost as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.toggleTrackRepost(
        mockReq as Request,
        mockRes as Response,
      );

      expect(
        EngagementService.prototype.toggleTrackRepost,
      ).toHaveBeenCalledWith(trackId, userId, undefined);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should toggle track repost with caption', async () => {
      const caption = 'Great track!';
      mockReq = {
        params: { trackId },
        userInfo: { _id: userId } as any,
        body: { caption },
        query: {},
      };

      const mockResult = { reposted: true, numberOfReposts: 3 };
      (
        EngagementService.prototype.toggleTrackRepost as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.toggleTrackRepost(
        mockReq as Request,
        mockRes as Response,
      );

      expect(
        EngagementService.prototype.toggleTrackRepost,
      ).toHaveBeenCalledWith(trackId, userId, caption);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('togglePlaylistLike', () => {
    const playlistId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';

    it('should toggle playlist like and return result', async () => {
      mockReq = {
        params: { playlistId },
        userInfo: { _id: userId } as any,
        body: {},
        query: {},
      };

      const mockResult = { liked: true, numOfLikes: 10 };
      (
        EngagementService.prototype.togglePlaylistLike as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.togglePlaylistLike(
        mockReq as Request,
        mockRes as Response,
      );

      expect(
        EngagementService.prototype.togglePlaylistLike,
      ).toHaveBeenCalledWith(playlistId, userId);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should throw error when playlistId is missing', async () => {
      mockReq = {
        params: {},
        userInfo: { _id: userId } as any,
        body: {},
        query: {},
      };

      await expect(
        controller.togglePlaylistLike(mockReq as Request, mockRes as Response),
      ).rejects.toThrow();
    });
  });

  describe('getTrackLikers', () => {
    const trackId = '507f1f77bcf86cd799439011';

    it('should get track likers with pagination', async () => {
      mockReq = {
        params: { trackId },
        query: { offset: '0', limit: '20' },
        body: {},
      };

      const mockResult = {
        users: [{ _id: '123', displayName: 'User 1' }],
        total: 1,
        page: 1,
        limit: 20,
      };

      (
        EngagementService.prototype.getTrackLikers as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.getTrackLikers(mockReq as Request, mockRes as Response);

      expect(EngagementService.prototype.getTrackLikers).toHaveBeenCalledWith(
        trackId,
        '0',
        '20',
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should use default pagination values when not provided', async () => {
      mockReq = {
        params: { trackId },
        query: {},
        body: {},
      };

      const mockResult = { users: [], total: 0, page: 1, limit: 20 };
      (
        EngagementService.prototype.getTrackLikers as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.getTrackLikers(mockReq as Request, mockRes as Response);

      // DTOs provide default values when not specified
      expect(EngagementService.prototype.getTrackLikers).toHaveBeenCalledWith(
        trackId,
        '0',
        '20',
      );
    });
  });

  describe('getPlaylistLikers', () => {
    const playlistId = '507f1f77bcf86cd799439011';

    it('should get playlist likers with pagination', async () => {
      mockReq = {
        params: { playlistId },
        query: { offset: '10', limit: '50' },
        body: {},
      };

      const mockResult = {
        users: [{ _id: '123', displayName: 'User 1' }],
        total: 1,
      };

      (
        EngagementService.prototype.getPlaylistLikers as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.getPlaylistLikers(
        mockReq as Request,
        mockRes as Response,
      );

      expect(
        EngagementService.prototype.getPlaylistLikers,
      ).toHaveBeenCalledWith(playlistId, '10', '50');
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getTrackRepostStatus', () => {
    const trackId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';

    it('should get track repost status for user', async () => {
      mockReq = {
        params: { trackId },
        userInfo: { _id: userId } as any,
        body: {},
        query: {},
      };

      const mockResult = {
        reposted: true,
        caption: 'Amazing!',
        repostTimestamp: '2024-01-01',
      };

      (
        EngagementService.prototype.getTrackRepostStatus as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.getTrackRepostStatus(
        mockReq as Request,
        mockRes as Response,
      );

      expect(
        EngagementService.prototype.getTrackRepostStatus,
      ).toHaveBeenCalledWith(trackId, userId);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('updateTrackRepostCaption', () => {
    const trackId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';
    const caption = 'Updated caption';

    it('should update track repost caption', async () => {
      mockReq = {
        params: { trackId },
        userInfo: { _id: userId } as any,
        body: { caption },
        query: {},
      };

      const mockResult = { success: true, caption };
      (
        EngagementService.prototype.updateTrackRepostCaption as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.updateTrackRepostCaption(
        mockReq as Request,
        mockRes as Response,
      );

      expect(
        EngagementService.prototype.updateTrackRepostCaption,
      ).toHaveBeenCalledWith(trackId, userId, caption);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should throw error when caption is missing', async () => {
      mockReq = {
        params: { trackId },
        userInfo: { _id: userId } as any,
        body: {},
        query: {},
      };

      await expect(
        controller.updateTrackRepostCaption(
          mockReq as Request,
          mockRes as Response,
        ),
      ).rejects.toThrow();
    });
  });

  describe('togglePlaylistRepost', () => {
    const playlistId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';

    it('should toggle playlist repost without caption', async () => {
      mockReq = {
        params: { playlistId },
        userInfo: { _id: userId } as any,
        body: {},
        query: {},
      };

      const mockResult = { reposted: true, numOfReposts: 5 };
      (
        EngagementService.prototype.togglePlaylistRepost as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.togglePlaylistRepost(
        mockReq as Request,
        mockRes as Response,
      );

      expect(
        EngagementService.prototype.togglePlaylistRepost,
      ).toHaveBeenCalledWith(playlistId, userId, undefined);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should toggle playlist repost with caption', async () => {
      const caption = 'Love this playlist!';
      mockReq = {
        params: { playlistId },
        userInfo: { _id: userId } as any,
        body: { caption },
        query: {},
      };

      const mockResult = { reposted: true, numOfReposts: 5 };
      (
        EngagementService.prototype.togglePlaylistRepost as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.togglePlaylistRepost(
        mockReq as Request,
        mockRes as Response,
      );

      expect(
        EngagementService.prototype.togglePlaylistRepost,
      ).toHaveBeenCalledWith(playlistId, userId, caption);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('postTrackComment', () => {
    const trackId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';
    const content = 'Great track!';
    const timestamp = 0;

    it('should post track comment and return 201', async () => {
      mockReq = {
        params: { trackId },
        userInfo: { _id: userId } as any,
        body: { content, timestamp },
        query: {},
      };

      const mockResult = {
        commentId: '507f1f77bcf86cd799439033',
        content,
      };

      (
        EngagementService.prototype.postTrackComment as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.postTrackComment(
        mockReq as Request,
        mockRes as Response,
      );

      expect(EngagementService.prototype.postTrackComment).toHaveBeenCalledWith(
        trackId,
        userId,
        content,
        timestamp,
        undefined,
      );
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should post track comment with timestamp', async () => {
      const timestamp = 120;
      mockReq = {
        params: { trackId },
        userInfo: { _id: userId } as any,
        body: { content, timestamp },
        query: {},
      };

      const mockResult = { commentId: '123', content };
      (
        EngagementService.prototype.postTrackComment as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.postTrackComment(
        mockReq as Request,
        mockRes as Response,
      );

      expect(EngagementService.prototype.postTrackComment).toHaveBeenCalledWith(
        trackId,
        userId,
        content,
        timestamp,
        undefined,
      );
    });

    it('should post comment reply with parentCommentId', async () => {
      const parentCommentId = '507f1f77bcf86cd799439044';
      mockReq = {
        params: { trackId },
        userInfo: { _id: userId } as any,
        body: { content, timestamp, parentCommentId },
        query: {},
      };

      const mockResult = { commentId: '123', content };
      (
        EngagementService.prototype.postTrackComment as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.postTrackComment(
        mockReq as Request,
        mockRes as Response,
      );

      expect(EngagementService.prototype.postTrackComment).toHaveBeenCalledWith(
        trackId,
        userId,
        content,
        timestamp,
        parentCommentId,
      );
    });

    it('should throw error when content is missing', async () => {
      mockReq = {
        params: { trackId },
        userInfo: { _id: userId } as any,
        body: {},
        query: {},
      };

      await expect(
        controller.postTrackComment(mockReq as Request, mockRes as Response),
      ).rejects.toThrow();
    });

    it('should throw error when content is empty string and not call service', async () => {
      mockReq = {
        params: { trackId },
        userInfo: { _id: userId } as any,
        body: { content: '' },
        query: {},
      };

      await expect(
        controller.postTrackComment(mockReq as Request, mockRes as Response),
      ).rejects.toThrow();

      expect(
        EngagementService.prototype.postTrackComment,
      ).not.toHaveBeenCalled();
    });

    it('should throw error when timestamp is decimal and not call service', async () => {
      mockReq = {
        params: { trackId },
        userInfo: { _id: userId } as any,
        body: { content, timestamp: 42.5 },
        query: {},
      };

      await expect(
        controller.postTrackComment(mockReq as Request, mockRes as Response),
      ).rejects.toThrow();

      expect(
        EngagementService.prototype.postTrackComment,
      ).not.toHaveBeenCalled();
    });
  });

  describe('toggleCommentLike', () => {
    const commentId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';

    it('should toggle comment like', async () => {
      mockReq = {
        params: { commentId },
        userInfo: { _id: userId } as any,
        body: {},
        query: {},
      };

      const mockResult = { liked: true, numLikes: 8 };
      (
        EngagementService.prototype.toggleCommentLike as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.toggleCommentLike(
        mockReq as Request,
        mockRes as Response,
      );

      expect(
        EngagementService.prototype.toggleCommentLike,
      ).toHaveBeenCalledWith(commentId, userId);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getTrackComments', () => {
    const trackId = '507f1f77bcf86cd799439011';

    it('should get track comments with sorting', async () => {
      mockReq = {
        params: { trackId },
        query: { offset: '0', limit: '20', sortBy: 'newest' },
        body: {},
      };

      const mockResult = {
        comments: [{ commentId: '123', content: 'Comment 1' }],
        total: 1,
      };

      (
        EngagementService.prototype.getTrackComments as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.getTrackComments(
        mockReq as Request,
        mockRes as Response,
      );

      expect(EngagementService.prototype.getTrackComments).toHaveBeenCalledWith(
        trackId,
        '0',
        '20',
        'newest',
      );
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('should work without sortBy parameter', async () => {
      mockReq = {
        params: { trackId },
        query: { offset: '0', limit: '20' },
        body: {},
      };

      const mockResult = { comments: [], total: 0 };
      (
        EngagementService.prototype.getTrackComments as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.getTrackComments(
        mockReq as Request,
        mockRes as Response,
      );

      // DTOs provide default sortBy value when not specified
      expect(EngagementService.prototype.getTrackComments).toHaveBeenCalledWith(
        trackId,
        '0',
        '20',
        'newest',
      );
    });
  });

  describe('getCommentReplies', () => {
    const commentId = '507f1f77bcf86cd799439011';

    it('should get comment replies with pagination', async () => {
      mockReq = {
        params: { commentId },
        query: { offset: '0', limit: '10' },
        body: {},
      };

      const mockResult = {
        replies: [{ commentId: '123', content: 'Reply 1' }],
        total: 1,
      };

      (
        EngagementService.prototype.getCommentReplies as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.getCommentReplies(
        mockReq as Request,
        mockRes as Response,
      );

      expect(
        EngagementService.prototype.getCommentReplies,
      ).toHaveBeenCalledWith(commentId, '0', '10');
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('deleteTrackComment', () => {
    const commentId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';

    it('should delete track comment', async () => {
      mockReq = {
        params: { commentId },
        userInfo: { _id: userId } as any,
        body: {},
        query: {},
      };

      const mockResult = { success: true, message: 'Comment deleted' };
      (
        EngagementService.prototype.deleteTrackComment as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.deleteTrackComment(
        mockReq as Request,
        mockRes as Response,
      );

      expect(
        EngagementService.prototype.deleteTrackComment,
      ).toHaveBeenCalledWith(commentId, userId);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getTrackReposters', () => {
    const trackId = '507f1f77bcf86cd799439011';

    it('should get track reposters with pagination', async () => {
      mockReq = {
        params: { trackId },
        query: { offset: '0', limit: '20' },
        body: {},
      };

      const mockResult = {
        users: [{ _id: '123', displayName: 'User 1' }],
        total: 1,
      };

      (
        EngagementService.prototype.getTrackReposters as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.getTrackReposters(
        mockReq as Request,
        mockRes as Response,
      );

      expect(
        EngagementService.prototype.getTrackReposters,
      ).toHaveBeenCalledWith(trackId, '0', '20');
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getPlaylistReposters', () => {
    const playlistId = '507f1f77bcf86cd799439011';

    it('should get playlist reposters with pagination', async () => {
      mockReq = {
        params: { playlistId },
        query: { offset: '5', limit: '15' },
        body: {},
      };

      const mockResult = {
        users: [{ _id: '123', displayName: 'User 1' }],
        total: 1,
      };

      (
        EngagementService.prototype.getPlaylistReposters as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.getPlaylistReposters(
        mockReq as Request,
        mockRes as Response,
      );

      expect(
        EngagementService.prototype.getPlaylistReposters,
      ).toHaveBeenCalledWith(playlistId, '5', '15');
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('getPlaylistRepostStatus', () => {
    const playlistId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';

    it('should get playlist repost status for user', async () => {
      mockReq = {
        params: { playlistId },
        userInfo: { _id: userId } as any,
        body: {},
        query: {},
      };

      const mockResult = {
        reposted: true,
        caption: 'Great playlist!',
        repostTimestamp: '2024-01-01',
      };

      (
        EngagementService.prototype.getPlaylistRepostStatus as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.getPlaylistRepostStatus(
        mockReq as Request,
        mockRes as Response,
      );

      expect(
        EngagementService.prototype.getPlaylistRepostStatus,
      ).toHaveBeenCalledWith(playlistId, userId);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe('updatePlaylistRepostCaption', () => {
    const playlistId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';
    const caption = 'Updated playlist caption';

    it('should update playlist repost caption', async () => {
      mockReq = {
        params: { playlistId },
        userInfo: { _id: userId } as any,
        body: { caption },
        query: {},
      };

      const mockResult = { success: true, caption };
      (
        EngagementService.prototype.updatePlaylistRepostCaption as jest.Mock
      ).mockResolvedValue(mockResult);

      await controller.updatePlaylistRepostCaption(
        mockReq as Request,
        mockRes as Response,
      );

      expect(
        EngagementService.prototype.updatePlaylistRepostCaption,
      ).toHaveBeenCalledWith(playlistId, userId, caption);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });
  });
});
