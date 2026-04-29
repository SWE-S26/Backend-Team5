import { FollowingController } from '../../../src/modules/following/following.controller';
import { FollowingService } from '../../../src/modules/following/following.service';
import { Request, Response } from 'express';
import { parseRequest } from '../../../src/shared/dtos/requestParser';

jest.mock('../../../src/shared/dtos/requestParser');

describe('FollowingController - FULL TEST', () => {
  let controller: FollowingController;
  let service: jest.Mocked<FollowingService>;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    service = {
      addFollower: jest.fn(),
      removeFollower: jest.fn(),
      block: jest.fn(),
      unblock: jest.fn(),
      getFollowers: jest.fn(),
      getFollowed: jest.fn(),
      getSuggestedUsers: jest.fn(),
      getBlocked: jest.fn(),
    } as any;

    controller = new FollowingController(service);

    req = {
      userInfo: { _id: 'user1' } as any,
      params: {},
      query: {},
      body: {},
    } as unknown as Request;

    res = {
      json: jest.fn(),
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

  // =========================
  // addFollower
  // =========================
  it('addFollower - success', async () => {
    req.params = { id: 'user2' };
    mockValid({ params: { id: 'user2' } });

    service.addFollower.mockResolvedValue({ id: 'user2' } as any);

    await controller.addFollower(req as Request, res as Response);

    expect(service.addFollower).toHaveBeenCalledWith('user1', 'user2');
    expect(res.json).toHaveBeenCalledWith({ id: 'user2' });
  });

  it('addFollower - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.addFollower(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  // =========================
  // removeFollower
  // =========================
  it('removeFollower - success', async () => {
    req.params = { id: 'user2' };
    mockValid({ params: { id: 'user2' } });

    service.removeFollower.mockResolvedValue({ id: 'user2' } as any);

    await controller.removeFollower(req as Request, res as Response);

    expect(service.removeFollower).toHaveBeenCalledWith('user1', 'user2');
    expect(res.json).toHaveBeenCalledWith({ id: 'user2' });
  });

  // =========================
  // block
  // =========================
  it('block - success', async () => {
    req.params = { id: 'user2' };
    mockValid({ params: { id: 'user2' } });

    service.block.mockResolvedValue({ id: 'user2' } as any);

    await controller.block(req as Request, res as Response);

    expect(service.block).toHaveBeenCalledWith('user1', 'user2');
    expect(res.json).toHaveBeenCalledWith({ id: 'user2' });
  });

  // =========================
  // unblock
  // =========================
  it('unblock - success', async () => {
    req.params = { id: 'user2' };
    mockValid({ params: { id: 'user2' } });

    service.unblock.mockResolvedValue({ id: 'user2' } as any);

    await controller.unblock(req as Request, res as Response);

    expect(service.unblock).toHaveBeenCalledWith('user1', 'user2');
    expect(res.json).toHaveBeenCalledWith({ id: 'user2' });
  });

  // =========================
  // getFollowers
  // =========================
  it('getFollowers - success with defaults', async () => {
    req.params = { id: 'user2' };
    req.query = {};
    mockValid({ params: { id: 'user2' }, query: {} });

    service.getFollowers.mockResolvedValue([{ id: 'u3' }] as any);

    await controller.getFollowers(req as Request, res as Response);

    expect(service.getFollowers).toHaveBeenCalledWith('user2', 'user1', 0, 20);

    expect(res.json).toHaveBeenCalledWith([{ id: 'u3' }]);
  });

  it('getFollowers - custom pagination', async () => {
    req.params = { id: 'user2' };
    mockValid({
      params: { id: 'user2' },
      query: { offset: 5, limit: 10 },
    });

    service.getFollowers.mockResolvedValue([] as any);

    await controller.getFollowers(req as Request, res as Response);

    expect(service.getFollowers).toHaveBeenCalledWith('user2', 'user1', 5, 10);
  });

  // =========================
  // getFollowed
  // =========================
  it('getFollowed - success', async () => {
    req.params = { id: 'user2' };
    mockValid({ params: { id: 'user2' }, query: {} });

    service.getFollowed.mockResolvedValue([{ id: 'u4' }] as any);

    await controller.getFollowed(req as Request, res as Response);

    expect(service.getFollowed).toHaveBeenCalledWith('user2', 'user1', 0, 20);

    expect(res.json).toHaveBeenCalledWith([{ id: 'u4' }]);
  });

  // =========================
  // getSuggestedUsers
  // =========================
  it('getSuggestedUsers - success', async () => {
    req.query = {};
    mockValid({ query: {} });

    service.getSuggestedUsers.mockResolvedValue([{ id: 'u5' }] as any);

    await controller.getSuggestedUsers(req as Request, res as Response);

    expect(service.getSuggestedUsers).toHaveBeenCalledWith('user1', 0, 20);

    expect(res.json).toHaveBeenCalledWith([{ id: 'u5' }]);
  });

  it('getSuggestedUsers - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.getSuggestedUsers(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  // =========================
  // getBlocked
  // =========================
  it('getBlocked - success', async () => {
    req.query = {};
    mockValid({ query: {} });

    service.getBlocked.mockResolvedValue([{ id: 'u6' }] as any);

    await controller.getBlocked(req as Request, res as Response);

    expect(service.getBlocked).toHaveBeenCalledWith('user1', 0, 20);

    expect(res.json).toHaveBeenCalledWith([{ id: 'u6' }]);
  });
});
