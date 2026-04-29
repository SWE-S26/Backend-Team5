import { FeedRepository } from '../../../src/modules/feed/feed.repository';

import User from '../../../src/shared/models/models.user';
import Following from '../../../src/shared/models/models.following';
import Track from '../../../src/shared/models/models.track';
import Playlist from '../../../src/shared/models/models.playlist';
import Plays from '../../../src/shared/models/models.plays';
import SearchHistory from '../../../src/shared/models/models.search-history';

jest.mock('../../../src/shared/models/models.user');
jest.mock('../../../src/shared/models/models.following');
jest.mock('../../../src/shared/models/models.track');
jest.mock('../../../src/shared/models/models.playlist');
jest.mock('../../../src/shared/models/models.plays');
jest.mock('../../../src/shared/models/models.search-history');

describe('FeedRepository - FULL TEST', () => {
  let repo: FeedRepository;

  beforeEach(() => {
    repo = new FeedRepository();
    jest.clearAllMocks();
  });

  // =========================
  // getUserById
  // =========================
  it('getUserById - success', async () => {
    (User.findById as any).mockReturnValue({
      lean: () => ({ _id: 'u1' }),
    });

    const result = await repo.getUserById('u1');

    expect(User.findById).toHaveBeenCalledWith('u1');
    expect(result).toEqual({ _id: 'u1' });
  });

  // =========================
  // getUsersIds
  // =========================
  it('getUsersIds - returns followed list', async () => {
    (Following.findOne as any).mockReturnValue({
      lean: () => ({ followed: ['a', 'b'] }),
    });

    const result = await repo.getUsersIds('u1');

    expect(result).toEqual(['a', 'b']);
  });

  it('getUsersIds - empty fallback', async () => {
    (Following.findOne as any).mockReturnValue({
      lean: () => null,
    });

    const result = await repo.getUsersIds('u1');

    expect(result).toEqual([]);
  });

  // =========================
  // getPostsFeed
  // =========================
  it('getPostsFeed - merges tracks + playlists', async () => {
    (Track.find as any).mockReturnValue({
      sort: () => ({
        limit: () => ({
          lean: () => [
            {
              _id: 't1',
              createdAt: new Date('2024-01-01'),
              posterId: 'u1',
            },
          ],
        }),
      }),
    });

    (Playlist.find as any).mockReturnValue({
      sort: () => ({
        limit: () => ({
          lean: () => [
            {
              _id: 'p1',
              createdAt: new Date('2024-01-02'),
              artistId: 'u2',
            },
          ],
        }),
      }),
    });

    const result = await repo.getPostsFeed(['u1', 'u2'], 10);

    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('type');
  });

  // =========================
  // getRepostsFeed
  // =========================
  it('getRepostsFeed - aggregate works', async () => {
    (User.aggregate as any).mockResolvedValue([
      {
        id: 'r1',
        type: 'track',
        isRepost: true,
        createdAt: new Date(),
        actorId: 'u1',
      },
    ]);

    const result = await repo.getRepostsFeed(['507f1f77bcf86cd799439011'], 10);

    expect(result.length).toBe(1);
    expect(result[0].isRepost).toBe(true);
  });

  // =========================
  // getActorsInfo
  // =========================
  it('getActorsInfo - maps users', async () => {
    (User.find as any).mockReturnValue({
      lean: () => [
        {
          _id: 'u1',
          displayName: 'Ahmed',
          profileImg: { imgLink: 'img.jpg' },
        },
      ],
    });

    const result = await repo.getActorsInfo(['u1']);

    expect(result).toEqual([
      {
        actorId: 'u1',
        displayName: 'Ahmed',
        imgLink: 'img.jpg',
      },
    ]);
  });

  // =========================
  // getTrendingByStats
  // =========================
  it('getTrendingByStats', async () => {
    (Track.find as any).mockReturnValue({
      sort: () => ({
        limit: () => ({
          lean: () => [{ _id: 't1' }, { _id: 't2' }],
        }),
      }),
    });

    const result = await repo.getTrendingByStats(10);

    expect(result).toEqual(['t1', 't2']);
  });

  // =========================
  // getTrendingByRecentPlays
  // =========================
  it('getTrendingByRecentPlays', async () => {
    (Plays.aggregate as any).mockResolvedValue([{ _id: 't1' }, { _id: 't2' }]);

    const result = await repo.getTrendingByRecentPlays(10);

    expect(result).toEqual(['t1', 't2']);
  });

  // =========================
  // getSearchHistory (basic safe test)
  // =========================
  it('getSearchHistory - empty history returns []', async () => {
    (SearchHistory.findOne as any).mockReturnValue({
      lean: () => null,
    });

    const result = await repo.getSearchHistory('u1');

    expect(result).toEqual([]);
  });

  // =========================
  // addToSearchHistory
  // =========================
  it('addToSearchHistory - creates new history', async () => {
    (SearchHistory.findOne as any).mockResolvedValue(null);
    (SearchHistory.create as any).mockResolvedValue({});

    await repo.addToSearchHistory('u1', {
      id: 't1',
      type: 'track',
    });

    expect(SearchHistory.create).toHaveBeenCalled();
  });

  // =========================
  // deleteSearchHistoryItem
  // =========================
  it('deleteSearchHistoryItem - returns boolean', async () => {
    (SearchHistory.updateOne as any).mockResolvedValue({
      modifiedCount: 1,
    });

    const result = await repo.deleteSearchHistoryItem(
      '507f1f77bcf86cd799439012',
      '507f1f77bcf86cd799439013',
    );

    expect(result).toBe(true);
  });
});
