import { AdminService } from '../../../src/modules/admin/admin.service';
import { AdminRepository } from '../../../src/modules/admin/admin.repository';

jest.mock('../../../src/modules/admin/admin.repository');

describe('AdminService analytics', () => {
  let service: AdminService;

  beforeEach(() => {
    service = new AdminService(new AdminRepository());
    jest.clearAllMocks();
  });

  it('should reject non-admin access for overview', async () => {
    await expect(service.getAnalyticsOverview('Listener')).rejects.toThrow(
      'Only admins can access this resource',
    );
  });

  it('should return mapped overview analytics for admins', async () => {
    (AdminRepository.prototype.getAnalyticsOverview as jest.Mock).mockResolvedValue(
      {
        totalUsers: 100,
        proUsers: 10,
        listenerUsers: 40,
        totalTracks: 50,
        totalPlays: 1000,
      },
    );

    const result = await service.getAnalyticsOverview('Admin');

    expect(AdminRepository.prototype.getAnalyticsOverview).toHaveBeenCalled();
    expect(result).toEqual({
      totalUsers: 100,
      proToListenersRatio: 0.25,
      totalTracks: 50,
      totalPlays: 1000,
    });
  });

  it('should return mapped storage analytics for admins', async () => {
    (AdminRepository.prototype.getAnalyticsStorage as jest.Mock).mockResolvedValue(
      {
        usedBytes: 4096,
      },
    );

    const result = await service.getAnalyticsStorage('Admin');

    expect(AdminRepository.prototype.getAnalyticsStorage).toHaveBeenCalled();
    expect(result).toEqual({
      usedBytes: 4096,
    });
  });
});