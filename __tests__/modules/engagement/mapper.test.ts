import { Types } from 'mongoose';
import { EngagementMapper } from '../../../src/modules/engagement/dtos/engagement.mapper';
import { ITrack } from '../../../src/shared/models/models.track';

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

  describe('toRepostedTracksResponse', () => {
    it('should normalize legacy track media and basicInfo fields before validation', () => {
      const trackId = new Types.ObjectId();
      const track = {
        _id: trackId,
        basicInfo: {
          title: 'Track title',
          permalink: 'track-title',
          mainArtists: ['Artist'],
          isPrivate: false,
          caption: 'Caption',
        },
        audio: {
          id: 'audio-id',
          audioLink: 'https://cdn.example.com/audio.mp3',
          cloudIndex: 1,
          downloadLink: 'https://cdn.example.com/download.mp3',
          waveformLink: 'https://cdn.example.com/waveform.json',
        },
        posterId: new Types.ObjectId(),
        image: {
          imgLink: 'https://cdn.example.com/image.jpg',
          publicId: 'image-public-id',
        },
        durationInSeconds: 123,
        numOfPlays: 10,
        comments: [],
        numberOfReposts: 2,
        numOfDownloads: 0,
        numOfLikes: 3,
        likedBy: [],
        permissions: {
          enableDirectDownload: false,
          offlineListening: true,
          includeInRssFeed: true,
          displayedEmbedCode: true,
          enableAppPlayback: true,
        },
        license: {
          type: 'allRightsReserved' as const,
          attribution: false,
          nonCommercial: false,
          noDerivativeWorks: false,
          shareAlike: false,
        },
        composer: '',
        releaseTitle: '',
        hidden: false,
        banReason: '',
        createdAt: new Date('2025-01-15T12:00:00Z'),
        updatedAt: new Date('2025-01-15T12:00:00Z'),
        audioClip: { start: 0, end: 123 },
      } as unknown as ITrack;

      const result = EngagementMapper.toRepostedTracksResponse(
        [track],
        1,
        0,
        20,
        {
          [trackId.toString()]: 'Great track',
        },
      );

      expect(result.tracks).toHaveLength(1);
      expect(result.tracks[0].basicInfo.genre).toBe('');
      expect(result.tracks[0].basicInfo.tags).toEqual([]);
      expect(result.tracks[0].basicInfo.description).toBe('');
      expect(result.tracks[0].audio.url).toBe(
        'https://cdn.example.com/audio.mp3',
      );
      expect(result.tracks[0].image.url).toBe(
        'https://cdn.example.com/image.jpg',
      );
      expect(result.tracks[0].repostCaption).toBe('Great track');
    });
  });
});
