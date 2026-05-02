import { PlaylistsService } from '../../../src/modules/playlists/playlists.service';
import { PlaylistsRepository } from '../../../src/modules/playlists/playlists.repository';
import {
  CloudinaryService,
  ImageFolder,
} from '../../../src/shared/abstractions/cloudinary.service';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../../src/shared/errors/responseErrors';
import { DEFAULT_PLAYLIST_IMAGE } from '../../../src/config/constants';
import { Types } from 'mongoose';

jest.mock('../../../src/modules/playlists/playlists.repository');
jest.mock('../../../src/shared/abstractions/cloudinary.service');
jest.mock('../../../src/shared/errors/responseErrors', () => ({
  BadRequestError: jest.fn((msg: string) => new Error(msg)),
  ForbiddenError: jest.fn((msg: string) => new Error(msg)),
  NotFoundError: jest.fn((msg: string) => new Error(msg)),
}));
jest.mock('../../../src/shared/logger/logger', () => ({
  default: { info: jest.fn(), debug: jest.fn(), error: jest.fn() },
}));

const fakePlaylist = {
  _id: new Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e1'),
  playlistName: 'Test Playlist',
  isPrivate: false,
  tracks: [],
  artistId: new Types.ObjectId('64a1b2c3d4e5f6a7b8c9d0e2'),
  image: { url: 'http://image.url', publicId: 'playlists/some_image' },
  toString() {
    return this._id.toString();
  },
};

const fakeDefaultImagePlaylist = {
  ...fakePlaylist,
  image: {
    url: DEFAULT_PLAYLIST_IMAGE.url,
    publicId: DEFAULT_PLAYLIST_IMAGE.publicId,
  },
};

const fakePlaylistWithTracks = {
  ...fakePlaylist,
  tracks: [{ _id: 'track_1' }],
};

const fakeUploadResult = {
  url: 'http://new-image.url',
  publicId: 'playlists/new_image',
};

const fakeImageFile = {
  buffer: Buffer.from('fake-image'),
  originalname: 'cover.png',
  mimetype: 'image/png',
} as Express.Multer.File;

const fakeArtistDetails = {
  _id: 'artist_1',
  name: 'Artist Name',
  followers: 500,
};

const fakeArtistId = '64a1b2c3d4e5f6a7b8c9d0e2';
const fakeUserId = '64a1b2c3d4e5f6a7b8c9d0e2';
const fakePlaylistId = '64a1b2c3d4e5f6a7b8c9d0e1';

let service: PlaylistsService;

beforeEach(() => {
  service = new PlaylistsService();
  jest.clearAllMocks();
});

describe('PlaylistsService : findAll', () => {
  it('should return playlists from repository', async () => {
    (PlaylistsRepository.prototype.findAll as jest.Mock).mockResolvedValue([
      fakePlaylist,
    ]);

    const result = await service.findAll(0, 10, fakeUserId);

    expect(result).toEqual([fakePlaylist]);
    expect(PlaylistsRepository.prototype.findAll).toHaveBeenCalledWith(
      10,
      0,
      fakeUserId,
    );
  });

  it('should pass null userId to repository', async () => {
    (PlaylistsRepository.prototype.findAll as jest.Mock).mockResolvedValue([]);

    await service.findAll(0, 10, null);

    expect(PlaylistsRepository.prototype.findAll).toHaveBeenCalledWith(
      10,
      0,
      null,
    );
  });
});

describe('PlaylistsService : findById', () => {
  it('should return playlist with tracks on success', async () => {
    (
      PlaylistsRepository.prototype.findByIdWithTracks as jest.Mock
    ).mockResolvedValue(fakePlaylistWithTracks);

    const result = await service.findById(fakePlaylistId, fakeUserId);

    expect(result).toEqual(fakePlaylistWithTracks);
  });

  it('should throw NotFoundError when repository returns null', async () => {
    (
      PlaylistsRepository.prototype.findByIdWithTracks as jest.Mock
    ).mockResolvedValue(null);

    await expect(service.findById(fakePlaylistId, fakeUserId)).rejects.toThrow(
      'Playlist not found',
    );
  });

  it('should throw ForbiddenError when repository returns blocked error', async () => {
    (
      PlaylistsRepository.prototype.findByIdWithTracks as jest.Mock
    ).mockResolvedValue(
      new Error('You are blocked from accessing this playlist'),
    );

    await expect(service.findById(fakePlaylistId, fakeUserId)).rejects.toThrow(
      'You are blocked from accessing this playlist',
    );

    expect(ForbiddenError).toHaveBeenCalledWith(
      'You are blocked from accessing this playlist',
    );
  });

  it('should throw NotFoundError when repository returns other error', async () => {
    (
      PlaylistsRepository.prototype.findByIdWithTracks as jest.Mock
    ).mockResolvedValue(new Error('Playlist unavailable'));

    await expect(service.findById(fakePlaylistId, fakeUserId)).rejects.toThrow(
      'Playlist unavailable',
    );

    expect(NotFoundError).toHaveBeenCalledWith('Playlist unavailable');
  });
});

describe('PlaylistsService : validateNumberOfPostedPlaylists', () => {
  it('should return early without querying for Pro users', async () => {
    await service.validateNumberOfPostedPlaylists(fakeUserId, 'Pro');

    expect(
      PlaylistsRepository.prototype.findNumberOfPostedPlaylists,
    ).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when user is not found', async () => {
    (
      PlaylistsRepository.prototype.findNumberOfPostedPlaylists as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      service.validateNumberOfPostedPlaylists(fakeUserId, 'Free'),
    ).rejects.toThrow('User not found');
  });

  it('should throw ForbiddenError when user has 3 or more playlists', async () => {
    (
      PlaylistsRepository.prototype.findNumberOfPostedPlaylists as jest.Mock
    ).mockResolvedValue({ playlists: [{}, {}, {}] });

    await expect(
      service.validateNumberOfPostedPlaylists(fakeUserId, 'Free'),
    ).rejects.toThrow(
      'You have reached the maximum number of posted playlists allowed for your subscription. Please upgrade to Pro to post more playlists.',
    );
  });

  it('should not throw when user has fewer than 3 playlists', async () => {
    (
      PlaylistsRepository.prototype.findNumberOfPostedPlaylists as jest.Mock
    ).mockResolvedValue({ playlists: [{}, {}] });

    await expect(
      service.validateNumberOfPostedPlaylists(fakeUserId, 'Free'),
    ).resolves.not.toThrow();
  });
});

describe('PlaylistsService : create', () => {
  it('should return created playlist on success', async () => {
    (
      PlaylistsRepository.prototype.findTrackLengthesByIds as jest.Mock
    ).mockResolvedValue(300);
    (PlaylistsRepository.prototype.create as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );

    const result = await service.create('My Playlist', fakeArtistId, [], false);

    expect(result).toEqual(fakePlaylist);
    expect(PlaylistsRepository.prototype.create).toHaveBeenCalledWith(
      'My Playlist',
      fakeArtistId,
      [],
      false,
      300,
    );
  });

  it('should throw NotFoundError when findTrackLengthesByIds returns an Error', async () => {
    (
      PlaylistsRepository.prototype.findTrackLengthesByIds as jest.Mock
    ).mockResolvedValue(new Error('Track not found'));

    await expect(
      service.create('My Playlist', fakeArtistId, [], false),
    ).rejects.toThrow('Track not found');

    expect(NotFoundError).toHaveBeenCalledWith('Track not found');
  });

  it('should throw BadRequestError when repository throws permaLink error', async () => {
    (
      PlaylistsRepository.prototype.findTrackLengthesByIds as jest.Mock
    ).mockResolvedValue(300);
    (PlaylistsRepository.prototype.create as jest.Mock).mockRejectedValue(
      new Error('duplicate key: permaLink'),
    );

    await expect(
      service.create('My Playlist', fakeArtistId, [], false),
    ).rejects.toThrow('PermaLink taken, please choose another Display Name');
  });

  it('should rethrow non-permaLink errors from repository', async () => {
    (
      PlaylistsRepository.prototype.findTrackLengthesByIds as jest.Mock
    ).mockResolvedValue(300);
    (PlaylistsRepository.prototype.create as jest.Mock).mockRejectedValue(
      new Error('DB connection lost'),
    );

    await expect(
      service.create('My Playlist', fakeArtistId, [], false),
    ).rejects.toThrow('DB connection lost');
  });
});

describe('PlaylistsService : addPlaylistToHistory', () => {
  it('should add playlist to history on success', async () => {
    (PlaylistsRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );
    (
      PlaylistsRepository.prototype.addPlaylistToHistory as jest.Mock
    ).mockResolvedValue(undefined);

    await expect(
      service.addPlaylistToHistory(fakePlaylistId, fakeUserId),
    ).resolves.not.toThrow();

    expect(
      PlaylistsRepository.prototype.addPlaylistToHistory,
    ).toHaveBeenCalledWith(fakeUserId, fakePlaylistId);
  });

  it('should throw NotFoundError when playlist does not exist', async () => {
    (PlaylistsRepository.prototype.findById as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      service.addPlaylistToHistory(fakePlaylistId, fakeUserId),
    ).rejects.toThrow('Playlist not found');

    expect(
      PlaylistsRepository.prototype.addPlaylistToHistory,
    ).not.toHaveBeenCalled();
  });
});

describe('PlaylistsService : addTrackToPlaylist', () => {
  it('should add track to playlist on success', async () => {
    (
      PlaylistsRepository.prototype.addTrackToEndOfPlaylist as jest.Mock
    ).mockResolvedValue(undefined);

    await expect(
      service.addTrackToPlaylist(fakePlaylistId, 'track_1', fakeUserId),
    ).resolves.not.toThrow();

    expect(
      PlaylistsRepository.prototype.addTrackToEndOfPlaylist,
    ).toHaveBeenCalledWith('track_1', fakePlaylistId, fakeUserId);
  });

  it('should throw BadRequestError when repository returns an Error', async () => {
    (
      PlaylistsRepository.prototype.addTrackToEndOfPlaylist as jest.Mock
    ).mockResolvedValue(new Error('Track already in playlist'));

    await expect(
      service.addTrackToPlaylist(fakePlaylistId, 'track_1', fakeUserId),
    ).rejects.toThrow('Track already in playlist');

    expect(BadRequestError).toHaveBeenCalledWith('Track already in playlist');
  });
});

describe('PlaylistsService : removeTrackFromPlaylist', () => {
  it('should remove track from playlist on success', async () => {
    (
      PlaylistsRepository.prototype.removeTrackFromPlaylist as jest.Mock
    ).mockResolvedValue(undefined);

    await expect(
      service.removeTrackFromPlaylist(fakePlaylistId, 'track_1', fakeUserId),
    ).resolves.not.toThrow();

    expect(
      PlaylistsRepository.prototype.removeTrackFromPlaylist,
    ).toHaveBeenCalledWith('track_1', fakePlaylistId, fakeUserId);
  });

  it('should throw BadRequestError when repository returns an Error', async () => {
    (
      PlaylistsRepository.prototype.removeTrackFromPlaylist as jest.Mock
    ).mockResolvedValue(new Error('Track not in playlist'));

    await expect(
      service.removeTrackFromPlaylist(fakePlaylistId, 'track_1', fakeUserId),
    ).rejects.toThrow('Track not in playlist');

    expect(BadRequestError).toHaveBeenCalledWith('Track not in playlist');
  });
});

describe('PlaylistsService : getAlbumsOfAnArtist', () => {
  it('should return albums on success', async () => {
    (
      PlaylistsRepository.prototype.getPlaylistsForArtist as jest.Mock
    ).mockResolvedValue([fakePlaylist]);

    const result = await service.getAlbumsOfAnArtist(fakeArtistId, fakeUserId);

    expect(result).toEqual([fakePlaylist]);
    expect(
      PlaylistsRepository.prototype.getPlaylistsForArtist,
    ).toHaveBeenCalledWith(fakeArtistId, 5, 1, fakeUserId, true);
  });

  it('should throw ForbiddenError when repository returns an Error', async () => {
    (
      PlaylistsRepository.prototype.getPlaylistsForArtist as jest.Mock
    ).mockResolvedValue(new Error('Access denied'));

    await expect(
      service.getAlbumsOfAnArtist(fakeArtistId, fakeUserId),
    ).rejects.toThrow('Access denied');

    expect(ForbiddenError).toHaveBeenCalledWith('Access denied');
  });
});

describe('PlaylistsService : updateImage', () => {
  it('should upload new image, delete old one, and return updated playlist', async () => {
    (PlaylistsRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );
    (CloudinaryService.uploadImage as jest.Mock).mockResolvedValue(
      fakeUploadResult,
    );
    (CloudinaryService.deleteImage as jest.Mock).mockResolvedValue(undefined);
    (PlaylistsRepository.prototype.updateImage as jest.Mock).mockResolvedValue({
      ...fakePlaylist,
      image: fakeUploadResult,
    });

    const result = await service.updateImage(
      fakePlaylistId,
      fakeImageFile,
      fakeUserId,
    );

    expect(CloudinaryService.uploadImage).toHaveBeenCalledWith(
      fakeImageFile.buffer,
      ImageFolder.PLAYLIST,
    );
    expect(CloudinaryService.deleteImage).toHaveBeenCalledWith(
      fakePlaylist.image.publicId,
    );
    expect(PlaylistsRepository.prototype.updateImage).toHaveBeenCalledWith(
      fakePlaylistId,
      fakeUploadResult.url,
      fakeUploadResult.publicId,
      fakeUserId,
    );
    expect(result).toMatchObject({ image: fakeUploadResult });
  });

  it('should NOT delete old image when playlist has the default image', async () => {
    (PlaylistsRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakeDefaultImagePlaylist,
    );
    (CloudinaryService.uploadImage as jest.Mock).mockResolvedValue(
      fakeUploadResult,
    );
    (PlaylistsRepository.prototype.updateImage as jest.Mock).mockResolvedValue({
      ...fakeDefaultImagePlaylist,
      image: fakeUploadResult,
    });

    await service.updateImage(fakePlaylistId, fakeImageFile, fakeUserId);

    expect(CloudinaryService.deleteImage).not.toHaveBeenCalled();
  });

  it('should return early without uploading when imageFile is falsy', async () => {
    (PlaylistsRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );

    const result = await service.updateImage(
      fakePlaylistId,
      null as unknown as Express.Multer.File,
      fakeUserId,
    );

    expect(CloudinaryService.uploadImage).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('should throw NotFoundError when playlist does not exist', async () => {
    (PlaylistsRepository.prototype.findById as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      service.updateImage(fakePlaylistId, fakeImageFile, fakeUserId),
    ).rejects.toThrow('Playlist not found');
  });

  it('should throw ForbiddenError when user is not the playlist owner', async () => {
    (PlaylistsRepository.prototype.findById as jest.Mock).mockResolvedValue({
      ...fakePlaylist,
      artistId: new Types.ObjectId('000000000000000000000001'),
    });

    await expect(
      service.updateImage(fakePlaylistId, fakeImageFile, 'different_user_id'),
    ).rejects.toThrow('This is not your playlist, you cannot update its image');
  });

  it('should throw NotFoundError when updateImage repository returns null', async () => {
    (PlaylistsRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );
    (CloudinaryService.uploadImage as jest.Mock).mockResolvedValue(
      fakeUploadResult,
    );
    (CloudinaryService.deleteImage as jest.Mock).mockResolvedValue(undefined);
    (PlaylistsRepository.prototype.updateImage as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      service.updateImage(fakePlaylistId, fakeImageFile, fakeUserId),
    ).rejects.toThrow('Playlist not found for updating');
  });
});

describe('PlaylistsService : getByPermalink', () => {
  it('should return playlist on success', async () => {
    (
      PlaylistsRepository.prototype.findByPermalink as jest.Mock
    ).mockResolvedValue(fakePlaylistWithTracks);

    const result = await service.getByPermalink('my-playlist', fakeUserId);

    expect(result).toEqual(fakePlaylistWithTracks);
  });

  it('should throw NotFoundError when repository returns null', async () => {
    (
      PlaylistsRepository.prototype.findByPermalink as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      service.getByPermalink('my-playlist', fakeUserId),
    ).rejects.toThrow('Playlist not found');
  });

  it('should throw ForbiddenError when repository returns blocked error', async () => {
    (
      PlaylistsRepository.prototype.findByPermalink as jest.Mock
    ).mockResolvedValue(
      new Error('You are blocked from accessing this playlist'),
    );

    await expect(
      service.getByPermalink('my-playlist', fakeUserId),
    ).rejects.toThrow('You are blocked from accessing this playlist');

    expect(ForbiddenError).toHaveBeenCalledWith(
      'You are blocked from accessing this playlist',
    );
  });

  it('should throw NotFoundError when repository returns another error', async () => {
    (
      PlaylistsRepository.prototype.findByPermalink as jest.Mock
    ).mockResolvedValue(new Error('Playlist is deleted'));

    await expect(
      service.getByPermalink('my-playlist', fakeUserId),
    ).rejects.toThrow('Playlist is deleted');

    expect(NotFoundError).toHaveBeenCalledWith('Playlist is deleted');
  });
});

describe('PlaylistsService : getByPermaLinkAndProfileLink', () => {
  it('should return playlist on success', async () => {
    (
      PlaylistsRepository.prototype.getUserIdByProfileLink as jest.Mock
    ).mockResolvedValue('owner_user_id');
    (
      PlaylistsRepository.prototype.findByPermalinkWithProfileLink as jest.Mock
    ).mockResolvedValue(fakePlaylistWithTracks);

    const result = await service.getByPermaLinkAndProfileLink(
      'my-playlist',
      'user-profile',
      fakeUserId,
    );

    expect(result).toEqual(fakePlaylistWithTracks);
    expect(
      PlaylistsRepository.prototype.findByPermalinkWithProfileLink,
    ).toHaveBeenCalledWith('my-playlist', 'owner_user_id', fakeUserId, 1, 5);
  });

  it('should throw NotFoundError when profile is not found', async () => {
    (
      PlaylistsRepository.prototype.getUserIdByProfileLink as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      service.getByPermaLinkAndProfileLink(
        'my-playlist',
        'user-profile',
        fakeUserId,
      ),
    ).rejects.toThrow('Profile not found');

    expect(
      PlaylistsRepository.prototype.findByPermalinkWithProfileLink,
    ).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when playlist is not found', async () => {
    (
      PlaylistsRepository.prototype.getUserIdByProfileLink as jest.Mock
    ).mockResolvedValue('owner_user_id');
    (
      PlaylistsRepository.prototype.findByPermalinkWithProfileLink as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      service.getByPermaLinkAndProfileLink(
        'my-playlist',
        'user-profile',
        fakeUserId,
      ),
    ).rejects.toThrow('Playlist not found');
  });

  it('should throw ForbiddenError when playlist returns blocked error', async () => {
    (
      PlaylistsRepository.prototype.getUserIdByProfileLink as jest.Mock
    ).mockResolvedValue('owner_user_id');
    (
      PlaylistsRepository.prototype.findByPermalinkWithProfileLink as jest.Mock
    ).mockResolvedValue(
      new Error('You are blocked from accessing this playlist'),
    );

    await expect(
      service.getByPermaLinkAndProfileLink(
        'my-playlist',
        'user-profile',
        fakeUserId,
      ),
    ).rejects.toThrow('You are blocked from accessing this playlist');

    expect(ForbiddenError).toHaveBeenCalledWith(
      'You are blocked from accessing this playlist',
    );
  });

  it('should throw NotFoundError when playlist returns another error', async () => {
    (
      PlaylistsRepository.prototype.getUserIdByProfileLink as jest.Mock
    ).mockResolvedValue('owner_user_id');
    (
      PlaylistsRepository.prototype.findByPermalinkWithProfileLink as jest.Mock
    ).mockResolvedValue(new Error('Playlist is private'));

    await expect(
      service.getByPermaLinkAndProfileLink(
        'my-playlist',
        'user-profile',
        fakeUserId,
      ),
    ).rejects.toThrow('Playlist is private');

    expect(NotFoundError).toHaveBeenCalledWith('Playlist is private');
  });
});

describe('PlaylistsService : getArtistDetails', () => {
  it('should return artist details on success', async () => {
    (
      PlaylistsRepository.prototype.getArtistDetails as jest.Mock
    ).mockResolvedValue(fakeArtistDetails);

    const result = await service.getArtistDetails(fakeArtistId, fakeUserId);

    expect(result).toEqual(fakeArtistDetails);
    expect(PlaylistsRepository.prototype.getArtistDetails).toHaveBeenCalledWith(
      fakeArtistId,
      fakeUserId,
    );
  });

  it('should throw NotFoundError when artist is not found', async () => {
    (
      PlaylistsRepository.prototype.getArtistDetails as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      service.getArtistDetails(fakeArtistId, fakeUserId),
    ).rejects.toThrow('Artist not found');
  });
});

describe('PlaylistsService : getMorePlaylistsFromArtist', () => {
  it('should return playlists on success', async () => {
    (
      PlaylistsRepository.prototype.getMorePlaylistsFromSameArtist as jest.Mock
    ).mockResolvedValue([fakePlaylist]);

    const result = await service.getMorePlaylistsFromArtist(
      fakeArtistId,
      fakePlaylistId,
      fakeUserId,
    );

    expect(result).toEqual([fakePlaylist]);
    expect(
      PlaylistsRepository.prototype.getMorePlaylistsFromSameArtist,
    ).toHaveBeenCalledWith(fakeArtistId, fakePlaylistId, fakeUserId);
  });

  it('should throw NotFoundError when repository returns an Error', async () => {
    (
      PlaylistsRepository.prototype.getMorePlaylistsFromSameArtist as jest.Mock
    ).mockResolvedValue(new Error('Artist not found'));

    await expect(
      service.getMorePlaylistsFromArtist(
        fakeArtistId,
        fakePlaylistId,
        fakeUserId,
      ),
    ).rejects.toThrow('Artist not found');

    expect(NotFoundError).toHaveBeenCalledWith('Artist not found');
  });
});

describe('PlaylistsService : getMyPlaylists', () => {
  it('should return playlists on success', async () => {
    (
      PlaylistsRepository.prototype.getMyPlaylists as jest.Mock
    ).mockResolvedValue([fakePlaylist]);

    const result = await service.getMyPlaylists(fakeArtistId, 1, 5);

    expect(result).toEqual([fakePlaylist]);
    expect(PlaylistsRepository.prototype.getMyPlaylists).toHaveBeenCalledWith(
      fakeArtistId,
      1,
      5,
    );
  });

  it('should throw BadRequestError when artistId is falsy', async () => {
    await expect(service.getMyPlaylists('', 1, 5)).rejects.toThrow(
      'Artist Id is required to fetch playlists',
    );

    expect(PlaylistsRepository.prototype.getMyPlaylists).not.toHaveBeenCalled();
  });
});

describe('PlaylistsService : getPlaylistsForArtist', () => {
  it('should return playlists on success', async () => {
    (
      PlaylistsRepository.prototype.getPlaylistsForArtist as jest.Mock
    ).mockResolvedValue([fakePlaylist]);

    const result = await service.getPlaylistsForArtist(
      fakeArtistId,
      1,
      5,
      fakeUserId,
    );

    expect(result).toEqual([fakePlaylist]);
    expect(
      PlaylistsRepository.prototype.getPlaylistsForArtist,
    ).toHaveBeenCalledWith(fakeArtistId, 1, 5, fakeUserId);
  });

  it('should throw ForbiddenError when repository returns an Error', async () => {
    (
      PlaylistsRepository.prototype.getPlaylistsForArtist as jest.Mock
    ).mockResolvedValue(new Error('Artist is private'));

    await expect(
      service.getPlaylistsForArtist(fakeArtistId, 1, 5, fakeUserId),
    ).rejects.toThrow('Artist is private');

    expect(ForbiddenError).toHaveBeenCalledWith('Artist is private');
  });
});

describe('PlaylistsService : updateOrderOfSingleTrack', () => {
  it('should return true on success', async () => {
    (
      PlaylistsRepository.prototype.updateOrderOfSignleTrack as jest.Mock
    ).mockResolvedValue(true);

    const result = await service.updateOrderOfSingleTrack(
      fakePlaylistId,
      'track_1',
      0,
      2,
      fakeUserId,
    );

    expect(result).toBe(true);
    expect(
      PlaylistsRepository.prototype.updateOrderOfSignleTrack,
    ).toHaveBeenCalledWith(fakePlaylistId, 'track_1', 0, 2, fakeUserId);
  });

  it('should throw ForbiddenError when user is not the playlist owner', async () => {
    (
      PlaylistsRepository.prototype.updateOrderOfSignleTrack as jest.Mock
    ).mockResolvedValue(
      new Error('You are not the owner of this playlist, you cannot update it'),
    );

    await expect(
      service.updateOrderOfSingleTrack(
        fakePlaylistId,
        'track_1',
        0,
        2,
        fakeUserId,
      ),
    ).rejects.toThrow(
      'You are not the owner of this playlist, you cannot update it',
    );

    expect(ForbiddenError).toHaveBeenCalledWith(
      'You are not the owner of this playlist, you cannot update it',
    );
  });

  it('should throw BadRequestError for other errors from repository', async () => {
    (
      PlaylistsRepository.prototype.updateOrderOfSignleTrack as jest.Mock
    ).mockResolvedValue(new Error('Invalid track position'));

    await expect(
      service.updateOrderOfSingleTrack(
        fakePlaylistId,
        'track_1',
        0,
        99,
        fakeUserId,
      ),
    ).rejects.toThrow('Invalid track position');

    expect(BadRequestError).toHaveBeenCalledWith('Invalid track position');
  });
});

describe('PlaylistsService : delete', () => {
  it('should return true when deletion is successful', async () => {
    (PlaylistsRepository.prototype.delete as jest.Mock).mockResolvedValue(true);

    const result = await service.delete(fakePlaylistId, fakeUserId);

    expect(result).toBe(true);
    expect(PlaylistsRepository.prototype.delete).toHaveBeenCalledWith(
      fakePlaylistId,
      fakeUserId,
    );
  });

  it('should throw NotFoundError when repository returns an Error', async () => {
    (PlaylistsRepository.prototype.delete as jest.Mock).mockResolvedValue(
      new Error('Playlist not found'),
    );

    await expect(service.delete(fakePlaylistId, fakeUserId)).rejects.toThrow(
      'Playlist not found',
    );

    expect(NotFoundError).toHaveBeenCalledWith('Playlist not found');
  });
});

describe('PlaylistsService : updatePlaylist', () => {
  const fakeUpdateInput = {
    params: { id: fakePlaylistId },
    body: { permalink: 'my-playlist' },
    imageFile: fakeImageFile,
  };

  beforeEach(() => {
    (PlaylistsRepository.prototype.findById as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );
    (CloudinaryService.uploadImage as jest.Mock).mockResolvedValue(
      fakeUploadResult,
    );
    (CloudinaryService.deleteImage as jest.Mock).mockResolvedValue(undefined);
    (PlaylistsRepository.prototype.updateImage as jest.Mock).mockResolvedValue({
      ...fakePlaylist,
      image: fakeUploadResult,
    });
  });

  it('should return true on success', async () => {
    (
      PlaylistsRepository.prototype.isPlaylsitPermalinkTaken as jest.Mock
    ).mockResolvedValue(false);
    (
      PlaylistsRepository.prototype.updatePlaylist as jest.Mock
    ).mockResolvedValue({ ok: 1 });

    const result = await service.updatePlaylist(
      fakeUpdateInput as any,
      fakeUserId,
    );

    expect(result).toBe(true);
  });

  it('should throw BadRequestError when permalink is already taken', async () => {
    (
      PlaylistsRepository.prototype.isPlaylsitPermalinkTaken as jest.Mock
    ).mockResolvedValue(true);

    await expect(
      service.updatePlaylist(fakeUpdateInput as any, fakeUserId),
    ).rejects.toThrow('Playlist permalink is already taken');

    expect(PlaylistsRepository.prototype.updatePlaylist).not.toHaveBeenCalled();
  });

  it('should throw ForbiddenError when user is not the playlist owner', async () => {
    (
      PlaylistsRepository.prototype.isPlaylsitPermalinkTaken as jest.Mock
    ).mockResolvedValue(false);
    (
      PlaylistsRepository.prototype.updatePlaylist as jest.Mock
    ).mockResolvedValue(new Error('You are not the owner of this playlist'));

    await expect(
      service.updatePlaylist(fakeUpdateInput as any, fakeUserId),
    ).rejects.toThrow('You are not the owner of this playlist');

    expect(ForbiddenError).toHaveBeenCalledWith(
      'You are not the owner of this playlist',
    );
  });

  it('should throw BadRequestError when repository returns a permaLink error', async () => {
    (
      PlaylistsRepository.prototype.isPlaylsitPermalinkTaken as jest.Mock
    ).mockResolvedValue(false);
    (
      PlaylistsRepository.prototype.updatePlaylist as jest.Mock
    ).mockResolvedValue(new Error('duplicate key: permaLink'));

    await expect(
      service.updatePlaylist(fakeUpdateInput as any, fakeUserId),
    ).rejects.toThrow('duplicate key: permaLink');

    expect(BadRequestError).toHaveBeenCalledWith('duplicate key: permaLink');
  });

  it('should throw NotFoundError when repository returns another error', async () => {
    (
      PlaylistsRepository.prototype.isPlaylsitPermalinkTaken as jest.Mock
    ).mockResolvedValue(false);
    (
      PlaylistsRepository.prototype.updatePlaylist as jest.Mock
    ).mockResolvedValue(new Error('Playlist does not exist'));

    await expect(
      service.updatePlaylist(fakeUpdateInput as any, fakeUserId),
    ).rejects.toThrow('Playlist does not exist');

    expect(NotFoundError).toHaveBeenCalledWith('Playlist does not exist');
  });
});
