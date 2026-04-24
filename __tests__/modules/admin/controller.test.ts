import { AdminController } from '../../../src/modules/admin/admin.controller';

describe('AdminController analytics', () => {
  let controller: AdminController;
  const service = {
    getAnalyticsOverview: jest.fn(),
    getAnalyticsStorage: jest.fn(),
  } as any;

  beforeEach(() => {
    controller = new AdminController(service);
    jest.clearAllMocks();
  });

  it('should forward overview analytics to the service', async () => {
    service.getAnalyticsOverview.mockResolvedValue({
      totalUsers: 100,
      proToListenersRatio: 0.25,
      totalTracks: 50,
      totalPlays: 1000,
    });

    const req = {
      body: {},
      params: {},
      query: {},
      headers: {},
      userInfo: { role: 'Admin' },
    } as any;
    const res = { json: jest.fn() } as any;

    await controller.analyticsOverview(req, res);

    expect(service.getAnalyticsOverview).toHaveBeenCalledWith('Admin');
    expect(res.json).toHaveBeenCalledWith({
      totalUsers: 100,
      proToListenersRatio: 0.25,
      totalTracks: 50,
      totalPlays: 1000,
    });
  });

  it('should forward storage analytics to the service', async () => {
    service.getAnalyticsStorage.mockResolvedValue({
      usedBytes: 4096,
    });

    const req = {
      body: {},
      params: {},
      query: {},
      headers: {},
      userInfo: { role: 'Admin' },
    } as any;
    const res = { json: jest.fn() } as any;

    await controller.analyticsStorage(req, res);

    expect(service.getAnalyticsStorage).toHaveBeenCalledWith('Admin');
    expect(res.json).toHaveBeenCalledWith({
      usedBytes: 4096,
    });
  });
});