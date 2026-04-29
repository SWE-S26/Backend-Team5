import { FeedController } from '../../../src/modules/feed/feed.controller';
import { FeedService } from '../../../src/modules/feed/feed.service';
import { Request, Response } from 'express';
import { parseRequest } from '../../../src/shared/dtos/requestParser';

jest.mock('../../../src/shared/dtos/requestParser');

describe('FeedController - FULL TEST', () => {
  let controller: FeedController;
  let service: jest.Mocked<FeedService>;

  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    service = {
      getFeed: jest.fn(),
      getTrendingTracks: jest.fn(),
      getSearchSuggestions: jest.fn(),
      applyGlobalSearch: jest.fn(),
      getSearchHistory: jest.fn(),
      addToSearchHistory: jest.fn(),
      deleteSearchHistoryItem: jest.fn(),
    } as any;

    controller = new FeedController(service);

    req = {
      userInfo: { _id: 'u1' } as any,
      params: {},
      query: {},
      body: {},
    } as unknown as Request;

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    jest.clearAllMocks();
  });

  // =========================
  // getFeed
  // =========================

  it('getFeed - success', async () => {
    (parseRequest as jest.Mock).mockReturnValue({
      success: true,
      data: { query: { offset: 0, limit: 10, includeReposts: true } },
    });

    service.getFeed.mockResolvedValue([{ id: 't1' }] as any);

    await controller.getFeed(req as Request, res as Response);

    expect(service.getFeed).toHaveBeenCalledWith('u1', true, 0, 10);
    expect(res.json).toHaveBeenCalledWith([{ id: 't1' }]);
  });

  it('getFeed - invalid request throws', async () => {
    (parseRequest as jest.Mock).mockReturnValue({
      success: false,
      error: new Error('Invalid'),
    });

    await expect(
      controller.getFeed(req as Request, res as Response),
    ).rejects.toThrow('Invalid');
  });

  // =========================
  // getTrendingTracks
  // =========================

  it('getTrendingTracks - success', async () => {
    (parseRequest as jest.Mock).mockReturnValue({
      success: true,
      data: {
        params: { id: 'u1' },
        query: { offset: 0, limit: 10 },
      },
    });

    service.getTrendingTracks.mockResolvedValue([{ id: 't1' }] as any);

    await controller.getTrendingTracks(req as Request, res as Response);

    expect(service.getTrendingTracks).toHaveBeenCalledWith('u1', 0, 10);
    expect(res.json).toHaveBeenCalledWith([{ id: 't1' }]);
  });

  // =========================
  // getSearchSuggestions
  // =========================

  it('getSearchSuggestions - success', async () => {
    (parseRequest as jest.Mock).mockReturnValue({
      success: true,
      data: { query: { q: 'rock' } },
    });

    service.getSearchSuggestions.mockResolvedValue([
      { id: 't1', title: 'rock', isPersonalized: false },
    ] as any);

    await controller.getSearchSuggestions(req as Request, res as Response);

    expect(service.getSearchSuggestions).toHaveBeenCalledWith('u1', 'rock');
    expect(res.json).toHaveBeenCalled();
  });

  // =========================
  // applyGlobalSearch
  // =========================

  it('applyGlobalSearch - success', async () => {
    (parseRequest as jest.Mock).mockReturnValue({
      success: true,
      data: {
        query: { q: 'test', type: 'everything' },
      },
    });

    service.applyGlobalSearch.mockResolvedValue({
      results: [],
      counts: { tracks: 0, users: 0, playlists: 0, albums: 0 },
    } as any);

    await controller.applyGlobalSearch(req as Request, res as Response);

    expect(service.applyGlobalSearch).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  // =========================
  // getSearchHistory
  // =========================

  it('getSearchHistory - success', async () => {
    service.getSearchHistory.mockResolvedValue([{ id: 'h1' }] as any);

    await controller.getSearchHistory(req as Request, res as Response);

    expect(service.getSearchHistory).toHaveBeenCalledWith('u1');
    expect(res.json).toHaveBeenCalledWith([{ id: 'h1' }]);
  });

  // =========================
  // addToSearchHistory
  // =========================

  it('addToSearchHistory - success', async () => {
    (parseRequest as jest.Mock).mockReturnValue({
      success: true,
      data: {
        body: { id: 't1', type: 'track' },
      },
    });

    service.addToSearchHistory.mockResolvedValue(undefined);

    await controller.addToSearchHistory(req as Request, res as Response);

    expect(service.addToSearchHistory).toHaveBeenCalledWith('u1', {
      id: 't1',
      type: 'track',
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Added to history',
    });
  });

  it('addToSearchHistory - invalid request throws', async () => {
    (parseRequest as jest.Mock).mockReturnValue({
      success: false,
      error: new Error('Invalid body'),
    });

    await expect(
      controller.addToSearchHistory(req as Request, res as Response),
    ).rejects.toThrow('Invalid body');
  });

  // =========================
  // deleteSearchHistoryItem
  // =========================

  it('deleteSearchHistoryItem - success', async () => {
    (parseRequest as jest.Mock).mockReturnValue({
      success: true,
      data: {
        params: { historyId: 'h1' },
      },
    });

    service.deleteSearchHistoryItem.mockResolvedValue(undefined);

    await controller.deleteSearchHistoryItem(req as Request, res as Response);

    expect(service.deleteSearchHistoryItem).toHaveBeenCalledWith('u1', 'h1');

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalled();
  });

  it('deleteSearchHistoryItem - invalid request throws', async () => {
    (parseRequest as jest.Mock).mockReturnValue({
      success: false,
      error: new Error('Invalid params'),
    });

    await expect(
      controller.deleteSearchHistoryItem(req as Request, res as Response),
    ).rejects.toThrow('Invalid params');
  });
});
