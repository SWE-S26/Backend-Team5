import { Types } from 'mongoose';
import { EngagementEmailService } from '../../../src/modules/engagement/engagement.email';
import { EngagementRepository } from '../../../src/modules/engagement/engagement.repository';
import emailService from '../../../src/shared/abstractions/email/EmailService';

jest.mock('../../../src/modules/engagement/engagement.repository');
jest.mock('../../../src/shared/abstractions/email/EmailService');

describe('EngagementEmailService', () => {
  let service: EngagementEmailService;
  let mockRepository: jest.Mocked<EngagementRepository>;

  beforeEach(() => {
    mockRepository =
      new EngagementRepository() as jest.Mocked<EngagementRepository>;
    service = new EngagementEmailService(mockRepository);
    jest.clearAllMocks();
  });

  describe('sendTrackLikeEmail', () => {
    const trackId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';
    const ownerId = '507f1f77bcf86cd799439033';

    it('should send email when user has email notifications enabled', async () => {
      const mockTrackWithOwner = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(ownerId),
        basicInfo: { title: 'Test Track' },
        owner: { email: 'owner@test.com', displayName: 'Track Owner' },
      };

      const mockSettings = {
        likesAndPlaysOnYourPost: 'email' as const,
        repostOfYourPost: 'devices' as const,
        commentOnYourPost: 'devices' as const,
      };

      (
        EngagementRepository.prototype.findTrackWithOwner as jest.Mock
      ).mockResolvedValue(mockTrackWithOwner);
      (
        EngagementRepository.prototype.findUserDisplayName as jest.Mock
      ).mockResolvedValue('Liker User');
      (
        EngagementRepository.prototype.findUserNotificationSettings as jest.Mock
      ).mockResolvedValue(mockSettings);

      await service.sendTrackLikeEmail(trackId, userId);

      expect(emailService.sendEngagementNotification).toHaveBeenCalledWith(
        'owner@test.com',
        'Liker User',
        expect.stringContaining(trackId),
        expect.any(Number),
        'Test Track',
      );
    });

    it('should send email when user has both notifications enabled', async () => {
      const mockTrackWithOwner = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(ownerId),
        basicInfo: { title: 'Test Track' },
        owner: { email: 'owner@test.com', displayName: 'Track Owner' },
      };

      const mockSettings = {
        likesAndPlaysOnYourPost: 'both' as const,
        repostOfYourPost: 'devices' as const,
        commentOnYourPost: 'devices' as const,
      };

      (
        EngagementRepository.prototype.findTrackWithOwner as jest.Mock
      ).mockResolvedValue(mockTrackWithOwner);
      (
        EngagementRepository.prototype.findUserDisplayName as jest.Mock
      ).mockResolvedValue('Liker User');
      (
        EngagementRepository.prototype.findUserNotificationSettings as jest.Mock
      ).mockResolvedValue(mockSettings);

      await service.sendTrackLikeEmail(trackId, userId);

      expect(emailService.sendEngagementNotification).toHaveBeenCalled();
    });

    it('should NOT send email when user has devices-only notifications', async () => {
      const mockTrackWithOwner = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(ownerId),
        basicInfo: { title: 'Test Track' },
        owner: { email: 'owner@test.com', displayName: 'Track Owner' },
      };

      const mockSettings = {
        likesAndPlaysOnYourPost: 'devices' as const,
        repostOfYourPost: 'devices' as const,
        commentOnYourPost: 'devices' as const,
      };

      (
        EngagementRepository.prototype.findTrackWithOwner as jest.Mock
      ).mockResolvedValue(mockTrackWithOwner);
      (
        EngagementRepository.prototype.findUserDisplayName as jest.Mock
      ).mockResolvedValue('Liker User');
      (
        EngagementRepository.prototype.findUserNotificationSettings as jest.Mock
      ).mockResolvedValue(mockSettings);

      await service.sendTrackLikeEmail(trackId, userId);

      expect(emailService.sendEngagementNotification).not.toHaveBeenCalled();
    });

    it('should NOT send email when user has notifications turned off', async () => {
      const mockTrackWithOwner = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(ownerId),
        basicInfo: { title: 'Test Track' },
        owner: { email: 'owner@test.com', displayName: 'Track Owner' },
      };

      const mockSettings = {
        likesAndPlaysOnYourPost: 'off' as const,
        repostOfYourPost: 'devices' as const,
        commentOnYourPost: 'devices' as const,
      };

      (
        EngagementRepository.prototype.findTrackWithOwner as jest.Mock
      ).mockResolvedValue(mockTrackWithOwner);
      (
        EngagementRepository.prototype.findUserDisplayName as jest.Mock
      ).mockResolvedValue('Liker User');
      (
        EngagementRepository.prototype.findUserNotificationSettings as jest.Mock
      ).mockResolvedValue(mockSettings);

      await service.sendTrackLikeEmail(trackId, userId);

      expect(emailService.sendEngagementNotification).not.toHaveBeenCalled();
    });

    it('should NOT send email when settings not found', async () => {
      const mockTrackWithOwner = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(ownerId),
        basicInfo: { title: 'Test Track' },
        owner: { email: 'owner@test.com', displayName: 'Track Owner' },
      };

      (
        EngagementRepository.prototype.findTrackWithOwner as jest.Mock
      ).mockResolvedValue(mockTrackWithOwner);
      (
        EngagementRepository.prototype.findUserDisplayName as jest.Mock
      ).mockResolvedValue('Liker User');
      (
        EngagementRepository.prototype.findUserNotificationSettings as jest.Mock
      ).mockResolvedValue(null);

      await service.sendTrackLikeEmail(trackId, userId);

      expect(emailService.sendEngagementNotification).not.toHaveBeenCalled();
    });

    it('should NOT send email when user likes their own track', async () => {
      const mockTrackWithOwner = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(userId), // Same as userId
        basicInfo: { title: 'Test Track' },
        owner: { email: 'owner@test.com', displayName: 'Track Owner' },
      };

      (
        EngagementRepository.prototype.findTrackWithOwner as jest.Mock
      ).mockResolvedValue(mockTrackWithOwner);
      (
        EngagementRepository.prototype.findUserDisplayName as jest.Mock
      ).mockResolvedValue('Liker User');

      await service.sendTrackLikeEmail(trackId, userId);

      expect(emailService.sendEngagementNotification).not.toHaveBeenCalled();
      expect(
        EngagementRepository.prototype.findUserNotificationSettings,
      ).not.toHaveBeenCalled();
    });

    it('should NOT send email when track not found', async () => {
      (
        EngagementRepository.prototype.findTrackWithOwner as jest.Mock
      ).mockResolvedValue(null);

      await service.sendTrackLikeEmail(trackId, userId);

      expect(emailService.sendEngagementNotification).not.toHaveBeenCalled();
    });
  });

  describe('sendTrackRepostEmail', () => {
    const trackId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';
    const ownerId = '507f1f77bcf86cd799439033';

    it('should send email when repost notifications enabled', async () => {
      const mockTrackWithOwner = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(ownerId),
        basicInfo: { title: 'Test Track' },
        owner: { email: 'owner@test.com', displayName: 'Track Owner' },
      };

      const mockSettings = {
        likesAndPlaysOnYourPost: 'devices' as const,
        repostOfYourPost: 'email' as const,
        commentOnYourPost: 'devices' as const,
      };

      (
        EngagementRepository.prototype.findTrackWithOwner as jest.Mock
      ).mockResolvedValue(mockTrackWithOwner);
      (
        EngagementRepository.prototype.findUserDisplayName as jest.Mock
      ).mockResolvedValue('Reposter User');
      (
        EngagementRepository.prototype.findUserNotificationSettings as jest.Mock
      ).mockResolvedValue(mockSettings);

      await service.sendTrackRepostEmail(trackId, userId);

      expect(emailService.sendEngagementNotification).toHaveBeenCalled();
    });

    it('should NOT send email when repost notifications set to devices', async () => {
      const mockTrackWithOwner = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(ownerId),
        basicInfo: { title: 'Test Track' },
        owner: { email: 'owner@test.com', displayName: 'Track Owner' },
      };

      const mockSettings = {
        likesAndPlaysOnYourPost: 'devices' as const,
        repostOfYourPost: 'devices' as const,
        commentOnYourPost: 'devices' as const,
      };

      (
        EngagementRepository.prototype.findTrackWithOwner as jest.Mock
      ).mockResolvedValue(mockTrackWithOwner);
      (
        EngagementRepository.prototype.findUserDisplayName as jest.Mock
      ).mockResolvedValue('Reposter User');
      (
        EngagementRepository.prototype.findUserNotificationSettings as jest.Mock
      ).mockResolvedValue(mockSettings);

      await service.sendTrackRepostEmail(trackId, userId);

      expect(emailService.sendEngagementNotification).not.toHaveBeenCalled();
    });
  });

  describe('sendTrackCommentEmail', () => {
    const trackId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';
    const ownerId = '507f1f77bcf86cd799439033';

    it('should send email when comment notifications enabled', async () => {
      const mockTrackWithOwner = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(ownerId),
        basicInfo: { title: 'Test Track' },
        owner: { email: 'owner@test.com', displayName: 'Track Owner' },
      };

      const mockSettings = {
        likesAndPlaysOnYourPost: 'devices' as const,
        repostOfYourPost: 'devices' as const,
        commentOnYourPost: 'both' as const,
      };

      (
        EngagementRepository.prototype.findTrackWithOwner as jest.Mock
      ).mockResolvedValue(mockTrackWithOwner);
      (
        EngagementRepository.prototype.findUserDisplayName as jest.Mock
      ).mockResolvedValue('Commenter User');
      (
        EngagementRepository.prototype.findUserNotificationSettings as jest.Mock
      ).mockResolvedValue(mockSettings);

      await service.sendTrackCommentEmail(trackId, userId);

      expect(emailService.sendEngagementNotification).toHaveBeenCalled();
    });

    it('should NOT send email when comment notifications turned off', async () => {
      const mockTrackWithOwner = {
        _id: new Types.ObjectId(trackId),
        posterId: new Types.ObjectId(ownerId),
        basicInfo: { title: 'Test Track' },
        owner: { email: 'owner@test.com', displayName: 'Track Owner' },
      };

      const mockSettings = {
        likesAndPlaysOnYourPost: 'devices' as const,
        repostOfYourPost: 'devices' as const,
        commentOnYourPost: 'off' as const,
      };

      (
        EngagementRepository.prototype.findTrackWithOwner as jest.Mock
      ).mockResolvedValue(mockTrackWithOwner);
      (
        EngagementRepository.prototype.findUserDisplayName as jest.Mock
      ).mockResolvedValue('Commenter User');
      (
        EngagementRepository.prototype.findUserNotificationSettings as jest.Mock
      ).mockResolvedValue(mockSettings);

      await service.sendTrackCommentEmail(trackId, userId);

      expect(emailService.sendEngagementNotification).not.toHaveBeenCalled();
    });
  });

  describe('sendPlaylistLikeEmail', () => {
    const playlistId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';
    const artistId = '507f1f77bcf86cd799439033';

    it('should send email when playlist like notifications enabled', async () => {
      const mockPlaylistWithOwner = {
        _id: new Types.ObjectId(playlistId),
        artistId: new Types.ObjectId(artistId),
        title: 'Test Playlist',
        owner: { email: 'artist@test.com', displayName: 'Playlist Owner' },
      };

      const mockSettings = {
        likesAndPlaysOnYourPost: 'email' as const,
        repostOfYourPost: 'devices' as const,
        commentOnYourPost: 'devices' as const,
      };

      (
        EngagementRepository.prototype.findPlaylistWithOwner as jest.Mock
      ).mockResolvedValue(mockPlaylistWithOwner);
      (
        EngagementRepository.prototype.findUserDisplayName as jest.Mock
      ).mockResolvedValue('Liker User');
      (
        EngagementRepository.prototype.findUserNotificationSettings as jest.Mock
      ).mockResolvedValue(mockSettings);

      await service.sendPlaylistLikeEmail(playlistId, userId);

      expect(emailService.sendEngagementNotification).toHaveBeenCalled();
    });

    it('should NOT send email when user likes their own playlist', async () => {
      const mockPlaylistWithOwner = {
        _id: new Types.ObjectId(playlistId),
        artistId: new Types.ObjectId(userId), // Same as userId
        title: 'Test Playlist',
        owner: { email: 'artist@test.com', displayName: 'Playlist Owner' },
      };

      (
        EngagementRepository.prototype.findPlaylistWithOwner as jest.Mock
      ).mockResolvedValue(mockPlaylistWithOwner);

      await service.sendPlaylistLikeEmail(playlistId, userId);

      expect(emailService.sendEngagementNotification).not.toHaveBeenCalled();
    });
  });

  describe('sendPlaylistRepostEmail', () => {
    const playlistId = '507f1f77bcf86cd799439011';
    const userId = '507f1f77bcf86cd799439022';
    const artistId = '507f1f77bcf86cd799439033';

    it('should send email when playlist repost notifications enabled', async () => {
      const mockPlaylistWithOwner = {
        _id: new Types.ObjectId(playlistId),
        artistId: new Types.ObjectId(artistId),
        title: 'Test Playlist',
        owner: { email: 'artist@test.com', displayName: 'Playlist Owner' },
      };

      const mockSettings = {
        likesAndPlaysOnYourPost: 'devices' as const,
        repostOfYourPost: 'both' as const,
        commentOnYourPost: 'devices' as const,
      };

      (
        EngagementRepository.prototype.findPlaylistWithOwner as jest.Mock
      ).mockResolvedValue(mockPlaylistWithOwner);
      (
        EngagementRepository.prototype.findUserDisplayName as jest.Mock
      ).mockResolvedValue('Reposter User');
      (
        EngagementRepository.prototype.findUserNotificationSettings as jest.Mock
      ).mockResolvedValue(mockSettings);

      await service.sendPlaylistRepostEmail(playlistId, userId);

      expect(emailService.sendEngagementNotification).toHaveBeenCalled();
    });

    it('should NOT send email when repost notifications disabled', async () => {
      const mockPlaylistWithOwner = {
        _id: new Types.ObjectId(playlistId),
        artistId: new Types.ObjectId(artistId),
        title: 'Test Playlist',
        owner: { email: 'artist@test.com', displayName: 'Playlist Owner' },
      };

      const mockSettings = {
        likesAndPlaysOnYourPost: 'devices' as const,
        repostOfYourPost: 'off' as const,
        commentOnYourPost: 'devices' as const,
      };

      (
        EngagementRepository.prototype.findPlaylistWithOwner as jest.Mock
      ).mockResolvedValue(mockPlaylistWithOwner);
      (
        EngagementRepository.prototype.findUserDisplayName as jest.Mock
      ).mockResolvedValue('Reposter User');
      (
        EngagementRepository.prototype.findUserNotificationSettings as jest.Mock
      ).mockResolvedValue(mockSettings);

      await service.sendPlaylistRepostEmail(playlistId, userId);

      expect(emailService.sendEngagementNotification).not.toHaveBeenCalled();
    });
  });
});
