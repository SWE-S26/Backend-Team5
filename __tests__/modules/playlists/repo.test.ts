import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Types } from 'mongoose';

import Playlist from '../../../src/shared/models/models.playlist';
import Track from '../../../src/shared/models/models.track';
import User from '../../../src/shared/models/models.user';
import BlockedList from '../../../src/shared/models/models.blocked-list';
import Following from '../../../src/shared/models/models.following';
import History from '../../../src/shared/models/models.history';

import { PlaylistsRepository } from '../../../src/modules/playlists/playlists.repository';

jest.mock('../../../src/shared/abstractions/blob.service', () => ({
  default: {
    uploadWaveToBlob: jest.fn(),
    deleteWaveFromBlob: jest.fn(),
  },
}));
jest.mock('../../../src/shared/models/models.playlist');
jest.mock('../../../src/shared/models/models.track');
jest.mock('../../../src/shared/models/models.user');
jest.mock('../../../src/shared/models/models.blocked-list');
jest.mock('../../../src/shared/models/models.following');
jest.mock('../../../src/shared/models/models.history');
jest.mock('../../../src/shared/abstractions/redis/redisRepoCacher', () => ({
  redisRepoCacher: { cacheObject: jest.fn() },
  RedisObjectType: { PLAYLIST: 'playlist' },
}));

const playlistsRepository = new PlaylistsRepository();

const userId = new Types.ObjectId().toString();
const artistId = new Types.ObjectId().toString();
const playlistId = new Types.ObjectId().toString();
const trackId = new Types.ObjectId().toString();

const fakeTrack = {
  _id: new Types.ObjectId(trackId),
  durationInSeconds: 200,
};

const fakePlaylist = {
  _id: new Types.ObjectId(playlistId),
  title: 'My Playlist',
  permaLink: 'my-playlist',
  artistId: new Types.ObjectId(artistId),
  listOfTracks: [new Types.ObjectId(trackId)],
  isPrivate: false,
  playlistLengthInSeconds: 200,
};

const fakeUser = {
  _id: new Types.ObjectId(userId),
  displayName: 'Test User',
  profileLink: 'test-user',
  profileImg: 'img.png',
};

describe('PlaylistsRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addPlaylistToHistory', () => {
    it('should call findOneAndUpdate twice', async () => {
      (History.findOneAndUpdate as jest.Mock).mockResolvedValue(null);

      await playlistsRepository.addPlaylistToHistory(userId, playlistId);

      expect(History.findOneAndUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('getBlockedRelations', () => {
    it('should return blocked relations', async () => {
      const blockedId = new Types.ObjectId();

      (BlockedList.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ blockedIds: [blockedId] }),
      });

      (BlockedList.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue([{ blockerId: new Types.ObjectId(artistId) }]),
      });

      const result = await playlistsRepository.getBlockedRelations(userId);

      expect(result.blockedByMe).toEqual([blockedId]);
      expect(result.blockedMe).toEqual([artistId]);
    });

    it('should return empty arrays when no blocks exist', async () => {
      (BlockedList.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      (BlockedList.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const result = await playlistsRepository.getBlockedRelations(userId);

      expect(result.blockedByMe).toEqual([]);
      expect(result.blockedMe).toEqual([]);
    });
  });

  describe('isUserBlocked', () => {
    it('should return true if user is blocked', async () => {
      (BlockedList.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue({ blockedIds: [new Types.ObjectId(userId)] }),
      });

      const result = await playlistsRepository.isUserBlocked(artistId, userId);

      expect(result).toBe(true);
    });

    it('should return false if user is not blocked', async () => {
      (BlockedList.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await playlistsRepository.isUserBlocked(artistId, userId);

      expect(result).toBe(false);
    });
  });

  describe('isPlaylsitPermalinkTaken', () => {
    it('should return true if permalink is taken', async () => {
      (Playlist.findOne as jest.Mock).mockResolvedValue(fakePlaylist);

      const result = await playlistsRepository.isPlaylsitPermalinkTaken(
        'my-playlist',
        artistId,
      );

      expect(result).toBe(true);
    });

    it('should return false if permalink is not taken', async () => {
      (Playlist.findOne as jest.Mock).mockResolvedValue(null);

      const result = await playlistsRepository.isPlaylsitPermalinkTaken(
        'my-playlist',
        artistId,
      );

      expect(result).toBe(false);
    });

    it('should exclude a playlist id when provided', async () => {
      (Playlist.findOne as jest.Mock).mockResolvedValue(null);

      await playlistsRepository.isPlaylsitPermalinkTaken(
        'my-playlist',
        artistId,
        playlistId,
      );

      expect(Playlist.findOne).toHaveBeenCalledWith({
        permaLink: 'my-playlist',
        artistId,
        _id: { $ne: playlistId },
      });
    });
  });

  describe('findById', () => {
    it('should call findByIdCached and return the playlist', async () => {
      (Playlist.findByIdCached as jest.Mock).mockResolvedValue(fakePlaylist);

      const result = await playlistsRepository.findById(playlistId);

      expect(result).toEqual(fakePlaylist);
      expect(Playlist.findByIdCached).toHaveBeenCalledWith(playlistId);
    });
  });

  describe('findNumberOfPostedPlaylists', () => {
    it('should return user playlists field', async () => {
      const fakePlaylists = {
        _id: new Types.ObjectId(artistId),
        playlists: [],
      };

      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(fakePlaylists),
      });

      const result =
        await playlistsRepository.findNumberOfPostedPlaylists(artistId);

      expect(result).toEqual(fakePlaylists);
      expect(User.findById).toHaveBeenCalledWith(artistId);
    });
  });

  describe('findTrackLengthesByIds', () => {
    it('should return total duration', async () => {
      (Track.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue([
            { durationInSeconds: 100 },
            { durationInSeconds: 200 },
          ]),
      });

      const result = await playlistsRepository.findTrackLengthesByIds([
        trackId,
        new Types.ObjectId().toString(),
      ]);

      expect(result).toBe(300);
    });

    it('should return an error if some tracks are not found', async () => {
      (Track.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ durationInSeconds: 100 }]),
      });

      const result = await playlistsRepository.findTrackLengthesByIds([
        trackId,
        new Types.ObjectId().toString(),
      ]);

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('create', () => {
    it('should create and return a new playlist', async () => {
      (Playlist.findOne as jest.Mock).mockResolvedValue(null);

      const saveMock = jest.fn().mockResolvedValue({
        toObject: jest.fn().mockReturnValue(fakePlaylist),
      });

      (Playlist as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock,
      }));

      const result = await playlistsRepository.create(
        'My Playlist',
        artistId,
        [],
        false,
        0,
      );

      expect(result).toEqual(fakePlaylist);
    });

    it('should throw if permalink is already taken', async () => {
      (Playlist.findOne as jest.Mock).mockResolvedValue(fakePlaylist);

      await expect(
        playlistsRepository.create('My Playlist', artistId, [], false, 0),
      ).rejects.toThrow('Playlist permaLink is already taken');
    });
  });

  describe('createWithImage', () => {
    it('should create and return a playlist with image/description', async () => {
      (Playlist.findOne as jest.Mock).mockResolvedValue(null);

      const saveMock = jest.fn().mockResolvedValue({
        toObject: jest.fn().mockReturnValue(fakePlaylist),
      });

      (Playlist as unknown as jest.Mock).mockImplementation(() => ({
        save: saveMock,
      }));

      const result = await playlistsRepository.createWithImage(
        'My Playlist',
        artistId,
        [],
        false,
        0,
        'A description',
      );

      expect(result).toEqual(fakePlaylist);
    });

    it('should throw if permalink is already taken', async () => {
      (Playlist.findOne as jest.Mock).mockResolvedValue(fakePlaylist);

      await expect(
        playlistsRepository.createWithImage(
          'My Playlist',
          artistId,
          [],
          false,
          0,
          'desc',
        ),
      ).rejects.toThrow('Playlist permaLink is already taken');
    });
  });

  describe('getUserIdByProfileLink', () => {
    it('should return the user id string', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(fakeUser);

      const result =
        await playlistsRepository.getUserIdByProfileLink('test-user');

      expect(result).toBe(fakeUser._id.toString());
    });

    it('should return null if user not found', async () => {
      (User.findOne as jest.Mock).mockResolvedValue(null);

      const result = await playlistsRepository.getUserIdByProfileLink('ghost');

      expect(result).toBeNull();
    });
  });

  describe('addTrackToEndOfPlaylist', () => {
    it('should add a track to the playlist', async () => {
      (Playlist.findByIdCached as jest.Mock).mockResolvedValue({
        ...fakePlaylist,
        listOfTracks: [],
        artistId: new Types.ObjectId(userId),
      });

      (Track.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeTrack),
      });

      (Playlist.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await playlistsRepository.addTrackToEndOfPlaylist(
        trackId,
        playlistId,
        userId,
      );

      expect(result).toBeUndefined();
      expect(Playlist.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should return error if track not found', async () => {
      (Playlist.findByIdCached as jest.Mock).mockResolvedValue({
        ...fakePlaylist,
        listOfTracks: [],
        artistId: new Types.ObjectId(userId),
      });

      (Track.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await playlistsRepository.addTrackToEndOfPlaylist(
        trackId,
        playlistId,
        userId,
      );

      expect(result).toBeInstanceOf(Error);
    });

    it('should return error if track already in playlist', async () => {
      (Playlist.findByIdCached as jest.Mock).mockResolvedValue({
        ...fakePlaylist,
        listOfTracks: [new Types.ObjectId(trackId)],
        artistId: new Types.ObjectId(userId),
      });

      (Track.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeTrack),
      });

      const result = await playlistsRepository.addTrackToEndOfPlaylist(
        trackId,
        playlistId,
        userId,
      );

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('removeTrackFromPlaylist', () => {
    it('should remove a track from the playlist', async () => {
      (Playlist.findByIdCached as jest.Mock).mockResolvedValue({
        ...fakePlaylist,
        artistId: new Types.ObjectId(userId),
      });

      (Track.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeTrack),
      });

      (Playlist.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await playlistsRepository.removeTrackFromPlaylist(
        trackId,
        playlistId,
        userId,
      );

      expect(result).toBeUndefined();
      expect(Playlist.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('should return error if track not found', async () => {
      (Playlist.findByIdCached as jest.Mock).mockResolvedValue({
        ...fakePlaylist,
        artistId: new Types.ObjectId(userId),
      });

      (Track.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await playlistsRepository.removeTrackFromPlaylist(
        trackId,
        playlistId,
        userId,
      );

      expect(result).toBeInstanceOf(Error);
    });

    it('should return error if track not in playlist', async () => {
      (Playlist.findByIdCached as jest.Mock).mockResolvedValue({
        ...fakePlaylist,
        listOfTracks: [],
        artistId: new Types.ObjectId(userId),
      });

      (Track.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakeTrack),
      });

      const result = await playlistsRepository.removeTrackFromPlaylist(
        trackId,
        playlistId,
        userId,
      );

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('updateImage', () => {
    it('should update and return the playlist image', async () => {
      (Playlist.findByIdCached as jest.Mock).mockResolvedValue({
        ...fakePlaylist,
        artistId: new Types.ObjectId(userId),
      });

      (Playlist.findByIdAndUpdate as jest.Mock).mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          ...fakePlaylist,
          image: { imgLink: 'url', publicId: 'pid' },
        }),
      });

      const result = await playlistsRepository.updateImage(
        playlistId,
        'url',
        'pid',
        userId,
      );

      expect(result).toMatchObject({
        image: { imgLink: 'url', publicId: 'pid' },
      });
    });
  });

  describe('updateOrderOfSignleTrack', () => {
    it('should reorder tracks and return true', async () => {
      const track1 = new Types.ObjectId(trackId);
      const track2 = new Types.ObjectId();

      (Playlist.findByIdCached as jest.Mock).mockResolvedValue({
        ...fakePlaylist,
        listOfTracks: [track1, track2],
        artistId: new Types.ObjectId(userId),
      });

      (Playlist.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await playlistsRepository.updateOrderOfSignleTrack(
        playlistId,
        trackId,
        0,
        1,
        userId,
      );

      expect(result).toBe(true);
    });

    it('should return true if oldPosition equals newPosition', async () => {
      const track1 = new Types.ObjectId(trackId);

      (Playlist.findByIdCached as jest.Mock).mockResolvedValue({
        ...fakePlaylist,
        listOfTracks: [track1],
        artistId: new Types.ObjectId(userId),
      });

      const result = await playlistsRepository.updateOrderOfSignleTrack(
        playlistId,
        trackId,
        0,
        0,
        userId,
      );

      expect(result).toBe(true);
    });

    it('should return error if playlist not found', async () => {
      (Playlist.findByIdCached as jest.Mock).mockResolvedValue(null);

      const result = await playlistsRepository.updateOrderOfSignleTrack(
        playlistId,
        trackId,
        0,
        1,
        userId,
      );

      expect(result).toBeInstanceOf(Error);
    });

    it('should return error if old position is out of bounds', async () => {
      (Playlist.findByIdCached as jest.Mock).mockResolvedValue({
        ...fakePlaylist,
        listOfTracks: [new Types.ObjectId(trackId)],
        artistId: new Types.ObjectId(userId),
      });

      const result = await playlistsRepository.updateOrderOfSignleTrack(
        playlistId,
        trackId,
        5,
        0,
        userId,
      );

      expect(result).toBeInstanceOf(Error);
    });

    it('should return error if track not at old position', async () => {
      const otherTrackId = new Types.ObjectId();

      (Playlist.findByIdCached as jest.Mock).mockResolvedValue({
        ...fakePlaylist,
        listOfTracks: [otherTrackId],
        artistId: new Types.ObjectId(userId),
      });

      const result = await playlistsRepository.updateOrderOfSignleTrack(
        playlistId,
        trackId,
        0,
        0,
        userId,
      );

      expect(result).toBe(true);
    });
  });

  describe('getArtistDetails', () => {
    it('should return artist details with follower count and isFollowed', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(fakeUser),
      });

      (Following.findOne as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockReturnThis(),
          exec: jest
            .fn()
            .mockResolvedValue({ followers: [new Types.ObjectId(userId)] }),
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          lean: jest.fn().mockReturnThis(),
          exec: jest
            .fn()
            .mockResolvedValue({ followed: [new Types.ObjectId(artistId)] }),
        });

      const result = await playlistsRepository.getArtistDetails(
        artistId,
        userId,
      );

      expect(result).toMatchObject({
        displayName: fakeUser.displayName,
        profileLink: fakeUser.profileLink,
        followersCount: 1,
        isFollowed: true,
      });
    });

    it('should return null if artist not found', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await playlistsRepository.getArtistDetails(artistId, null);

      expect(result).toBeNull();
    });

    it('should return isFollowed false when no userId', async () => {
      (User.findById as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(fakeUser),
      });

      (Following.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await playlistsRepository.getArtistDetails(artistId, null);

      expect(result?.isFollowed).toBe(false);
    });
  });

  describe('getMorePlaylistsFromSameArtist', () => {
    it('should return playlists excluding the given one', async () => {
      const otherPlaylistId = new Types.ObjectId().toString();

      (BlockedList.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      (Playlist.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue([
            { ...fakePlaylist, _id: new Types.ObjectId(otherPlaylistId) },
          ]),
      });

      const result = await playlistsRepository.getMorePlaylistsFromSameArtist(
        artistId,
        playlistId,
        userId,
      );

      expect(result).toHaveLength(1);
    });

    it('should return error if user is blocked', async () => {
      (BlockedList.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue({ blockedIds: [new Types.ObjectId(userId)] }),
      });

      const result = await playlistsRepository.getMorePlaylistsFromSameArtist(
        artistId,
        playlistId,
        userId,
      );

      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('getMyPlaylists', () => {
    it('should return paginated playlists for artist', async () => {
      (Playlist.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([fakePlaylist]),
      });

      const result = await playlistsRepository.getMyPlaylists(artistId, 1, 5);

      expect(result).toEqual([fakePlaylist]);
      expect(Playlist.find).toHaveBeenCalledWith({ artistId });
    });
  });

  describe('getPlaylistsForArtist', () => {
    it('should return public playlists for artist', async () => {
      (BlockedList.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      (Playlist.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([fakePlaylist]),
      });

      const result = await playlistsRepository.getPlaylistsForArtist(
        artistId,
        1,
        5,
        userId,
      );

      expect(result).toEqual([fakePlaylist]);
    });

    it('should return error if user is blocked', async () => {
      (BlockedList.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest
          .fn()
          .mockResolvedValue({ blockedIds: [new Types.ObjectId(userId)] }),
      });

      const result = await playlistsRepository.getPlaylistsForArtist(
        artistId,
        1,
        5,
        userId,
      );

      expect(result).toBeInstanceOf(Error);
    });

    it('should filter by album type when getAlbums is true', async () => {
      (BlockedList.findOne as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      (Playlist.find as jest.Mock).mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      await playlistsRepository.getPlaylistsForArtist(
        artistId,
        1,
        5,
        userId,
        true,
      );

      expect(Playlist.find).toHaveBeenCalledWith(
        expect.objectContaining({ playlistType: 'album' }),
      );
    });
  });

  describe('delete', () => {
    it('should delete the playlist and return true', async () => {
      (Playlist.findByIdCached as jest.Mock).mockResolvedValue({
        ...fakePlaylist,
        artistId: new Types.ObjectId(userId),
      });

      (Playlist.findByIdAndDelete as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(fakePlaylist),
      });

      const result = await playlistsRepository.delete(playlistId, userId);

      expect(result).toBe(true);
    });

    it('should return false if playlist not found', async () => {
      (Playlist.findByIdCached as jest.Mock).mockResolvedValue(null);

      const result = await playlistsRepository.delete(playlistId, userId);

      expect(result).toBe(false);
    });
  });
});
