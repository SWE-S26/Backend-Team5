import { Types } from 'mongoose';
import { AdminRepository } from '../../../src/modules/admin/admin.repository';
import User from '../../../src/shared/models/models.user';
import Track from '../../../src/shared/models/models.track';
import Report from '../../../src/shared/models/models.report';
import axios from 'axios';

jest.mock('../../../src/shared/models/models.user');
jest.mock('../../../src/shared/models/models.track');
jest.mock('../../../src/shared/models/models.report');
jest.mock('axios');

describe('AdminRepository', () => {
  let repo: AdminRepository;

  beforeEach(() => {
    repo = new AdminRepository();
    jest.clearAllMocks();
  });

  describe('findUserById', () => {
    it('should return user when found', async () => {
      const fakeUser = { _id: 'u1', displayName: 'Test' };
      (User.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(fakeUser),
      });

      const result = await repo.findUserById('u1');
      expect(User.findById).toHaveBeenCalledWith('u1');
      expect(result).toEqual(fakeUser);
    });

    it('should return null if not found', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await repo.findUserById('u1');
      expect(result).toBeNull();
    });
  });

  describe('findTrackById', () => {
    it('should return track when found', async () => {
      const fakeTrack = { _id: 't1', title: 'Track' };
      (Track.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(fakeTrack),
      });

      const result = await repo.findTrackById('t1');
      expect(Track.findById).toHaveBeenCalledWith('t1');
      expect(result).toEqual(fakeTrack);
    });
  });

  describe('banUser', () => {
    it('should update user ban status and return updated doc', async () => {
      const updatedUser = { _id: 'u1', ban: true, banReason: 'violation' };
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await repo.banUser('u1', 'violation');

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'u1',
        { ban: true, banReason: 'violation' },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('unbanUser', () => {
    it('should remove user ban and return updated doc', async () => {
      const updatedUser = { _id: 'u1', ban: false, banReason: '' };
      (User.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedUser),
      });

      const result = await repo.unbanUser('u1');

      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        'u1',
        { ban: false, banReason: '' },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(updatedUser);
    });
  });

  describe('banTrack', () => {
    it('should update track hidden status and return updated doc', async () => {
      const updatedTrack = { _id: 't1', hidden: true, banReason: 'explicit' };
      (Track.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedTrack),
      });

      const result = await repo.banTrack('t1', 'explicit');

      expect(Track.findByIdAndUpdate).toHaveBeenCalledWith(
        't1',
        { hidden: true, banReason: 'explicit' },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(updatedTrack);
    });
  });

  describe('unbanTrack', () => {
    it('should remove track hidden status and return updated doc', async () => {
      const updatedTrack = { _id: 't1', hidden: false };
      (Track.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedTrack),
      });

      const result = await repo.unbanTrack('t1');

      expect(Track.findByIdAndUpdate).toHaveBeenCalledWith(
        't1',
        { hidden: false, banReason: '' },
        { new: true, runValidators: true },
      );
      expect(result).toEqual(updatedTrack);
    });
  });

  describe('deleteTrackById', () => {
    it('should return false if track not found', async () => {
      (Track.findById as jest.Mock).mockResolvedValue(null);

      const result = await repo.deleteTrackById('t1');

      expect(result).toBe(false);
    });

    it('should delete track and return true if found', async () => {
      const mockTrack = { deleteOne: jest.fn().mockResolvedValue(undefined) };
      (Track.findById as jest.Mock).mockResolvedValue(mockTrack);

      const result = await repo.deleteTrackById('t1');

      expect(mockTrack.deleteOne).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('createReport', () => {
    it('should create and return the report', async () => {
      const fakeReport = {
        _id: new Types.ObjectId(),
        reporterId: new Types.ObjectId(),
        violatorId: new Types.ObjectId(),
        violatorType: 'track',
        reason: 'bad',
        status: 'pending',
        createdAt: new Date(),
      };

      (Report.create as jest.Mock).mockResolvedValue(fakeReport);

      const result = await repo.createReport({
        reporterId: fakeReport.reporterId.toString(),
        violatorId: fakeReport.violatorId.toString(),
        violatorType: 'track',
        reason: 'bad',
      });

      expect(Report.create).toHaveBeenCalled();
      expect(result._id).toEqual(fakeReport._id);
      expect(result.status).toBe('pending');
    });
  });

  describe('findReportById', () => {
    it('should return null if report not found', async () => {
      (Report.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await repo.findReportById('507f1f77bcf86cd799439033');
      expect(result).toBeNull();
    });

    it('should return mapped report if found', async () => {
      const fakeReport = {
        _id: new Types.ObjectId(),
        reporterId: new Types.ObjectId(),
        violatorId: new Types.ObjectId(),
        violatorType: 'user',
        reason: 'spam',
        status: 'pending',
        createdAt: new Date(),
      };

      (Report.findById as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(fakeReport),
      });

      const result = await repo.findReportById(fakeReport._id.toString());
      expect(result?._id).toEqual(fakeReport._id);
    });
  });

  describe('resolveReport', () => {
    it('should return null if no pending report found', async () => {
      (Report.findOneAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      // MUST use a valid 24-char hex string because the repo runs new Types.ObjectId(reportId)
      const result = await repo.resolveReport('507f1f77bcf86cd799439033');
      expect(result).toBeNull();
    });

    it('should update status to done and return report', async () => {
      const resolvedReport = {
        _id: new Types.ObjectId(),
        status: 'done',
        resolvedTime: expect.any(Date),
      };

      (Report.findOneAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue(resolvedReport),
      });

      const result = await repo.resolveReport(resolvedReport._id.toString());

      expect(Report.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: expect.any(Types.ObjectId), status: 'pending' },
        { $set: { status: 'done', resolvedTime: expect.any(Date) } },
        { new: true, runValidators: true },
      );
      expect(result?.status).toBe('done');
    });
  });

  describe('getAnalyticsStorage', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset all Publitio keys to isolate the test environment
      process.env = { ...originalEnv };
      delete process.env.PUBLITO_KEY;
      delete process.env.PUBLITO_SECRET;
      delete process.env.PUBLITO_KEY2;
      delete process.env.PUBLITO_SECRET2;
      delete process.env.PUBLITO_KEY3;
      delete process.env.PUBLITO_SECRET3;
      delete process.env.PUBLITO_KEY4;
      delete process.env.PUBLITO_SECRET4;

      process.env.PUBLITO_KEY = 'test_key';
      process.env.PUBLITO_SECRET = 'test_secret';
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should sum file sizes from Publitio API', async () => {
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          files: [{ size: 1024 }, { size: 2048 }],
          files_total: 2,
          files_count: 2,
        },
      });

      const result = await repo.getAnalyticsStorage();

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.publit.io/v1/files/list',
        expect.objectContaining({
          params: expect.objectContaining({ api_key: 'test_key' }),
        }),
      );
      expect(result.usedBytes).toBe(3072);
    });
  });

  describe('findAll', () => {
    it('should execute aggregation and return results', async () => {
      const aggregateResult = [{ users: [{ _id: 'u1' }], total: 1 }];
      (User.aggregate as jest.Mock).mockResolvedValue(aggregateResult);

      const result = await repo.findAll({ offset: 1, limit: 20 });

      expect(User.aggregate).toHaveBeenCalled();
      expect(result.users).toEqual([{ _id: 'u1' }]);
      expect(result.total).toBe(1);
    });
  });
});
