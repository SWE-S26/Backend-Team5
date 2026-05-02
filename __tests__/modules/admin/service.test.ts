/// <reference types="jest" />
import { AdminService } from '../../../src/modules/admin/admin.service';
import { AdminRepository } from '../../../src/modules/admin/admin.repository';
import { AdminMapper } from '../../../src/modules/admin/dtos/admin.mapper';
import { AuthService } from '../../../src/modules/auth/auth.service';

jest.mock('../../../src/modules/admin/admin.repository');
jest.mock('../../../src/modules/admin/dtos/admin.mapper');
jest.mock('../../../src/modules/auth/auth.service');

describe('AdminService', () => {
  let service: AdminService;
  let repo: jest.Mocked<AdminRepository>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    repo = new AdminRepository() as jest.Mocked<AdminRepository>;
    authService = new AuthService() as jest.Mocked<AuthService>;
    service = new AdminService(repo, authService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should throw ForbiddenError if requester is not Admin', async () => {
      await expect(
        service.findAll({ requesterRole: 'Listener', offset: 1, limit: 20 }),
      ).rejects.toThrow('Only admins can access this resource');
    });

    it('should return mapped user list', async () => {
      repo.findAll.mockResolvedValue({ users: [], total: 0 });
      (AdminMapper.toListResponse as jest.Mock).mockReturnValue({
        total: 0,
        users: [],
      });

      const result = await service.findAll({
        requesterRole: 'Admin',
        offset: 1,
        limit: 20,
      });

      expect(repo.findAll).toHaveBeenCalledWith({
        offset: 1,
        limit: 20,
        role: undefined,
        suspended: undefined,
        query: undefined,
      });
      expect(result).toEqual({ total: 0, users: [] });
    });
  });

  describe('suspend', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should throw ForbiddenError if requester is not Admin', async () => {
      await expect(
        service.suspend(userId, 'reason', 'Listener'),
      ).rejects.toThrow('Only admins can access this resource');
    });

    it('should throw NotFoundError if user not found', async () => {
      repo.findUserById.mockResolvedValue(null);
      await expect(service.suspend(userId, 'reason', 'Admin')).rejects.toThrow(
        'user not found',
      );
    });

    it('should throw BadRequestError if user is already suspended', async () => {
      repo.findUserById.mockResolvedValue({ ban: true } as any);
      await expect(service.suspend(userId, 'reason', 'Admin')).rejects.toThrow(
        'User is already suspended',
      );
    });

    it('should suspend user and return mapped response', async () => {
      repo.findUserById.mockResolvedValue({ ban: false } as any);
      repo.banUser.mockResolvedValue({ ban: true } as any);
      repo.findAdminUserRowById.mockResolvedValue({ _id: userId } as any);
      (AdminMapper.toResponse as jest.Mock).mockReturnValue({ userId });

      const result = await service.suspend(userId, 'violation', 'Admin');

      expect(repo.banUser).toHaveBeenCalledWith(userId, 'violation');
      expect(result).toEqual({ userId });
    });
  });

  describe('unsuspend', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should throw BadRequestError if user is not suspended', async () => {
      repo.findUserById.mockResolvedValue({ ban: false } as any);
      await expect(service.unsuspend(userId, 'Admin')).rejects.toThrow(
        'User is not suspended',
      );
    });

    it('should unsuspend user and return mapped response', async () => {
      repo.findUserById.mockResolvedValue({ ban: true } as any);
      repo.unbanUser.mockResolvedValue({ ban: false } as any);
      repo.findAdminUserRowById.mockResolvedValue({ _id: userId } as any);
      (AdminMapper.toResponse as jest.Mock).mockReturnValue({ userId });

      const result = await service.unsuspend(userId, 'Admin');

      expect(repo.unbanUser).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ userId });
    });
  });

  describe('deleteUser', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('should throw ForbiddenError if trying to delete an Admin', async () => {
      repo.findUserById.mockResolvedValue({ role: 'Admin' } as any);
      await expect(service.deleteUser(userId, 'Admin')).rejects.toThrow(
        'Admin accounts cannot be deleted',
      );
    });

    it('should delete user with cleanup', async () => {
      repo.findUserById.mockResolvedValue({ role: 'Listener' } as any);
      authService.deleteUserWithCleanup = jest
        .fn()
        .mockResolvedValue(undefined);

      const result = await service.deleteUser(userId, 'Admin');

      expect(authService.deleteUserWithCleanup).toHaveBeenCalledWith(userId);
      expect(result).toEqual({ message: 'User account permanently deleted.' });
    });
  });

  describe('banTrack', () => {
    const trackId = '507f1f77bcf86cd799439022';

    it('should throw BadRequestError if track is already banned', async () => {
      repo.findTrackById.mockResolvedValue({ hidden: true } as any);
      await expect(
        service.banTrack(trackId, 'reason', 'Admin'),
      ).rejects.toThrow('Track is already banned');
    });

    it('should ban track and return mapped response', async () => {
      repo.findTrackById.mockResolvedValue({ hidden: false } as any);
      repo.banTrack.mockResolvedValue({ hidden: true } as any);
      repo.findAdminMediaTrackRowById.mockResolvedValue({
        _id: trackId,
      } as any);
      (AdminMapper.toMediaResponse as jest.Mock).mockReturnValue({
        id: trackId,
      });

      const result = await service.banTrack(trackId, 'reason', 'Admin');

      expect(repo.banTrack).toHaveBeenCalledWith(trackId, 'reason');
      expect(result).toEqual({ id: trackId });
    });
  });

  describe('unbanTrack', () => {
    const trackId = '507f1f77bcf86cd799439022';

    it('should throw BadRequestError if track is not banned', async () => {
      repo.findTrackById.mockResolvedValue({ hidden: false } as any);
      await expect(service.unbanTrack(trackId, 'Admin')).rejects.toThrow(
        'Track is not banned',
      );
    });

    it('should unban track and return mapped response', async () => {
      repo.findTrackById.mockResolvedValue({ hidden: true } as any);
      repo.unbanTrack.mockResolvedValue({ hidden: false } as any);
      repo.findAdminMediaTrackRowById.mockResolvedValue({
        _id: trackId,
      } as any);
      (AdminMapper.toMediaResponse as jest.Mock).mockReturnValue({
        id: trackId,
      });

      const result = await service.unbanTrack(trackId, 'Admin');

      expect(repo.unbanTrack).toHaveBeenCalledWith(trackId);
      expect(result).toEqual({ id: trackId });
    });
  });

  describe('deleteTrack', () => {
    const trackId = '507f1f77bcf86cd799439022';

    it('should delete track and return message', async () => {
      repo.findTrackById.mockResolvedValue({} as any);
      repo.deleteTrackById = jest.fn().mockResolvedValue(true);

      const result = await service.deleteTrack(trackId, 'Admin');

      expect(repo.deleteTrackById).toHaveBeenCalledWith(trackId);
      expect(result).toEqual({ message: 'Track permanently deleted.' });
    });
  });

  describe('createReport', () => {
    it('should create report and return mapped response', async () => {
      repo.findUserById.mockResolvedValue({ _id: 'reporterId' } as any);
      repo.findTrackById.mockResolvedValue({ _id: 'violatorTrackId' } as any);

      repo.createReport.mockResolvedValue({ _id: 'reportId' } as any);
      (AdminMapper.toReportResponse as jest.Mock).mockReturnValue({
        reportId: 'reportId',
      });

      const result = await service.createReport({
        reporterId: '507f1f77bcf86cd799439011',
        violatorId: '507f1f77bcf86cd799439033',
        violatorType: 'track',
        reason: 'bad',
      });

      expect(repo.findTrackById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439033',
      );
      expect(repo.createReport).toHaveBeenCalled();
      expect(result).toEqual({ reportId: 'reportId' });
    });
  });

  describe('updateReportStatus', () => {
    const reportId = '507f1f77bcf86cd799439033';

    it('should throw NotFoundError if report not found', async () => {
      repo.findReportById.mockResolvedValue(null);
      await expect(
        service.updateReportStatus(reportId, 'Admin'),
      ).rejects.toThrow('report not found');
    });

    it('should resolve report and return mapped response', async () => {
      repo.findReportById.mockResolvedValue({ status: 'pending' } as any);
      repo.resolveReport.mockResolvedValue({ status: 'done' } as any);
      (AdminMapper.toReportResponse as jest.Mock).mockReturnValue({
        reportId,
        status: 'done',
      });

      const result = await service.updateReportStatus(reportId, 'Admin');

      expect(repo.resolveReport).toHaveBeenCalledWith(reportId);
      expect(result).toEqual({ reportId, status: 'done' });
    });
  });

  describe('getAnalyticsOverview', () => {
    it('should throw ForbiddenError if not Admin', async () => {
      await expect(service.getAnalyticsOverview('Listener')).rejects.toThrow(
        'Only admins can access this resource',
      );
    });

    it('should return mapped analytics overview', async () => {
      repo.getAnalyticsOverview.mockResolvedValue({ totalUsers: 10 } as any);
      (AdminMapper.toAnalyticsOverviewResponse as jest.Mock).mockReturnValue({
        totalUsers: 10,
      });

      const result = await service.getAnalyticsOverview('Admin');

      expect(result).toEqual({ totalUsers: 10 });
    });
  });

  describe('getAnalyticsStorage', () => {
    it('should throw ForbiddenError if not Admin', async () => {
      await expect(service.getAnalyticsStorage('Listener')).rejects.toThrow(
        'Only admins can access this resource',
      );
    });

    it('should return mapped analytics storage', async () => {
      repo.getAnalyticsStorage.mockResolvedValue({ usedBytes: 5000 } as any);
      (AdminMapper.toAnalyticsStorageResponse as jest.Mock).mockReturnValue({
        usedBytes: 5000,
      });

      const result = await service.getAnalyticsStorage('Admin');

      expect(result).toEqual({ usedBytes: 5000 });
    });
  });

  describe('getArtistAnalytics', () => {
    it('should return mapped artist analytics', async () => {
      repo.getArtistAnalytics.mockResolvedValue({ totalPlays: 50 } as any);
      (AdminMapper.toArtistAnalyticsResponse as jest.Mock).mockReturnValue({
        totalPlays: 50,
      });

      const result = await service.getArtistAnalytics({ userId: 'userId' });

      expect(result).toEqual({ totalPlays: 50 });
    });
  });
});
