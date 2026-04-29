import { FeedService } from '../../../src/modules/feed/feed.service';
import { FeedRepository } from '../../../src/modules/feed/feed.repository';

import { NotFoundError } from '../../../src/shared/errors/responseErrors';

jest.mock('../../../src/modules/feed/feed.repository');

describe('FeedService - FULL TEST', () => {
  let service: FeedService;
  let repository: jest.Mocked<FeedRepository>;

  beforeEach(() => {
    repository = new FeedRepository() as any;
    service = new FeedService(repository);
    jest.clearAllMocks();
  });

  // =========================
  // getFeed
  // =========================

  it('getFeed - throws if user not found', async () => {
    repository.getUserById.mockResolvedValue(null);

    await expect(service.getFeed('u1', true, 0, 10)).rejects.toThrow(
      'User not found',
    );
  });

  // =========================
  // getSearchHistory
  // =========================

  it('getSearchHistory - returns history', async () => {
    repository.getUserById.mockResolvedValue({ _id: 'u1' } as any);
    repository.getSearchHistory.mockResolvedValue([
      { id: 't1', type: 'track' } as any,
    ]);

    const result = await service.getSearchHistory('u1');

    expect(result).toHaveLength(1);
    expect(repository.getSearchHistory).toHaveBeenCalledWith('u1');
  });

  it('getSearchHistory - throws if user not found', async () => {
    repository.getUserById.mockResolvedValue(null);

    await expect(service.getSearchHistory('u1')).rejects.toThrow(
      'User not found',
    );
  });

  // =========================
  // addToSearchHistory
  // =========================

  it('addToSearchHistory - works correctly', async () => {
    repository.getUserById.mockResolvedValue({ _id: 'u1' } as any);
    repository.addToSearchHistory.mockResolvedValue(undefined);

    await service.addToSearchHistory('u1', {
      id: 't1',
      type: 'track',
    });

    expect(repository.addToSearchHistory).toHaveBeenCalled();
  });

  it('addToSearchHistory - throws if user not found', async () => {
    repository.getUserById.mockResolvedValue(null);

    await expect(
      service.addToSearchHistory('u1', {
        id: 't1',
        type: 'track',
      }),
    ).rejects.toThrow('User not found');
  });

  // =========================
  // deleteSearchHistoryItem
  // =========================

  it('deleteSearchHistoryItem - deletes successfully', async () => {
    repository.getUserById.mockResolvedValue({ _id: 'u1' } as any);
    repository.deleteSearchHistoryItem.mockResolvedValue(true);

    await expect(
      service.deleteSearchHistoryItem('u1', 'h1'),
    ).resolves.toBeUndefined();

    expect(repository.deleteSearchHistoryItem).toHaveBeenCalledWith('u1', 'h1');
  });

  it('deleteSearchHistoryItem - throws if user not found', async () => {
    repository.getUserById.mockResolvedValue(null);

    await expect(service.deleteSearchHistoryItem('u1', 'h1')).rejects.toThrow(
      'User not found',
    );
  });

  it('deleteSearchHistoryItem - throws if history not found', async () => {
    repository.getUserById.mockResolvedValue({ _id: 'u1' } as any);
    repository.deleteSearchHistoryItem.mockResolvedValue(false);

    await expect(service.deleteSearchHistoryItem('u1', 'h1')).rejects.toThrow(
      'History item not found',
    );
  });

  // =========================
  // getSearchSuggestions (basic safety test)
  // =========================

  it('getSearchSuggestions - guest mode works', async () => {
    repository.getGlobalSearchSuggestions.mockResolvedValue([
      { id: 't1', title: 'track', isPersonalized: false } as any,
    ]);

    const result = await service.getSearchSuggestions(null, 'a');

    expect(result.length).toBeGreaterThan(0);
  });

  it('getSearchSuggestions - invalid user throws', async () => {
    repository.getUserById.mockResolvedValue(null);

    await expect(service.getSearchSuggestions('u1', 'a')).rejects.toThrow(
      'User not found',
    );
  });
});
