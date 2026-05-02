import { AdminController } from '../../../src/modules/admin/admin.controller';
import { AdminService } from '../../../src/modules/admin/admin.service';
import { Request, Response } from 'express';
import { parseRequest } from '../../../src/shared/dtos/requestParser';

jest.mock('../../../src/shared/dtos/requestParser');
jest.mock('../../../src/modules/admin/admin.service');

describe('AdminController', () => {
  let controller: AdminController;
  let service: jest.Mocked<AdminService>;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    service = new AdminService({} as any) as jest.Mocked<AdminService>;
    controller = new AdminController(service);

    req = {
      userInfo: { _id: '507f1f77bcf86cd799439011', role: 'Admin' } as any,
      params: {},
      body: {},
      query: {},
    } as unknown as Request;

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  const mockValid = (data: any) => {
    (parseRequest as jest.Mock).mockReturnValue({
      success: true,
      data,
    });
  };

  const mockInvalid = (error = new Error('invalid')) => {
    (parseRequest as jest.Mock).mockReturnValue({
      success: false,
      error,
    });
  };

  describe('findAll', () => {
    it('should return users list on success', async () => {
      mockValid({ query: { offset: 1, limit: 20 } });
      service.findAll.mockResolvedValue({
        total: 0,
        offset: 1,
        limit: 20,
        users: [],
      });

      await controller.findAll(req as Request, res as Response);

      expect(service.findAll).toHaveBeenCalledWith({
        requesterRole: 'Admin',
        offset: 1,
        limit: 20,
      });
      expect(res.json).toHaveBeenCalled();
    });

    it('should throw when request validation fails', async () => {
      mockInvalid(new Error('bad request'));

      await expect(
        controller.findAll(req as Request, res as Response),
      ).rejects.toThrow('bad request');
    });
  });

  describe('listMedia', () => {
    it('should return media list on success', async () => {
      mockValid({ query: { offset: 1, limit: 20 } });
      service.listMedia.mockResolvedValue({
        total: 0,
        offset: 1,
        limit: 20,
        items: [],
      });

      await controller.listMedia(req as Request, res as Response);

      expect(service.listMedia).toHaveBeenCalledWith({
        requesterRole: 'Admin',
        offset: 1,
        limit: 20,
      });
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('listReports', () => {
    it('should return reports list on success', async () => {
      mockValid({ query: { offset: 1, limit: 20 } });
      service.listReports.mockResolvedValue({
        total: 0,
        offset: 1,
        limit: 20,
        reports: [],
      });

      await controller.listReports(req as Request, res as Response);

      expect(service.listReports).toHaveBeenCalledWith({
        requesterRole: 'Admin',
        offset: 1,
        limit: 20,
      });
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('suspendUser', () => {
    it('should suspend user and return 200', async () => {
      req.params = { userId: '507f1f77bcf86cd799439011' };
      mockValid({
        params: { userId: '507f1f77bcf86cd799439011' },
        body: { reason: 'violation' },
      });
      service.suspend.mockResolvedValue({
        userId: '507f1f77bcf86cd799439011',
      } as any);

      await controller.suspendUser(req as Request, res as Response);

      expect(service.suspend).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'violation',
        'Admin',
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('unsuspendUser', () => {
    it('should unsuspend user and return 200', async () => {
      req.params = { userId: '507f1f77bcf86cd799439011' };
      mockValid({ params: { userId: '507f1f77bcf86cd799439011' } });
      service.unsuspend.mockResolvedValue({
        userId: '507f1f77bcf86cd799439011',
      } as any);

      await controller.unsuspendUser(req as Request, res as Response);

      expect(service.unsuspend).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'Admin',
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return 200', async () => {
      req.params = { userId: '507f1f77bcf86cd799439011' };
      mockValid({ params: { userId: '507f1f77bcf86cd799439011' } });
      service.deleteUser.mockResolvedValue({
        message: 'User account permanently deleted.',
      });

      await controller.deleteUser(req as Request, res as Response);

      expect(service.deleteUser).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        'Admin',
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('banTrack', () => {
    it('should ban track and return 200', async () => {
      req.params = { trackId: '507f1f77bcf86cd799439022' };
      mockValid({
        params: { trackId: '507f1f77bcf86cd799439022' },
        body: { reason: 'inappropriate' },
      });
      service.banTrack.mockResolvedValue({
        id: '507f1f77bcf86cd799439022',
      } as any);

      await controller.banTrack(req as Request, res as Response);

      expect(service.banTrack).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439022',
        'inappropriate',
        'Admin',
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should pass empty string as reason when body is not provided', async () => {
      req.params = { trackId: '507f1f77bcf86cd799439022' };
      mockValid({
        params: { trackId: '507f1f77bcf86cd799439022' },
        body: undefined,
      });
      service.banTrack.mockResolvedValue({
        id: '507f1f77bcf86cd799439022',
      } as any);

      await controller.banTrack(req as Request, res as Response);

      expect(service.banTrack).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439022',
        '',
        'Admin',
      );
    });
  });

  describe('unbanTrack', () => {
    it('should unban track and return 200', async () => {
      req.params = { trackId: '507f1f77bcf86cd799439022' };
      mockValid({ params: { trackId: '507f1f77bcf86cd799439022' } });
      service.unbanTrack.mockResolvedValue({
        id: '507f1f77bcf86cd799439022',
      } as any);

      await controller.unbanTrack(req as Request, res as Response);

      expect(service.unbanTrack).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439022',
        'Admin',
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deleteTrack', () => {
    it('should delete track and return 200', async () => {
      req.params = { trackId: '507f1f77bcf86cd799439022' };
      mockValid({ params: { trackId: '507f1f77bcf86cd799439022' } });
      service.deleteTrack.mockResolvedValue({
        message: 'Track permanently deleted.',
      });

      await controller.deleteTrack(req as Request, res as Response);

      expect(service.deleteTrack).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439022',
        'Admin',
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('createReport', () => {
    it('should create report and return 201', async () => {
      mockValid({
        body: {
          violatorId: '507f1f77bcf86cd799439033',
          violatorType: 'track',
          reason: 'Bad content',
        },
      });
      service.createReport.mockResolvedValue({ reportId: '123' } as any);

      await controller.createReport(req as Request, res as Response);

      expect(service.createReport).toHaveBeenCalledWith({
        reporterId: '507f1f77bcf86cd799439011',
        violatorId: '507f1f77bcf86cd799439033',
        violatorType: 'track',
        reason: 'Bad content',
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateReportStatus', () => {
    it('should update report status and return 200', async () => {
      req.params = { reportId: '507f1f77bcf86cd799439044' };
      mockValid({ params: { reportId: '507f1f77bcf86cd799439044' } });
      service.updateReportStatus.mockResolvedValue({
        reportId: '507f1f77bcf86cd799439044',
        status: 'done',
      } as any);

      await controller.updateReportStatus(req as Request, res as Response);

      expect(service.updateReportStatus).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439044',
        'Admin',
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('analyticsOverview', () => {
    it('should return analytics overview', async () => {
      mockValid({});
      service.getAnalyticsOverview.mockResolvedValue({
        totalUsers: 100,
      } as any);

      await controller.analyticsOverview(req as Request, res as Response);

      expect(service.getAnalyticsOverview).toHaveBeenCalledWith('Admin');
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('analyticsStorage', () => {
    it('should return analytics storage', async () => {
      mockValid({});
      service.getAnalyticsStorage.mockResolvedValue({ usedBytes: 5000 } as any);

      await controller.analyticsStorage(req as Request, res as Response);

      expect(service.getAnalyticsStorage).toHaveBeenCalledWith('Admin');
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('artistAnalytics', () => {
    it('should return artist analytics', async () => {
      mockValid({});
      service.getArtistAnalytics.mockResolvedValue({ totalPlays: 50 } as any);

      await controller.artistAnalytics(req as Request, res as Response);

      expect(service.getArtistAnalytics).toHaveBeenCalledWith({
        userId: '507f1f77bcf86cd799439011',
      });
      expect(res.json).toHaveBeenCalled();
    });
  });
});
