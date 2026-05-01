import { PlaylistsRepository } from '../../../src/modules/playlists/playlists.repository';
import Playlist from '../../../src/shared/models/models.playlist';
import Track from '../../../src/shared/models/models.track';
import User from '../../../src/shared/models/models.user';
import BlockedList from '../../../src/shared/models/models.blocked-list';
import Following from '../../../src/shared/models/models.following';
import History from '../../../src/shared/models/models.history';
import { redisRepoCacher } from '../../../src/shared/abstractions/redis/redisRepoCacher';

jest.mock('../../../src/shared/models/models.playlist');
jest.mock('../../../src/shared/models/models.track');
jest.mock('../../../src/shared/models/models.user');
jest.mock('../../../src/shared/models/models.blocked-list');
jest.mock('../../../src/shared/models/models.following');
jest.mock('../../../src/shared/models/models.history');
jest.mock('../../../src/shared/abstractions/redis/redisRepoCacher', () => ({
  redisRepoCacher: {
    cacheObject: jest.fn(),
  },
  RedisObjectType: { PLAYLIST: 'playlist' },
}));

const ID = {
  user1: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  user2: 'bbbbbbbbbbbbbbbbbbbbbbbb',
  artist1: 'cccccccccccccccccccccccc',
  playlist1: 'dddddddddddddddddddddddd',
  playlist2: 'eeeeeeeeeeeeeeeeeeeeeeee',
  track1: 'ffffffffffffffffffffffff',
  track2: '111111111111111111111111',
  other: '222222222222222222222222',
};

describe('PlaylistsRepository - FULL TEST', () => {
  let repo: PlaylistsRepository;

  beforeEach(() => {
    repo = new PlaylistsRepository();
    jest.clearAllMocks();
  });

  const mockChain = (finalValue: any) => ({
    select: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(finalValue),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
  });

  it('addPlaylistToHistory - calls findOneAndUpdate twice', async () => {
    (History.findOneAndUpdate as any).mockResolvedValue(null);

    await repo.addPlaylistToHistory(ID.user1, ID.playlist1);

    expect(History.findOneAndUpdate).toHaveBeenCalledTimes(2);
  });

  it('getBlockedRelations - returns blocked ids', async () => {
    (BlockedList.findOne as any).mockReturnValue(
      mockChain({ blockedIds: [ID.user1, ID.user2] }),
    );

    (BlockedList.find as any).mockReturnValue(
      mockChain([{ blockerId: { toString: () => ID.artist1 } }]),
    );

    const result = await repo.getBlockedRelations(ID.user1);

    expect(result.blockedByMe).toEqual([ID.user1, ID.user2]);
    expect(result.blockedMe).toEqual([ID.artist1]);
  });

  it('getBlockedRelations - returns empty arrays when no docs', async () => {
    (BlockedList.findOne as any).mockReturnValue(mockChain(null));
    (BlockedList.find as any).mockReturnValue(mockChain([]));

    const result = await repo.getBlockedRelations(ID.user1);

    expect(result.blockedByMe).toEqual([]);
    expect(result.blockedMe).toEqual([]);
  });

  it('isUserBlocked - returns true when user is in blockedIds', async () => {
    (BlockedList.findOne as any).mockReturnValue(
      mockChain({ blockedIds: [{ toString: () => ID.user2 }] }),
    );

    const result = await repo.isUserBlocked(ID.artist1, ID.user2);

    expect(result).toBe(true);
  });

  it('isUserBlocked - returns false when user is not blocked', async () => {
    (BlockedList.findOne as any).mockReturnValue(
      mockChain({ blockedIds: [{ toString: () => ID.other }] }),
    );

    const result = await repo.isUserBlocked(ID.artist1, ID.user2);

    expect(result).toBe(false);
  });

  it('isUserBlocked - returns false when no blocked doc', async () => {
    (BlockedList.findOne as any).mockReturnValue(mockChain(null));

    const result = await repo.isUserBlocked(ID.artist1, ID.user2);

    expect(result).toBe(false);
  });

  it('isPlaylsitPermalinkTaken - returns true when playlist exists', async () => {
    (Playlist.findOne as any).mockResolvedValue({ _id: ID.playlist1 });

    const result = await repo.isPlaylsitPermalinkTaken('my-link', ID.user1);

    expect(result).toBe(true);
  });

  it('isPlaylsitPermalinkTaken - returns false when no playlist', async () => {
    (Playlist.findOne as any).mockResolvedValue(null);

    const result = await repo.isPlaylsitPermalinkTaken('my-link', ID.user1);

    expect(result).toBe(false);
  });

  it('isPlaylsitPermalinkTaken - passes excludedPlaylistId to query', async () => {
    (Playlist.findOne as any).mockResolvedValue(null);

    await repo.isPlaylsitPermalinkTaken('my-link', ID.user1, ID.playlist1);

    expect(Playlist.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: { $ne: ID.playlist1 } }),
    );
  });

  it('findById - returns playlist', async () => {
    (Playlist.findByIdCached as any) = jest
      .fn()
      .mockResolvedValue({ _id: ID.playlist1 });

    const result = await repo.findById(ID.playlist1);

    expect(result).toEqual({ _id: ID.playlist1 });
  });

  it('findNumberOfPostedPlaylists - returns user with playlists field', async () => {
    (User.findById as any).mockReturnValue(
      mockChain({ _id: ID.user1, playlists: [ID.playlist1, ID.playlist2] }),
    );

    const result = await repo.findNumberOfPostedPlaylists(ID.user1);

    expect(result).toEqual({
      _id: ID.user1,
      playlists: [ID.playlist1, ID.playlist2],
    });
  });

  it('findTrackLengthesByIds - returns total duration', async () => {
    (Track.find as any).mockReturnValue(
      mockChain([{ durationInSeconds: 180 }, { durationInSeconds: 200 }]),
    );

    const result = await repo.findTrackLengthesByIds([ID.track1, ID.track2]);

    expect(result).toBe(380);
  });

  it('findTrackLengthesByIds - returns error when tracks count mismatches', async () => {
    (Track.find as any).mockReturnValue(
      mockChain([{ durationInSeconds: 180 }]),
    );

    const result = await repo.findTrackLengthesByIds([ID.track1, ID.track2]);

    expect(result).toBeInstanceOf(Error);
  });

  it('findByIdWithTracks - returns null when aggregate returns empty', async () => {
    jest
      .spyOn(repo, 'findById')
      .mockResolvedValue({ artistId: { toString: () => ID.artist1 } } as any);
    jest.spyOn(repo, 'isUserBlocked').mockResolvedValue(false);
    (Playlist.aggregate as any).mockResolvedValue([]);

    const result = await repo.findByIdWithTracks(ID.playlist1, ID.user1);

    expect(result).toBeNull();
  });

  it('findByIdWithTracks - returns playlist when aggregate returns result', async () => {
    jest
      .spyOn(repo, 'findById')
      .mockResolvedValue({ artistId: { toString: () => ID.artist1 } } as any);
    jest.spyOn(repo, 'isUserBlocked').mockResolvedValue(false);
    (Playlist.aggregate as any).mockResolvedValue([
      { _id: ID.playlist1, tracks: [] },
    ]);

    const result = await repo.findByIdWithTracks(ID.playlist1, ID.user1);

    expect(result).toEqual({ _id: ID.playlist1, tracks: [] });
  });

  it('findByIdWithTracks - returns error when user is blocked', async () => {
    jest
      .spyOn(repo, 'findById')
      .mockResolvedValue({ artistId: { toString: () => ID.artist1 } } as any);
    jest.spyOn(repo, 'isUserBlocked').mockResolvedValue(true);

    const result = await repo.findByIdWithTracks(ID.playlist1, ID.user1);

    expect(result).toBeInstanceOf(Error);
  });

  it('findByIdWithTracks - skips block check when no requesting user', async () => {
    jest
      .spyOn(repo, 'findById')
      .mockResolvedValue({ artistId: { toString: () => ID.artist1 } } as any);
    jest.spyOn(repo, 'isUserBlocked').mockResolvedValue(false);
    (Playlist.aggregate as any).mockResolvedValue([
      { _id: ID.playlist1, tracks: [] },
    ]);

    const result = await repo.findByIdWithTracks(ID.playlist1, null);

    expect(repo.isUserBlocked).not.toHaveBeenCalled();
    expect(result).toEqual({ _id: ID.playlist1, tracks: [] });
  });

  it('create - creates and returns new playlist', async () => {
    jest.spyOn(repo, 'isPlaylsitPermalinkTaken').mockResolvedValue(false);

    const saveMock = jest.fn().mockResolvedValue({
      toObject: () => ({ _id: ID.playlist1, title: 'My Playlist' }),
    });
    (Playlist as any).mockImplementation(() => ({ save: saveMock }));

    const result = await repo.create('My Playlist', ID.user1, [], false, 300);

    expect(saveMock).toHaveBeenCalled();
    expect(result).toEqual({ _id: ID.playlist1, title: 'My Playlist' });
  });

  it('create - throws when permalink is taken', async () => {
    jest.spyOn(repo, 'isPlaylsitPermalinkTaken').mockResolvedValue(true);

    await expect(
      repo.create('My Playlist', ID.user1, [], false, 300),
    ).rejects.toThrow('Playlist permaLink is already taken');
  });

  it('createWithImage - creates and returns new playlist', async () => {
    jest.spyOn(repo, 'isPlaylsitPermalinkTaken').mockResolvedValue(false);

    const saveMock = jest.fn().mockResolvedValue({
      toObject: () => ({ _id: ID.playlist2, title: 'Image Playlist' }),
    });
    (Playlist as any).mockImplementation(() => ({ save: saveMock }));

    const result = await repo.createWithImage(
      'Image Playlist',
      ID.user1,
      [],
      false,
      300,
      'A description',
    );

    expect(saveMock).toHaveBeenCalled();
    expect(result).toEqual({ _id: ID.playlist2, title: 'Image Playlist' });
  });

  it('createWithImage - throws when permalink is taken', async () => {
    jest.spyOn(repo, 'isPlaylsitPermalinkTaken').mockResolvedValue(true);

    await expect(
      repo.createWithImage('My Playlist', ID.user1, [], false, 300, 'desc'),
    ).rejects.toThrow('Playlist permaLink is already taken');
  });

  it('getUserIdByProfileLink - returns user id', async () => {
    (User.findOne as any).mockResolvedValue({
      _id: { toString: () => ID.user1 },
    });

    const result = await repo.getUserIdByProfileLink('ahmed');

    expect(result).toBe(ID.user1);
  });

  it('getUserIdByProfileLink - returns null when user not found', async () => {
    (User.findOne as any).mockResolvedValue(null);

    const result = await repo.getUserIdByProfileLink('notexist');

    expect(result).toBeNull();
  });

  it('addTrackToEndOfPlaylist - adds track successfully', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValue({
      artistId: { toString: () => ID.user1 },
      listOfTracks: [],
    } as any);

    (Track.findById as any).mockReturnValue({
      exec: jest
        .fn()
        .mockResolvedValue({ _id: ID.track1, durationInSeconds: 200 }),
    });

    (Playlist.findByIdAndUpdate as any).mockReturnValue({
      exec: jest.fn().mockResolvedValue({}),
    });

    const result = await repo.addTrackToEndOfPlaylist(
      ID.track1,
      ID.playlist1,
      ID.user1,
    );

    expect(Playlist.findByIdAndUpdate).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('addTrackToEndOfPlaylist - returns error when track not found', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValue({
      artistId: { toString: () => ID.user1 },
      listOfTracks: [],
    } as any);

    (Track.findById as any).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const result = await repo.addTrackToEndOfPlaylist(
      ID.track1,
      ID.playlist1,
      ID.user1,
    );

    expect(result).toBeInstanceOf(Error);
  });

  it('addTrackToEndOfPlaylist - returns error when track already in playlist', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValue({
      artistId: { toString: () => ID.user1 },
      listOfTracks: [{ toString: () => ID.track1 }],
    } as any);

    (Track.findById as any).mockReturnValue({
      exec: jest
        .fn()
        .mockResolvedValue({ _id: ID.track1, durationInSeconds: 200 }),
    });

    const result = await repo.addTrackToEndOfPlaylist(
      ID.track1,
      ID.playlist1,
      ID.user1,
    );

    expect(result).toBeInstanceOf(Error);
  });

  it('addTrackToEndOfPlaylist - throws when wrong user tries to edit', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValue({
      artistId: { toString: () => ID.other },
      listOfTracks: [],
    } as any);

    (Track.findById as any).mockReturnValue({
      exec: jest
        .fn()
        .mockResolvedValue({ _id: ID.track1, durationInSeconds: 200 }),
    });

    await expect(
      repo.addTrackToEndOfPlaylist(ID.track1, ID.playlist1, ID.user1),
    ).rejects.toThrow();
  });

  it('updateImage - updates and returns playlist', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValue({
      artistId: { toString: () => ID.user1 },
    } as any);

    (Playlist.findByIdAndUpdate as any).mockReturnValue({
      lean: jest
        .fn()
        .mockResolvedValue({ _id: ID.playlist1, image: { imgLink: 'url' } }),
    });

    const result = await repo.updateImage(
      ID.playlist1,
      'url',
      'pubId',
      ID.user1,
    );

    expect(result).toEqual({ _id: ID.playlist1, image: { imgLink: 'url' } });
  });

  it('updateImage - throws when updated playlist is null', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValue({
      artistId: { toString: () => ID.user1 },
    } as any);

    (Playlist.findByIdAndUpdate as any).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });

    await expect(
      repo.updateImage(ID.playlist1, 'url', 'pubId', ID.user1),
    ).rejects.toThrow();
  });

  it('updateImage - throws when wrong user tries to edit', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValue({
      artistId: { toString: () => ID.other },
    } as any);

    await expect(
      repo.updateImage(ID.playlist1, 'url', 'pubId', ID.user1),
    ).rejects.toThrow();
  });

  it('updateOrderOfSignleTrack - reorders track successfully', async () => {
    const tracks = [
      { toString: () => ID.track1 },
      { toString: () => ID.track2 },
      { toString: () => ID.other },
    ];

    jest.spyOn(repo, 'findById').mockResolvedValue({
      artistId: { toString: () => ID.user1 },
      listOfTracks: tracks,
    } as any);

    (Playlist.findByIdAndUpdate as any).mockReturnValue({
      exec: jest.fn().mockResolvedValue({}),
    });

    const result = await repo.updateOrderOfSignleTrack(
      ID.playlist1,
      ID.track1,
      0,
      2,
      ID.user1,
    );

    expect(result).toBe(true);
    expect(Playlist.findByIdAndUpdate).toHaveBeenCalled();
  });

  it('updateOrderOfSignleTrack - returns true when old and new positions are the same', async () => {
    const tracks = [
      { toString: () => ID.track1 },
      { toString: () => ID.track2 },
    ];

    jest.spyOn(repo, 'findById').mockResolvedValue({
      artistId: { toString: () => ID.user1 },
      listOfTracks: tracks,
    } as any);

    const result = await repo.updateOrderOfSignleTrack(
      ID.playlist1,
      ID.track1,
      0,
      0,
      ID.user1,
    );

    expect(result).toBe(true);
    expect(Playlist.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('updateOrderOfSignleTrack - returns error when playlist not found', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValue(null);

    const result = await repo.updateOrderOfSignleTrack(
      ID.playlist1,
      ID.track1,
      0,
      1,
      ID.user1,
    );

    expect(result).toBeInstanceOf(Error);
  });

  it('updateOrderOfSignleTrack - returns error when old position out of bounds', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValue({
      artistId: { toString: () => ID.user1 },
      listOfTracks: [{ toString: () => ID.track1 }],
    } as any);

    const result = await repo.updateOrderOfSignleTrack(
      ID.playlist1,
      ID.track1,
      5,
      0,
      ID.user1,
    );

    expect(result).toBeInstanceOf(Error);
  });

  it('updateOrderOfSignleTrack - returns error when new position out of bounds', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValue({
      artistId: { toString: () => ID.user1 },
      listOfTracks: [{ toString: () => ID.track1 }],
    } as any);

    const result = await repo.updateOrderOfSignleTrack(
      ID.playlist1,
      ID.track1,
      0,
      5,
      ID.user1,
    );

    expect(result).toBeInstanceOf(Error);
  });

  it('updateOrderOfSignleTrack - returns error when track not at old position', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValue({
      artistId: { toString: () => ID.user1 },
      listOfTracks: [
        { toString: () => ID.other },
        { toString: () => ID.track2 },
      ],
    } as any);

    const result = await repo.updateOrderOfSignleTrack(
      ID.playlist1,
      ID.track1,
      0,
      1,
      ID.user1,
    );

    expect(result).toBeInstanceOf(Error);
  });

  it('findByPermalinkWithProfileLink - returns null when playlist not found', async () => {
    (Playlist.findOne as any).mockReturnValue(mockChain(null));

    const result = await repo.findByPermalinkWithProfileLink(
      'link',
      ID.user1,
      null,
    );

    expect(result).toBeNull();
  });

  it('findByPermalinkWithProfileLink - calls findByIdWithTracks when playlist found', async () => {
    (Playlist.findOne as any).mockReturnValue(
      mockChain({ _id: { toString: () => ID.playlist1 } }),
    );

    jest
      .spyOn(repo, 'findByIdWithTracks')
      .mockResolvedValue({ _id: ID.playlist1, tracks: [] } as any);

    const result = await repo.findByPermalinkWithProfileLink(
      'link',
      ID.user1,
      ID.user2,
    );

    expect(repo.findByIdWithTracks).toHaveBeenCalledWith(
      ID.playlist1,
      ID.user2,
      1,
      5,
    );
    expect(result).toEqual({ _id: ID.playlist1, tracks: [] });
  });

  it('updatePlaylist - updates successfully', async () => {
    (Track.aggregate as any).mockResolvedValue([
      { count: 2, totalDuration: 400 },
    ]);

    (Playlist.find as any).mockResolvedValue([]);

    (Playlist.findByIdAndUpdate as any).mockReturnValue({
      exec: jest.fn().mockResolvedValue({}),
    });

    const result = await repo.updatePlaylist({
      params: { id: ID.playlist1 },
      body: {
        listOfTracks: [ID.track1, ID.track2],
        title: 'Updated',
        description: 'desc',
        genre: 'pop',
        additionalTags: [],
        releaseDate: new Date(),
        isPrivate: false,
        playlistType: 'playlist',
        recordLabel: '',
        permalink: 'updated',
      },
    } as any);

    expect(Playlist.findByIdAndUpdate).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  it('updatePlaylist - returns error when tracks not found', async () => {
    (Track.aggregate as any).mockResolvedValue([
      { count: 1, totalDuration: 200 },
    ]);

    const result = await repo.updatePlaylist({
      params: { id: ID.playlist1 },
      body: { listOfTracks: [ID.track1, ID.track2], permalink: 'link' },
    } as any);

    expect(result).toBeInstanceOf(Error);
  });

  it('updatePlaylist - returns error when permalink already exists', async () => {
    (Track.aggregate as any).mockResolvedValue([
      { count: 2, totalDuration: 400 },
    ]);
    (Playlist.find as any).mockResolvedValue([{ _id: ID.playlist2 }]);

    const result = await repo.updatePlaylist({
      params: { id: ID.playlist1 },
      body: { listOfTracks: [ID.track1, ID.track2], permalink: 'taken' },
    } as any);

    expect(result).toBeInstanceOf(Error);
  });

  it('getArtistDetails - returns artist details', async () => {
    (User.findById as any).mockReturnValue(
      mockChain({
        displayName: 'Ahmed',
        profileLink: 'ahmed',
        profileImg: 'img.png',
      }),
    );

    (Following.findOne as any)
      .mockReturnValueOnce(mockChain({ followers: ['f1', 'f2'] }))
      .mockReturnValueOnce(
        mockChain({ followed: [{ toString: () => ID.artist1 }] }),
      );

    const result = await repo.getArtistDetails(ID.artist1, ID.user1);

    expect(result).toEqual({
      displayName: 'Ahmed',
      profileLink: 'ahmed',
      profileImage: 'img.png',
      followersCount: 2,
      isFollowed: true,
    });
  });

  it('getArtistDetails - returns null when artist not found', async () => {
    (User.findById as any).mockReturnValue(mockChain(null));

    const result = await repo.getArtistDetails(ID.artist1, ID.user1);

    expect(result).toBeNull();
  });

  it('getArtistDetails - isFollowed false when userId is null', async () => {
    (User.findById as any).mockReturnValue(
      mockChain({
        displayName: 'Ahmed',
        profileLink: 'ahmed',
        profileImg: 'img.png',
      }),
    );

    (Following.findOne as any).mockReturnValue(mockChain({ followers: [] }));

    const result = await repo.getArtistDetails(ID.artist1, null);

    expect(result?.isFollowed).toBe(false);
  });

  it('getMorePlaylistsFromSameArtist - returns playlists', async () => {
    jest.spyOn(repo, 'isUserBlocked').mockResolvedValue(false);

    (Playlist.find as any).mockReturnValue(
      mockChain([{ _id: { toString: () => ID.playlist2 } }]),
    );

    (redisRepoCacher.cacheObject as jest.Mock).mockResolvedValue(null);

    const result = await repo.getMorePlaylistsFromSameArtist(
      ID.artist1,
      ID.playlist1,
      ID.user1,
    );

    expect(result).toHaveLength(1);
  });

  it('getMorePlaylistsFromSameArtist - returns error when user is blocked', async () => {
    jest.spyOn(repo, 'isUserBlocked').mockResolvedValue(true);

    const result = await repo.getMorePlaylistsFromSameArtist(
      ID.artist1,
      ID.playlist1,
      ID.user1,
    );

    expect(result).toBeInstanceOf(Error);
  });

  it('getMorePlaylistsFromSameArtist - skips block check when no userId', async () => {
    jest.spyOn(repo, 'isUserBlocked').mockResolvedValue(false);

    (Playlist.find as any).mockReturnValue(mockChain([]));

    await repo.getMorePlaylistsFromSameArtist(ID.artist1, ID.playlist1, null);

    expect(repo.isUserBlocked).not.toHaveBeenCalled();
  });

  it('getMyPlaylists - returns playlists with pagination', async () => {
    (Playlist.find as any).mockReturnValue(mockChain([{ _id: ID.playlist1 }]));

    const result = await repo.getMyPlaylists(ID.user1, 2, 5);

    expect(result).toEqual([{ _id: ID.playlist1 }]);
  });

  it('getPlaylistsForArtist - returns playlists when not blocked', async () => {
    jest.spyOn(repo, 'isUserBlocked').mockResolvedValue(false);
    (Playlist.find as any).mockReturnValue(mockChain([{ _id: ID.playlist1 }]));

    const result = await repo.getPlaylistsForArtist(ID.artist1, 1, 5, ID.user1);

    expect(result).toEqual([{ _id: ID.playlist1 }]);
  });

  it('getPlaylistsForArtist - returns error when user is blocked', async () => {
    jest.spyOn(repo, 'isUserBlocked').mockResolvedValue(true);

    const result = await repo.getPlaylistsForArtist(ID.artist1, 1, 5, ID.user1);

    expect(result).toBeInstanceOf(Error);
  });

  it('getPlaylistsForArtist - skips block check when no userId', async () => {
    jest.spyOn(repo, 'isUserBlocked').mockResolvedValue(false);
    (Playlist.find as any).mockReturnValue(mockChain([]));

    await repo.getPlaylistsForArtist(ID.artist1, 1, 5, null);

    expect(repo.isUserBlocked).not.toHaveBeenCalled();
  });

  it('getPlaylistsForArtist - filters by album type when getAlbums is true', async () => {
    jest.spyOn(repo, 'isUserBlocked').mockResolvedValue(false);
    (Playlist.find as any).mockReturnValue(mockChain([]));

    await repo.getPlaylistsForArtist(ID.artist1, 1, 5, null, true);

    expect(Playlist.find).toHaveBeenCalledWith(
      expect.objectContaining({ playlistType: 'album' }),
    );
  });

  it('delete - deletes and returns true', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValue({
      artistId: { toString: () => ID.user1 },
    } as any);

    (Playlist.findByIdAndDelete as any).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: ID.playlist1 }),
    });

    const result = await repo.delete(ID.playlist1, ID.user1);

    expect(result).toBe(true);
  });

  it('delete - returns false when playlist not found', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValue(null);

    const result = await repo.delete(ID.playlist1, ID.user1);

    expect(result).toBe(false);
  });

  it('delete - returns false when findByIdAndDelete returns null', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValue({
      artistId: { toString: () => ID.user1 },
    } as any);

    (Playlist.findByIdAndDelete as any).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    const result = await repo.delete(ID.playlist1, ID.user1);

    expect(result).toBe(false);
  });

  it('delete - throws when wrong user tries to delete', async () => {
    jest.spyOn(repo, 'findById').mockResolvedValue({
      artistId: { toString: () => ID.other },
    } as any);

    await expect(repo.delete(ID.playlist1, ID.user1)).rejects.toThrow();
  });

  it('findAll - returns playlists via aggregate', async () => {
    jest.spyOn(repo, 'getBlockedRelations').mockResolvedValue({
      blockedByMe: [],
      blockedMe: [],
    });

    (Playlist.aggregate as any).mockResolvedValue([{ _id: ID.playlist1 }]);

    const result = await repo.findAll(10, 1, ID.user1);

    expect(result).toEqual([{ _id: ID.playlist1 }]);
  });

  it('findAll - skips blocked relations when no userId', async () => {
    jest.spyOn(repo, 'getBlockedRelations').mockResolvedValue({
      blockedByMe: [],
      blockedMe: [],
    });

    (Playlist.aggregate as any).mockResolvedValue([]);

    await repo.findAll(10, 1, null);

    expect(repo.getBlockedRelations).not.toHaveBeenCalled();
  });
});
