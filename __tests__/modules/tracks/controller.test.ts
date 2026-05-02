/**
 * tracks.repository.test.ts
 *
 * Unit tests for TracksRepository.
 * All Mongoose models are fully mocked — no real DB or network calls.
 *
 * Place this file at:  __tests__/modules/tracks/tracks.repository.test.ts
 * Adjust the import path below to reach your actual source file.
 */

import { Types } from 'mongoose';
import { TracksRepository } from '../../../src/modules/tracks/tracks.repository';
import blobStorageService from '../../../src/shared/abstractions/blob.service';

jest.mock('../../../src/shared/abstractions/blob.service', () => ({
  __esModule: true,
  default: {
    uploadWaveform: jest.fn().mockResolvedValue('https://fake/waveform.json'),
    uploadTrack: jest.fn().mockResolvedValue('https://fake/track.mp3'),
    uploadImage: jest.fn().mockResolvedValue('https://fake/image.jpg'),
    deleteBlob: jest.fn().mockResolvedValue(undefined),
  },
}));

// ─── Mock all Mongoose models ─────────────────────────────────────────────────
jest.mock('../../../src/shared/models/models.track');
jest.mock('../../../src/shared/models/models.history');
jest.mock('../../../src/shared/models/models.user');
jest.mock('../../../src/shared/models/models.playlist');
jest.mock('../../../src/shared/models/models.plays');
jest.mock('../../../src/shared/models/models.following');
jest.mock('../../../src/shared/models/models.plays-track-handling');
jest.mock('../../../src/shared/models/models.settings');
jest.mock('../../../src/shared/models/models.advanced-audio-details');
jest.mock('../../../src/shared/errors/responseErrors', () => ({
  NotFoundError: (msg: string) =>
    Object.assign(new Error(msg), { statusCode: 404 }),
}));

import Track from '../../../src/shared/models/models.track';
import History from '../../../src/shared/models/models.history';
import User from '../../../src/shared/models/models.user';
import Playlist from '../../../src/shared/models/models.playlist';
import Plays from '../../../src/shared/models/models.plays';
import Following from '../../../src/shared/models/models.following';
import PlaysTrackHandling from '../../../src/shared/models/models.plays-track-handling';
import Settings from '../../../src/shared/models/models.settings';
import AdvancedAudioDetails from '../../../src/shared/models/models.advanced-audio-details';
import { JSONSchemaGenerator } from 'zod/v4/core';

// ─── Typed model mocks ────────────────────────────────────────────────────────
const MockTrack = Track as jest.Mocked<typeof Track>;
const MockUser = User as jest.Mocked<typeof User>;
const MockHistory = History as jest.Mocked<typeof History>;
const MockPlaylist = Playlist as jest.Mocked<typeof Playlist>;
const MockPlays = Plays as jest.Mocked<typeof Plays>;
const MockFollowing = Following as jest.Mocked<typeof Following>;
const MockPlaysTrackHandling = PlaysTrackHandling as jest.Mocked<
  typeof PlaysTrackHandling
>;
const MockSettings = Settings as jest.Mocked<typeof Settings>;
const MockAdvancedAudioDetails = AdvancedAudioDetails as jest.Mocked<
  typeof AdvancedAudioDetails
>;

// ─── Chainable query builder helper ──────────────────────────────────────────
/**
 * Returns a mock that supports Mongoose's fluent API:
 * .find().sort().limit().populate().lean()
 */
function makeChain(resolvedValue: unknown) {
  const chain: Record<string, jest.Mock> = {};
  ['sort', 'limit', 'populate', 'lean', 'skip'].forEach((method) => {
    chain[method] = jest.fn().mockReturnValue(chain);
  });
  // Terminal: lean() resolves the value
  chain['lean'] = jest.fn().mockResolvedValue(resolvedValue);
  // Also allow awaiting the chain directly (e.g. Track.find() without .lean())
  (chain as any)[Symbol.iterator] = undefined;
  (chain as any).then = (resolve: (v: unknown) => void) =>
    resolve(resolvedValue);
  return chain;
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const userId = new Types.ObjectId().toString();
const trackId = new Types.ObjectId().toString();

function makeTrack(overrides: Record<string, unknown> = {}) {
  return {
    _id: new Types.ObjectId(trackId),
    posterId: new Types.ObjectId(userId),
    durationInSeconds: 200,
    numOfPlays: 0,
    numOfDownloads: 0,
    likedBy: [],
    hidden: false,
    mobileProPreview: false,
    basicInfo: { permalink: 'my-track', title: 'My Track', isPrivate: false },
    createdAt: new Date(),
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as any;
}

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: new Types.ObjectId(userId),
    likedTracks: [],
    uploads: [],
    reposts: [],
    ...overrides,
  } as any;
}

// ─── Setup ────────────────────────────────────────────────────────────────────
let repo: TracksRepository;

beforeEach(() => {
  jest.clearAllMocks();
  repo = new TracksRepository();
});

// ═════════════════════════════════════════════════════════════════════════════
// findById
// ═════════════════════════════════════════════════════════════════════════════
describe('findById', () => {
  it('returns the track when found', async () => {
    const track = makeTrack();
    MockTrack.findById.mockResolvedValue(track);

    const result = await repo.findById(trackId);

    expect(MockTrack.findById).toHaveBeenCalledWith(trackId);
    expect(result).toBe(track);
  });

  it('returns null when track does not exist', async () => {
    MockTrack.findById.mockResolvedValue(null);

    const result = await repo.findById(trackId);

    expect(result).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// deleteById
// ═════════════════════════════════════════════════════════════════════════════
describe('deleteById', () => {
  it('calls findOneAndDelete and returns true', async () => {
    MockTrack.findOneAndDelete.mockResolvedValue(makeTrack());

    const result = await repo.deleteById(trackId, userId);

    expect(MockTrack.findOneAndDelete).toHaveBeenCalledWith({ _id: trackId });
    expect(result).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// incrementNumPlays
// ═════════════════════════════════════════════════════════════════════════════
describe('incrementNumPlays', () => {
  it('returns true when track is found and updated', async () => {
    MockTrack.findByIdAndUpdate.mockResolvedValue(makeTrack());

    const result = await repo.incrementNumPlays(trackId);

    expect(MockTrack.findByIdAndUpdate).toHaveBeenCalledWith(trackId, {
      $inc: { numOfPlays: 1 },
    });
    expect(result).toBe(true);
  });

  it('returns false when track is not found', async () => {
    MockTrack.findByIdAndUpdate.mockResolvedValue(null);

    const result = await repo.incrementNumPlays(trackId);

    expect(result).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getLikedTracks
// ═════════════════════════════════════════════════════════════════════════════
describe('getLikedTracks', () => {
  it('returns resolved tracks for a user with liked tracks', async () => {
    const likedId = new Types.ObjectId();
    const track = makeTrack({ _id: likedId });
    MockUser.findById.mockResolvedValue(makeUser({ likedTracks: [likedId] }));
    MockTrack.findById.mockResolvedValue(track);

    const result = await repo.getLikedTracks(userId);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(track);
  });

  it('returns an empty array when user has no liked tracks', async () => {
    MockUser.findById.mockResolvedValue(makeUser({ likedTracks: [] }));

    const result = await repo.getLikedTracks(userId);

    expect(result).toEqual([]);
  });

  it('throws when user is not found', async () => {
    MockUser.findById.mockResolvedValue(null);

    await expect(repo.getLikedTracks(userId)).rejects.toThrow(
      'Internal Server Error',
    );
  });

  it('filters out null results (tracks that were deleted)', async () => {
    const likedId1 = new Types.ObjectId();
    const likedId2 = new Types.ObjectId();
    MockUser.findById.mockResolvedValue(
      makeUser({ likedTracks: [likedId1, likedId2] }),
    );
    MockTrack.findById
      .mockResolvedValueOnce(makeTrack())
      .mockResolvedValueOnce(null); // second track is gone

    const result = await repo.getLikedTracks(userId);

    expect(result).toHaveLength(1);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// createNewTrack
// ═════════════════════════════════════════════════════════════════════════════
describe('createNewTrack', () => {
  it('creates a track, advanced details, updates user uploads and returns track id', async () => {
    const newTrackId = new Types.ObjectId();
    MockTrack.create.mockResolvedValue({ _id: newTrackId } as any);
    MockAdvancedAudioDetails.create.mockResolvedValue({} as any);
    MockUser.findOneAndUpdate.mockResolvedValue({} as any);

    const trackInput = {
      trackInfo: { posterId: userId, title: 'New Track' },
      advanced: { bpm: 120 },
    } as any;

    const result = await repo.createNewTrack(trackInput, newTrackId);

    expect(MockTrack.create).toHaveBeenCalledWith(
      expect.objectContaining({ _id: newTrackId }),
    );
    expect(MockAdvancedAudioDetails.create).toHaveBeenCalledWith(
      expect.objectContaining({ trackId: newTrackId }),
    );
    expect(MockUser.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: userId },
      { $push: { uploads: [newTrackId] } },
    );
    expect(result).toBe(newTrackId.toString());
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getTrackByProfilePermalink
// ═════════════════════════════════════════════════════════════════════════════
describe('getTrackByProfilePermalink', () => {
  it('returns null when user profile does not exist', async () => {
    MockUser.findOne.mockResolvedValue(null);

    const result = await repo.getTrackByProfilePermalink('my-track', 'ghost');

    expect(result).toBeNull();
    expect(MockTrack.findOne).not.toHaveBeenCalled();
  });

  it('queries track by permalink and poster when user is found', async () => {
    const user = makeUser();
    const track = makeTrack();
    MockUser.findOne.mockResolvedValue(user);
    MockTrack.findOne.mockResolvedValue(track);

    const result = await repo.getTrackByProfilePermalink(
      'my-track',
      'artist-link',
    );

    expect(MockTrack.findOne).toHaveBeenCalledWith({
      'basicInfo.permalink': 'my-track',
      posterId: user._id,
    });
    expect(result).toBe(track);
  });

  it('returns null when no track matches the permalink', async () => {
    MockUser.findOne.mockResolvedValue(makeUser());
    MockTrack.findOne.mockResolvedValue(null);

    const result = await repo.getTrackByProfilePermalink(
      'no-track',
      'artist-link',
    );

    expect(result).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getPaginatedList
// ═════════════════════════════════════════════════════════════════════════════
describe('getPaginatedList', () => {
  it('returns tracks and correct pagination info', async () => {
    const tracks = [makeTrack(), makeTrack()];
    const skipChain = { limit: jest.fn().mockResolvedValue(tracks) };
    const findChain = { skip: jest.fn().mockReturnValue(skipChain) };
    MockTrack.find.mockReturnValue(findChain as any);
    MockTrack.countDocuments.mockResolvedValue(10);

    const result = await repo.getPaginatedList(2, 5);

    expect(findChain.skip).toHaveBeenCalledWith(5); // (2-1)*5
    expect(skipChain.limit).toHaveBeenCalledWith(5);
    expect(result.tracks).toBe(tracks);
    expect(result.info).toMatchObject({
      totalNumTracks: 10,
      page: 2,
      totalPages: 2,
      hasNext: false,
    });
  });

  it('sets hasNext to true when more pages remain', async () => {
    const findChain = {
      skip: jest
        .fn()
        .mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
    };
    MockTrack.find.mockReturnValue(findChain as any);
    MockTrack.countDocuments.mockResolvedValue(20);

    const result = await repo.getPaginatedList(1, 5);

    expect(result.info.hasNext).toBe(true);
    expect(result.info.totalPages).toBe(4);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// updateMobileProPreview
// ═════════════════════════════════════════════════════════════════════════════
describe('updateMobileProPreview', () => {
  it('updates the flag and returns true when value changes', async () => {
    MockTrack.findById.mockResolvedValue(
      makeTrack({ mobileProPreview: false }),
    );
    MockTrack.updateOne.mockResolvedValue({} as any);

    const result = await repo.updateMobileProPreview(trackId, true);

    expect(MockTrack.updateOne).toHaveBeenCalledWith(
      { _id: trackId },
      { $set: { mobileProPreview: true } },
    );
    expect(result).toBe(true);
  });

  it('returns false when the new value matches the current value', async () => {
    MockTrack.findById.mockResolvedValue(makeTrack({ mobileProPreview: true }));

    const result = await repo.updateMobileProPreview(trackId, true);

    expect(MockTrack.updateOne).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  it('throws when track is not found', async () => {
    MockTrack.findById.mockResolvedValue(null);

    await expect(repo.updateMobileProPreview(trackId, true)).rejects.toThrow(
      'Track not found',
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getPostedTracks
// ═════════════════════════════════════════════════════════════════════════════
describe('getPostedTracks', () => {
  it('returns all tracks posted by a user', async () => {
    const tracks = [makeTrack(), makeTrack()];
    MockUser.findById.mockResolvedValue(makeUser());
    MockTrack.find.mockResolvedValue(tracks);

    const result = await repo.getPostedTracks(userId);

    expect(MockTrack.find).toHaveBeenCalledWith({ posterId: userId });
    expect(result).toBe(tracks);
  });

  it('throws NotFoundError when user does not exist', async () => {
    MockUser.findById.mockResolvedValue(null);

    await expect(repo.getPostedTracks(userId)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// addToHistory
// ═════════════════════════════════════════════════════════════════════════════
describe('addToHistory', () => {
  it('creates a new history document when none exists', async () => {
    MockHistory.findOne.mockResolvedValue(null);
    MockHistory.create.mockResolvedValue({} as any);

    await repo.addToHistory(userId, trackId);

    expect(MockHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId }),
    );
  });

  it('appends to existing history and saves', async () => {
    const historyDoc = {
      historyTracks: [],
      save: jest.fn().mockResolvedValue(undefined),
    };
    MockHistory.findOne.mockResolvedValue(historyDoc as any);

    await repo.addToHistory(userId, trackId);

    expect(historyDoc.historyTracks).toHaveLength(1);
    expect(historyDoc.save).toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getTrackAdvancedInfo
// ═════════════════════════════════════════════════════════════════════════════
describe('getTrackAdvancedInfo', () => {
  it('returns advanced details for the track', async () => {
    const advancedInfo = { bpm: 140, trackId };
    MockAdvancedAudioDetails.findOne.mockResolvedValue(advancedInfo as any);

    const result = await repo.getTrackAdvancedInfo(trackId);

    expect(MockAdvancedAudioDetails.findOne).toHaveBeenCalledWith({ trackId });
    expect(result).toBe(advancedInfo);
  });

  it('returns null when no advanced info exists', async () => {
    MockAdvancedAudioDetails.findOne.mockResolvedValue(null);

    const result = await repo.getTrackAdvancedInfo(trackId);

    expect(result).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// findUserById
// ═════════════════════════════════════════════════════════════════════════════
describe('findUserById', () => {
  it('returns the user when found', async () => {
    const user = makeUser();
    MockUser.findOne.mockResolvedValue(user);

    const result = await repo.findUserById(userId);

    expect(MockUser.findOne).toHaveBeenCalledWith({ _id: userId });
    expect(result).toBe(user);
  });

  it('returns null when user does not exist', async () => {
    MockUser.findOne.mockResolvedValue(null);

    const result = await repo.findUserById(userId);

    expect(result).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// trackExistsByPermalinkForUser
// ═════════════════════════════════════════════════════════════════════════════
describe('trackExistsByPermalinkForUser', () => {
  it('returns the track when it exists for that user', async () => {
    const track = makeTrack();
    MockTrack.findOne.mockResolvedValue(track);

    const result = await repo.trackExistsByPermalinkForUser('my-track', userId);

    expect(MockTrack.findOne).toHaveBeenCalledWith({
      'basicInfo.permalink': 'my-track',
      posterId: userId,
    });
    expect(result).toBe(track);
  });

  it('returns null when no match is found', async () => {
    MockTrack.findOne.mockResolvedValue(null);

    const result = await repo.trackExistsByPermalinkForUser('missing', userId);

    expect(result).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getPlaylistsContainingTrack
// ═════════════════════════════════════════════════════════════════════════════
describe('getPlaylistsContainingTrack', () => {
  it('returns playlists containing the track', async () => {
    const playlists = [{ _id: new Types.ObjectId(), isPrivate: false }];
    const chain = makeChain(playlists);
    MockPlaylist.find.mockReturnValue(chain as any);

    const result = await repo.getPlaylistsContainingTrack(trackId, 'album');

    expect(MockPlaylist.find).toHaveBeenCalledWith({
      listOfTracks: trackId,
      playlistType: 'album',
    });
    expect(result).toBe(playlists);
  });

  it('returns null when no playlists contain the track', async () => {
    const chain = makeChain(null);
    MockPlaylist.find.mockReturnValue(chain as any);

    const result = await repo.getPlaylistsContainingTrack(trackId, 'album');

    expect(result).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// incrementInPlaysTable
// ═════════════════════════════════════════════════════════════════════════════
describe('incrementInPlaysTable', () => {
  it('upserts a play record for today', async () => {
    MockPlays.findOneAndUpdate.mockResolvedValue({} as any);
    const todayDate = new Date().toISOString().split('T')[0];

    await repo.incrementInPlaysTable(trackId);

    expect(MockPlays.findOneAndUpdate).toHaveBeenCalledWith(
      { trackId, date: todayDate },
      { $inc: { numberOfPlay: 1 } },
      { upsert: true },
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getTopFans
// ═════════════════════════════════════════════════════════════════════════════
describe('getTopFans', () => {
  it('returns top fans sorted by play count', async () => {
    const fans = [{ userId: { displayName: 'Fan1' } }];
    const chain = makeChain(fans);
    MockPlaysTrackHandling.find.mockReturnValue(chain as any);

    const result = await repo.getTopFans(trackId);

    expect(MockPlaysTrackHandling.find).toHaveBeenCalledWith({
      trackId,
      isFanOfArtist: true,
      canAppear: true,
    });
    expect(result).toBe(fans);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getFirstFans
// ═════════════════════════════════════════════════════════════════════════════
describe('getFirstFans', () => {
  it('returns fans sorted by first-week play count', async () => {
    const fans = [{ userId: { displayName: 'EarlyFan' } }];
    const chain = makeChain(fans);
    MockPlaysTrackHandling.find.mockReturnValue(chain as any);

    const result = await repo.getFirstFans(trackId);

    expect(MockPlaysTrackHandling.find).toHaveBeenCalledWith({
      trackId,
      canAppear: true,
    });
    expect(result).toBe(fans);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// getUserSettingsById
// ═════════════════════════════════════════════════════════════════════════════
describe('getUserSettingsById', () => {
  it('returns the settings for the user', async () => {
    const settings = { privacy: { showTrackTopFans: true } };
    MockSettings.findOne.mockResolvedValue(settings as any);

    const result = await repo.getUserSettingsById(userId);

    expect(MockSettings.findOne).toHaveBeenCalledWith({ userId });
    expect(result).toBe(settings);
  });

  it('returns null when settings are not configured', async () => {
    MockSettings.findOne.mockResolvedValue(null);

    const result = await repo.getUserSettingsById(userId);

    expect(result).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// incrementDownloads
// ═════════════════════════════════════════════════════════════════════════════
describe('incrementDownloads', () => {
  it('increments the download counter for the track', async () => {
    MockTrack.findOneAndUpdate.mockResolvedValue({} as any);

    await repo.incrementDownloads(trackId);

    expect(MockTrack.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: trackId },
      { $inc: { numOfDownloads: 1 } },
    );
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// addToTrackStats
// ═════════════════════════════════════════════════════════════════════════════
describe('addToTrackStats', () => {
  const listenedDuration = 60;

  function makeStatsDoc(overrides: Record<string, unknown> = {}) {
    return {
      totalListenedDuration: listenedDuration,
      totalNumberOfPlay: 1,
      ...overrides,
    } as any;
  }

  beforeEach(() => {
    MockFollowing.findOne.mockResolvedValue({ followed: [] } as any);
    MockSettings.findOne.mockResolvedValue({
      privacy: { showFirstTopFan: true },
    } as any);
    MockPlaysTrackHandling.findOneAndUpdate
      .mockResolvedValueOnce(makeStatsDoc()) // first call — upsert
      .mockResolvedValueOnce({}); // second call — set playThroughPercentage
  });

  it('upserts play stats and updates playthrough percentage', async () => {
    const track = makeTrack({ durationInSeconds: 200 });

    await repo.addToTrackStats(track, userId, listenedDuration);

    expect(MockPlaysTrackHandling.findOneAndUpdate).toHaveBeenCalledTimes(2);

    // First call — increments counters
    expect(MockPlaysTrackHandling.findOneAndUpdate).toHaveBeenNthCalledWith(
      1,
      { trackId: track._id, userId },
      expect.objectContaining({
        $inc: expect.objectContaining({ totalNumberOfPlay: 1 }),
      }),
      { upsert: true, returnDocument: 'after' },
    );

    // Second call — sets computed percentage
    expect(MockPlaysTrackHandling.findOneAndUpdate).toHaveBeenNthCalledWith(
      2,
      { trackId: track._id, userId },
      { $set: { playThroughPercentage: expect.any(Number) } },
    );
  });

  it('marks isFanOfArtist true when user follows artist and has liked the track', async () => {
    const artistId = new Types.ObjectId();
    const track = makeTrack({
      posterId: artistId,
      likedBy: [new Types.ObjectId(userId)],
    });

    MockFollowing.findOne.mockResolvedValue({
      followed: [artistId],
    } as any);

    await repo.addToTrackStats(track, userId, listenedDuration);

    expect(MockPlaysTrackHandling.findOneAndUpdate).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        $set: expect.objectContaining({ isFanOfArtist: true }),
      }),
      expect.anything(),
    );
  });

  it('increments firstWeekNumPlays for tracks created within 7 days', async () => {
    const recentTrack = makeTrack({ createdAt: new Date() });

    await repo.addToTrackStats(recentTrack, userId, listenedDuration);

    expect(MockPlaysTrackHandling.findOneAndUpdate).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({
        $inc: expect.objectContaining({ firstWeekNumPlays: 1 }),
      }),
      expect.anything(),
    );
  });

  it('does NOT increment firstWeekNumPlays for tracks older than 7 days', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    const oldTrack = makeTrack({ createdAt: oldDate });

    await repo.addToTrackStats(oldTrack, userId, listenedDuration);

    const firstCall = MockPlaysTrackHandling.findOneAndUpdate.mock.calls[0][1];
    expect(firstCall.$inc).not.toHaveProperty('firstWeekNumPlays');
  });
});
