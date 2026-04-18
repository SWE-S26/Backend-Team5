import { Types } from 'mongoose';
import { EngagementMapper } from '../../../src/modules/engagement/dtos/engagement.mapper';

describe('EngagementMapper', () => {
  describe('toCommentEntryResponse', () => {
    it('should return false flags for anonymous viewer', () => {
      const ownerId = new Types.ObjectId();
      const likedById = new Types.ObjectId();

      const result = EngagementMapper.toCommentEntryResponse({
        _id: new Types.ObjectId(),
        userId: ownerId,
        trackId: new Types.ObjectId(),
        content: 'Great track',
        numLikes: 1,
        replyList: [],
        timestampSeconds: 12,
        likedList: [likedById],
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          _id: ownerId,
          displayName: 'Owner',
          profileImg: {
            imgLink: 'https://img.test/owner.jpg',
            publicId: 'owner-public-id',
          },
        },
      });

      expect(result.isLikedByUser).toBe(false);
      expect(result.isOwnComment).toBe(false);
    });

    it('should return true for both flags when owner also liked the comment', () => {
      const viewerId = new Types.ObjectId();

      const result = EngagementMapper.toCommentEntryResponse(
        {
          _id: new Types.ObjectId(),
          userId: viewerId,
          trackId: new Types.ObjectId(),
          content: 'Nice',
          numLikes: 2,
          replyList: [],
          timestampSeconds: 0,
          likedList: [viewerId],
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            _id: viewerId,
            displayName: 'Viewer',
            profileImg: {
              imgLink: 'https://img.test/viewer.jpg',
              publicId: 'viewer-public-id',
            },
          },
        },
        viewerId.toString(),
      );

      expect(result.isLikedByUser).toBe(true);
      expect(result.isOwnComment).toBe(true);
    });

    it('should return liked true and own false when viewer liked another user comment', () => {
      const ownerId = new Types.ObjectId();
      const viewerId = new Types.ObjectId();

      const result = EngagementMapper.toCommentEntryResponse(
        {
          _id: new Types.ObjectId(),
          userId: ownerId,
          trackId: new Types.ObjectId(),
          content: 'Interesting',
          numLikes: 3,
          replyList: [],
          timestampSeconds: 5,
          likedList: [viewerId],
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            _id: ownerId,
            displayName: 'Owner',
            profileImg: {
              imgLink: 'https://img.test/owner.jpg',
              publicId: 'owner-public-id',
            },
          },
        },
        viewerId.toString(),
      );

      expect(result.isLikedByUser).toBe(true);
      expect(result.isOwnComment).toBe(false);
    });
  });
});
