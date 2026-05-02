/**
 * tracks.service.test.ts
 * Unit tests for TracksService.
 *
 * All external dependencies (repository, mapper, uploaders, redis, sockets,
 * blob storage) are fully mocked — no real DB or network calls.
 */

import { TracksService } from '../../../src/modules/tracks/tracks.service';
import { TracksRepository } from '../../../src/modules/tracks/tracks.repository';
import { TracksMapper } from '../../../src/modules/tracks/dtos/tracks.mapper';
import { redisCacher } from '../../../src/shared/abstractions/redis/redisCacher';
import * as notificationHandler from '../../../src/sockets/handlers/notification.handler';
import { Types } from 'mongoose';

// ─── Auto-mock dependencies ───────────────────────────────────────────────────
jest.mock('../../../src/shared/abstractions/blob.service', () => ({
  __esModule: true,
  default: {
    uploadWaveform: jest.fn().mockResolvedValue('https://fake/waveform.json'),
    uploadTrack: jest.fn().mockResolvedValue('https://fake/track.mp3'),
    uploadImage: jest.fn().mockResolvedValue('https://fake/image.jpg'),
    deleteBlob: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../../../src/modules/tracks/tracks.repository');
jest.mock('../../../src/modules/tracks/dtos/tracks.mapper');
jest.mock('../../../src/shared/abstractions/redis/redisCacher');
jest.mock('../../../src/shared/abstractions/publitio.service');
jest.mock('../../../src/shared/abstractions/cloudinary.service');
jest.mock('../../../src/shared/abstractions/blob.service');
jest.mock('../../../src/sockets/handlers/notification.handler');
jest.mock('../../../src/shared/logger/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

// music-metadata is not installed — virtual factory mock bypasses the resolver
jest.mock(
  'music-metadata',
  () => ({
    parseBuffer: jest.fn().mockResolvedValue({ common: {}, format: {} }),
    parseFile: jest.fn().mockResolvedValue({ common: {}, format: {} }),
    parseStream: jest.fn().mockResolvedValue({ common: {}, format: {} }),
  }),
  { virtual: true },
);

// ─── Typed mock helpers ───────────────────────────────────────────────────────
const MockRepo = TracksRepository as jest.MockedClass<typeof TracksRepository>;
const MockMapper = TracksMapper as jest.Mocked<typeof TracksMapper>;
const mockRedis = redisCacher as jest.Mocked<typeof redisCacher>;
const mockGetNotificationHandler =
  notificationHandler.getNotificationSocketHandler as jest.Mock;

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const userId = new Types.ObjectId().toString();
const trackId = new Types.ObjectId().toString();
const posterId = userId;

function makeTrack(overrides: Record<string, unknown> = {}) {
  return {
    _id: new Types.ObjectId(trackId),
    posterId: new Types.ObjectId(posterId),
    durationInSeconds: 200,
    numOfPlays: 0,
    numOfDownloads: 0,
    likedBy: [],
    hidden: false,
    mobileProPreview: false,
    basicInfo: { permalink: 'my-track', title: 'My Track', isPrivate: false },
    geoBlocking: { mode: 'worldwide' },
    permissions: { enableDirectDownload: true },
    createdAt: new Date(),
    ...overrides,
  } as any;
}

// ─── Setup ────────────────────────────────────────────────────────────────────
let service: TracksService;
let repo: jest.Mocked<TracksRepository>;

beforeEach(() => {
  jest.clearAllMocks();

  service = new TracksService();
  repo = MockRepo.mock.instances[0] as jest.Mocked<TracksRepository>;

  // Default mapper stubs
  MockMapper.toTrackResponsePublic.mockReturnValue({ id: trackId } as any);
  MockMapper.toTrackResponsePrivate.mockReturnValue({
    id: trackId,
    isLiked: false,
  } as any);
  MockMapper.toTrackResponsePublicList.mockReturnValue([]);
  MockMapper.toTrackResponsePrivateList.mockReturnValue([]);
  MockMapper.toTrackResponsePrivateV2.mockReturnValue({ id: trackId } as any);
  MockMapper.toTrackResponsePrivateListV2.mockReturnValue([]);
  MockMapper.toTrackDetailedResponse.mockReturnValue({ id: trackId } as any);
  MockMapper.toTrackDetailedResponseV2.mockReturnValue({ id: trackId } as any);
  MockMapper.toTrackInput.mockReturnValue({} as any);
  MockMapper.toTrackInputV2.mockReturnValue({} as any);
  MockMapper.toTrackUpdateInput.mockReturnValue({
    id: trackId,
    trackInfo: {},
    advanced: {},
  } as any);

  // Default redis — nothing cached
  mockRedis.get.mockResolvedValue(null);
  mockRedis.set.mockResolvedValue(undefined);

  // Notification socket — not connected by default
  mockGetNotificationHandler.mockImplementation(() => {
    throw new Error('Socket not connected');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// deleteTrackById
// ═════════════════════════════════════════════════════════════════════════════
describe('deleteTrackById', () => {
  it('deletes the track and returns true for the owner', async () => {
    repo.findById.mockResolvedValue(makeTrack());
    repo.deleteById.mockResolvedValue(true);

    const result = await service.deleteTrackById(userId, trackId, 'Artist');

    expect(repo.findById).toHaveBeenCalledWith(trackId);
    expect(repo.deleteById).toHaveBeenCalledWith(trackId, userId);
    expect(result).toBe(true);
  });

  it('allows Admin to delete any track regardless of ownership', async () => {
    repo.findById.mockResolvedValue(
      makeTrack({ posterId: new Types.ObjectId() }),
    );
    repo.deleteById.mockResolvedValue(true);

    await expect(
      service.deleteTrackById(userId, trackId, 'Admin'),
    ).resolves.toBe(true);
  });

  it('throws when track does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      service.deleteTrackById(userId, trackId, 'Artist'),
    ).rejects.toThrow();
  });

  it('throws "Unauthorized Action" when a non-owner tries to delete', async () => {
    repo.findById.mockResolvedValue(
      makeTrack({ posterId: new Types.ObjectId() }),
    );

    await expect(
      service.deleteTrackById(userId, trackId, 'Artist'),
    ).rejects.toThrow('Unauthorized Action');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getTrackById
// ═════════════════════════════════════════════════════════════════════════════
describe('getTrackById', () => {
  it('returns public DTO when no requester (unauthenticated)', async () => {
    repo.findById.mockResolvedValue(makeTrack());

    const result = await service.getTrackById(trackId, null);

    expect(MockMapper.toTrackResponsePublic).toHaveBeenCalled();
    expect(result).toEqual({ id: trackId });
  });

  it('returns private DTO when requester is authenticated', async () => {
    repo.findById.mockResolvedValue(makeTrack());

    const result = await service.getTrackById(trackId, userId);

    expect(MockMapper.toTrackResponsePrivate).toHaveBeenCalledWith(
      expect.anything(),
      userId,
    );
    expect(result).toEqual({ id: trackId, isLiked: false });
  });

  it('throws when track is missing', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.getTrackById(trackId, null)).rejects.toThrow();
  });

  it('throws when a private track is accessed by a non-owner', async () => {
    repo.findById.mockResolvedValue(
      makeTrack({ basicInfo: { isPrivate: true, permalink: 'x', title: 'x' } }),
    );

    await expect(
      service.getTrackById(trackId, new Types.ObjectId().toString()),
    ).rejects.toThrow();
  });

  it('throws when a hidden/banned track is accessed', async () => {
    repo.findById.mockResolvedValue(makeTrack({ hidden: true }));

    await expect(service.getTrackById(trackId, null)).rejects.toThrow();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// incrementTrackNumPlays
// ═════════════════════════════════════════════════════════════════════════════
describe('incrementTrackNumPlays', () => {
  it('increments and returns true', async () => {
    repo.findById.mockResolvedValue(makeTrack());
    repo.incrementNumPlays.mockResolvedValue(true);

    await expect(service.incrementTrackNumPlays(trackId)).resolves.toBe(true);
  });

  it('throws when track is missing', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.incrementTrackNumPlays(trackId)).rejects.toThrow();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getLikedTracks
// ═════════════════════════════════════════════════════════════════════════════
describe('getLikedTracks', () => {
  it('returns an empty list when the user has no liked tracks', async () => {
    repo.getLikedTracks.mockResolvedValue([]);
    MockMapper.toTrackResponsePublicList.mockReturnValue([]);

    const result = await service.getLikedTracks(userId, null);
    expect(result).toEqual([]);
  });

  it('filters hidden tracks from public response', async () => {
    const visible = makeTrack();
    const hidden = makeTrack({ hidden: true });
    repo.getLikedTracks.mockResolvedValue([visible, hidden]);

    await service.getLikedTracks(userId, null);

    expect(MockMapper.toTrackResponsePublicList).toHaveBeenCalledWith([
      visible,
    ]);
  });

  it('filters private tracks owned by others from private response', async () => {
    const mine = makeTrack({ posterId: new Types.ObjectId(userId) });
    const theirPriv = makeTrack({
      posterId: new Types.ObjectId(),
      basicInfo: { isPrivate: true, permalink: 'x', title: 'x' },
    });
    repo.getLikedTracks.mockResolvedValue([mine, theirPriv]);

    await service.getLikedTracks(userId, userId);

    expect(MockMapper.toTrackResponsePrivateList).toHaveBeenCalledWith(
      [mine],
      userId,
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// addToUserHistory
// ═════════════════════════════════════════════════════════════════════════════
describe('addToUserHistory', () => {
  it('calls addToHistory and returns true', async () => {
    repo.findById.mockResolvedValue(makeTrack());
    repo.addToHistory.mockResolvedValue(undefined);

    const result = await service.addToUserHistory(userId, trackId);

    expect(repo.addToHistory).toHaveBeenCalledWith(userId, trackId);
    expect(result).toBe(true);
  });

  it('throws when track does not exist', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.addToUserHistory(userId, trackId)).rejects.toThrow();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getTrackDetailedInfo
// ═════════════════════════════════════════════════════════════════════════════
describe('getTrackDetailedInfo', () => {
  it('returns detailed track info for the owner', async () => {
    repo.findById.mockResolvedValue(makeTrack());
    repo.getTrackAdvancedInfo.mockResolvedValue({ bpm: 120 } as any);

    const result = await service.getTrackDetailedInfo(
      userId,
      trackId,
      'Artist',
    );

    expect(MockMapper.toTrackDetailedResponse).toHaveBeenCalled();
    expect(result).toEqual({ id: trackId });
  });

  it('throws when track is missing', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      service.getTrackDetailedInfo(userId, trackId, 'Artist'),
    ).rejects.toThrow();
  });

  it('throws "Unauthorized Action" when a non-owner tries to access', async () => {
    repo.findById.mockResolvedValue(
      makeTrack({ posterId: new Types.ObjectId() }),
    );

    await expect(
      service.getTrackDetailedInfo(userId, trackId, 'Artist'),
    ).rejects.toThrow('Unauthorized Action');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// isPermalinkFoundForUser
// ═════════════════════════════════════════════════════════════════════════════
describe('isPermalinkFoundForUser', () => {
  it('returns true when a track with that permalink exists', async () => {
    repo.trackExistsByPermalinkForUser.mockResolvedValue(makeTrack());

    await expect(
      service.isPermalinkFoundForUser('my-track', userId),
    ).resolves.toBe(true);
  });

  it('returns false when no track matches', async () => {
    repo.trackExistsByPermalinkForUser.mockResolvedValue(null);

    await expect(
      service.isPermalinkFoundForUser('missing', userId),
    ).resolves.toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getUserQuota
// ═════════════════════════════════════════════════════════════════════════════
describe('getUserQuota', () => {
  it('returns the number of uploads', async () => {
    repo.findUserById.mockResolvedValue({ uploads: ['a', 'b', 'c'] } as any);

    await expect(service.getUserQuota(userId)).resolves.toBe(3);
  });

  it('throws "User not found" when user does not exist', async () => {
    repo.findUserById.mockResolvedValue(null);

    await expect(service.getUserQuota(userId)).rejects.toThrow(
      'User not found',
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getPlaylistsContainingTrack
// ═════════════════════════════════════════════════════════════════════════════
describe('getPlaylistsContainingTrack', () => {
  it('returns null when repository returns null', async () => {
    repo.getPlaylistsContainingTrack.mockResolvedValue(null);

    await expect(
      service.getPlaylistsContainingTrack(trackId, null, 'album'),
    ).resolves.toBeNull();
  });

  it('filters private playlists for unauthenticated requests', async () => {
    const pub = { isPrivate: false, artistId: new Types.ObjectId() } as any;
    const priv = { isPrivate: true, artistId: new Types.ObjectId() } as any;
    repo.getPlaylistsContainingTrack.mockResolvedValue([pub, priv]);

    const result = await service.getPlaylistsContainingTrack(
      trackId,
      null,
      'album',
    );

    expect(result).toHaveLength(1);
    expect(result![0].isPrivate).toBe(false);
  });

  it('keeps private playlists belonging to the requester', async () => {
    const ownPrivate = {
      isPrivate: true,
      artistId: new Types.ObjectId(userId),
    } as any;
    const otherPriv = {
      isPrivate: true,
      artistId: new Types.ObjectId(),
    } as any;
    repo.getPlaylistsContainingTrack.mockResolvedValue([ownPrivate, otherPriv]);

    const result = await service.getPlaylistsContainingTrack(
      trackId,
      userId,
      'album',
    );

    expect(result).toHaveLength(1);
    expect(result![0].artistId.toString()).toBe(userId);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// updateTrackMobileProPreview
// ═════════════════════════════════════════════════════════════════════════════
describe('updateTrackMobileProPreview', () => {
  it('updates and returns true for owner', async () => {
    repo.findById.mockResolvedValue(makeTrack());
    repo.updateMobileProPreview.mockResolvedValue(true);

    await expect(
      service.updateTrackMobileProPreview(trackId, true, userId, 'Artist'),
    ).resolves.toBe(true);
  });

  it('throws "Track Not Found" when track is missing', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      service.updateTrackMobileProPreview(trackId, true, userId, 'Artist'),
    ).rejects.toThrow('Track Not Found');
  });

  it('throws "Unauthorized Action" for non-owner', async () => {
    repo.findById.mockResolvedValue(
      makeTrack({ posterId: new Types.ObjectId() }),
    );

    await expect(
      service.updateTrackMobileProPreview(trackId, true, userId, 'Artist'),
    ).rejects.toThrow('Unauthorized Action');
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getTrackStats
// ═════════════════════════════════════════════════════════════════════════════
describe('getTrackStats', () => {
  it('returns topFans and firstFans when artist allows it', async () => {
    repo.findById.mockResolvedValue(makeTrack());
    repo.getUserSettingsById.mockResolvedValue({
      privacy: { showTrackTopFans: true },
    } as any);
    repo.getTopFans.mockResolvedValue([
      { userId: { displayName: 'Fan1' } },
    ] as any);
    repo.getFirstFans.mockResolvedValue([
      { userId: { displayName: 'Fan2' } },
    ] as any);

    const result = await service.getTrackStats(trackId);

    expect(result).toHaveProperty('topFans');
    expect(result).toHaveProperty('firstFans');
    expect(result.topFans).toHaveLength(1);
  });

  it('throws "Track stats are private" when artist has stats set to private', async () => {
    repo.findById.mockResolvedValue(makeTrack());
    repo.getUserSettingsById.mockResolvedValue({
      privacy: { showTrackTopFans: false },
    } as any);

    await expect(service.getTrackStats(trackId)).rejects.toThrow(
      'Track stats are private',
    );
  });

  it('throws "Track Doesn\'t Exists" when track is missing', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(service.getTrackStats(trackId)).rejects.toThrow(
      "Track Doesn't Exists",
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// incrementDownloads
// ═════════════════════════════════════════════════════════════════════════════
describe('incrementDownloads', () => {
  it('increments when download is enabled and not a duplicate', async () => {
    repo.findById.mockResolvedValue(makeTrack());
    mockRedis.get.mockResolvedValue(null);
    repo.incrementDownloads.mockResolvedValue(undefined);

    await service.incrementDownloads(trackId, 'session-abc');

    expect(repo.incrementDownloads).toHaveBeenCalledWith(trackId);
    expect(mockRedis.set).toHaveBeenCalled();
  });

  it('silently returns on duplicate download session', async () => {
    repo.findById.mockResolvedValue(makeTrack());
    mockRedis.get.mockResolvedValue('1' as any);

    await service.incrementDownloads(trackId, 'session-dup');

    expect(repo.incrementDownloads).not.toHaveBeenCalled();
  });

  it('throws "Cant Be Downloaded Due to User Permissions" when direct download is disabled', async () => {
    repo.findById.mockResolvedValue(
      makeTrack({ permissions: { enableDirectDownload: false } }),
    );

    await expect(
      service.incrementDownloads(trackId, 'session-xyz'),
    ).rejects.toThrow('Cant Be Downloaded Due to User Permissions');
  });

  it('throws "Track Doesn\'t Exists" when track is missing', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      service.incrementDownloads(trackId, 'session-xyz'),
    ).rejects.toThrow("Track Doesn't Exists");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// incrementTrackNumPlaysV2
// ═════════════════════════════════════════════════════════════════════════════
describe('incrementTrackNumPlaysV2', () => {
  const listenedDuration = 100; // 50% of 200s — passes the 30% threshold
  const sessionId = 'session-001';

  it('records a valid play and calls all repository methods', async () => {
    repo.findById.mockResolvedValue(makeTrack());
    repo.incrementNumPlays.mockResolvedValue(true);
    repo.incrementInPlaysTable.mockResolvedValue(undefined);
    repo.addToTrackStats.mockResolvedValue(undefined);

    await service.incrementTrackNumPlaysV2(
      userId,
      trackId,
      listenedDuration,
      sessionId,
    );

    expect(repo.incrementNumPlays).toHaveBeenCalledWith(trackId);
    expect(repo.incrementInPlaysTable).toHaveBeenCalledWith(trackId);
    expect(repo.addToTrackStats).toHaveBeenCalled();
  });

  it('silently returns when still in cooldown', async () => {
    repo.findById.mockResolvedValue(makeTrack());
    mockRedis.get.mockResolvedValueOnce('1' as any);

    await service.incrementTrackNumPlaysV2(
      userId,
      trackId,
      listenedDuration,
      sessionId,
    );

    expect(repo.incrementNumPlays).not.toHaveBeenCalled();
  });

  it('silently returns on duplicate session key', async () => {
    repo.findById.mockResolvedValue(makeTrack());
    mockRedis.get
      .mockResolvedValueOnce(null) // cooldown — not set
      .mockResolvedValueOnce('1' as any); // dedup key — already set

    await service.incrementTrackNumPlaysV2(
      userId,
      trackId,
      listenedDuration,
      sessionId,
    );

    expect(repo.incrementNumPlays).not.toHaveBeenCalled();
  });

  it('throws when listenedDuration exceeds track duration', async () => {
    repo.findById.mockResolvedValue(makeTrack({ durationInSeconds: 60 }));

    await expect(
      service.incrementTrackNumPlaysV2(userId, trackId, 999, sessionId),
    ).rejects.toThrow(
      'Cant listen to a track longer than its supposed duration',
    );
  });

  it('throws when listenedDuration is below 30% of track duration', async () => {
    repo.findById.mockResolvedValue(makeTrack({ durationInSeconds: 200 }));

    await expect(
      service.incrementTrackNumPlaysV2(userId, trackId, 50, sessionId),
    ).rejects.toThrow("Listened Duration Doesn't excedd 30% of Played Track");
  });

  it('throws "Track Doesn\'t Exists" when track is missing', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      service.incrementTrackNumPlaysV2(
        userId,
        trackId,
        listenedDuration,
        sessionId,
      ),
    ).rejects.toThrow("Track Doesn't Exists");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getTrackByIdV2
// ═════════════════════════════════════════════════════════════════════════════
describe('getTrackByIdV2', () => {
  it('throws "Track is Restricted By Region" for geo-restricted track without auth', async () => {
    repo.findById.mockResolvedValue(
      makeTrack({ geoBlocking: { mode: 'whitelist' } }),
    );

    await expect(service.getTrackByIdV2(trackId, null)).rejects.toThrow(
      'Track is Restricted By Region',
    );
  });

  it('returns public DTO for worldwide geo-unrestricted unauthenticated access', async () => {
    repo.findById.mockResolvedValue(makeTrack());

    const result = await service.getTrackByIdV2(trackId, null);

    expect(MockMapper.toTrackResponsePublic).toHaveBeenCalled();
    expect(result).toEqual({ id: trackId });
  });

  it('returns private V2 DTO for authenticated request', async () => {
    repo.findById.mockResolvedValue(makeTrack());
    repo.findUserById.mockResolvedValue({
      country: 'EG',
      reposts: [{ type: 'track', id: new Types.ObjectId() }],
    } as any);

    const result = await service.getTrackByIdV2(trackId, userId);

    expect(MockMapper.toTrackResponsePrivateV2).toHaveBeenCalled();
    expect(result).toEqual({ id: trackId });
  });

  it('throws "This Track Is Banned Cannot Access It" for a hidden/banned track', async () => {
    repo.findById.mockResolvedValue(makeTrack({ hidden: true }));

    await expect(service.getTrackByIdV2(trackId, null)).rejects.toThrow(
      'This Track Is Banned Cannot Access It',
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getPaginatedList
// ═════════════════════════════════════════════════════════════════════════════
describe('getPaginatedList', () => {
  const paginationInfo = {
    totalNumTracks: 10,
    page: 1,
    totalPages: 2,
    hasNext: true,
  };

  it('returns public track list for unauthenticated requester', async () => {
    repo.getPaginatedList.mockResolvedValue({
      tracks: [makeTrack()],
      info: paginationInfo,
    });

    const result = await service.getPaginatedList(1, 5, null);

    expect(MockMapper.toTrackResponsePublicList).toHaveBeenCalled();
    expect(result.paginationInfo).toMatchObject(paginationInfo);
  });

  it('returns private list for authenticated requester', async () => {
    repo.getPaginatedList.mockResolvedValue({
      tracks: [makeTrack()],
      info: paginationInfo,
    });
    repo.findUserById.mockResolvedValue({ reposts: [], country: 'EG' } as any);

    const result = await service.getPaginatedList(1, 5, userId);

    expect(MockMapper.toTrackResponsePrivateList).toHaveBeenCalled();
    expect(result.paginationInfo).toMatchObject(paginationInfo);
  });

  it('excludes hidden and private tracks from public results', async () => {
    const visible = makeTrack();
    const hidden = makeTrack({ hidden: true });
    const priv = makeTrack({
      basicInfo: { isPrivate: true, permalink: 'x', title: 'x' },
    });
    repo.getPaginatedList.mockResolvedValue({
      tracks: [visible, hidden, priv],
      info: paginationInfo,
    });

    await service.getPaginatedList(1, 5, null);

    expect(MockMapper.toTrackResponsePublicList).toHaveBeenCalledWith([
      visible,
    ]);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getTrackByPermalink
// ═════════════════════════════════════════════════════════════════════════════
describe('getTrackByPermalink', () => {
  it('throws "Track Not Found" when track is missing', async () => {
    repo.getTrackByProfilePermalink.mockResolvedValue(null);

    await expect(
      service.getTrackByPermalink('slug', 'artist', null),
    ).rejects.toThrow('Track Not Found');
  });

  it('throws when a hidden/banned track is accessed', async () => {
    repo.getTrackByProfilePermalink.mockResolvedValue(
      makeTrack({ hidden: true }),
    );

    await expect(
      service.getTrackByPermalink('slug', 'artist', null),
    ).rejects.toThrow();
  });

  it('returns public DTO for unauthenticated request', async () => {
    repo.getTrackByProfilePermalink.mockResolvedValue(makeTrack());

    const result = await service.getTrackByPermalink('slug', 'artist', null);

    expect(MockMapper.toTrackResponsePublic).toHaveBeenCalled();
    expect(result).toEqual({ id: trackId });
  });

  it('returns private DTO for authenticated request', async () => {
    repo.getTrackByProfilePermalink.mockResolvedValue(makeTrack());

    const result = await service.getTrackByPermalink('slug', 'artist', userId);

    expect(MockMapper.toTrackResponsePrivate).toHaveBeenCalledWith(
      expect.anything(),
      userId,
    );
    expect(result).toEqual({ id: trackId, isLiked: false });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getUserPostedTracks
// ═════════════════════════════════════════════════════════════════════════════
describe('getUserPostedTracks', () => {
  it('returns filtered public list for unauthenticated request', async () => {
    const visible = makeTrack();
    const hidden = makeTrack({ hidden: true });
    repo.getPostedTracks.mockResolvedValue([visible, hidden]);

    await service.getUserPostedTracks(userId, null);

    expect(MockMapper.toTrackResponsePublicList).toHaveBeenCalledWith([
      visible,
    ]);
  });

  it('returns filtered private list for authenticated request', async () => {
    const mine = makeTrack({ posterId: new Types.ObjectId(userId) });
    repo.getPostedTracks.mockResolvedValue([mine]);
    repo.findUserById.mockResolvedValue({ reposts: [], country: 'EG' } as any);

    await service.getUserPostedTracks(userId, userId);

    expect(MockMapper.toTrackResponsePrivateList).toHaveBeenCalledWith(
      [mine],
      userId,
    );
  });
});
