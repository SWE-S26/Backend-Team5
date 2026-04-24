import { AdminRepository } from '../../../src/modules/admin/admin.repository';
import User from '../../../src/shared/models/models.user';
import Track from '../../../src/shared/models/models.track';
import axios from 'axios';

jest.mock('../../../src/shared/models/models.user');
jest.mock('../../../src/shared/models/models.track');
jest.mock('axios');

describe('AdminRepository analytics', () => {
  let repository: AdminRepository;

  beforeEach(() => {
    repository = new AdminRepository();
    process.env.PUBLITO_KEY = 'key1';
    process.env.PUBLITO_SECRET = 'secret1';
    process.env.PUBLITO_KEY2 = 'key2';
    process.env.PUBLITO_SECRET2 = 'secret2';
    process.env.PUBLITO_KEY3 = 'key3';
    process.env.PUBLITO_SECRET3 = 'secret3';
    process.env.PUBLITO_KEY4 = 'key4';
    process.env.PUBLITO_SECRET4 = 'secret4';
    jest.clearAllMocks();
  });

  it('should aggregate platform analytics overview', async () => {
    (User.aggregate as jest.Mock).mockResolvedValue([
      {
        totalUsers: 100,
        proUsers: 20,
        listenerUsers: 80,
      },
    ]);
    (Track.aggregate as jest.Mock).mockResolvedValue([
      {
        totalTracks: 15,
        totalPlays: 5000,
      },
    ]);

    const result = await repository.getAnalyticsOverview();

    expect(User.aggregate).toHaveBeenCalled();
    expect(Track.aggregate).toHaveBeenCalled();
    expect(result).toEqual({
      totalUsers: 100,
      proUsers: 20,
      listenerUsers: 80,
      totalTracks: 15,
      totalPlays: 5000,
    });
  });

  it('should aggregate storage usage from publitio files list', async () => {
    (axios.get as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          files: [{ size: 1024 }],
          files_total: 1,
          files_count: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          files: [{ size: '2048' }],
          files_total: 1,
          files_count: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          files: [{ size: 512 }],
          files_total: 1,
          files_count: 1,
        },
      })
      .mockResolvedValueOnce({
        data: {
          files: [{ size: 256 }],
          files_total: 1,
          files_count: 1,
        },
      });

    const result = await repository.getAnalyticsStorage();

    expect(axios.get).toHaveBeenCalledTimes(4);
    expect(result).toEqual({
      usedBytes: 3840,
    });
  });
});