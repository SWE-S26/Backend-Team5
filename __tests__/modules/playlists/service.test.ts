import { PlaylistsService } from '../../../src/modules/playlists/playlists.service';
import { PlaylistsRepository } from '../../../src/modules/playlists/playlists.repository';
import { CloudinaryService } from '../../../src/shared/abstractions/cloudinary.service';

jest.mock('../../../src/modules/playlists/playlists.repository');
jest.mock('../../../src/shared/abstractions/cloudinary.service', () => ({
  CloudinaryService: {
    uploadImage: jest.fn(),
    deleteImage: jest.fn(),
  },
  ImageFolder: { PLAYLIST: 'PLAYLIST' },
}));
jest.mock('../../../src/config/constants', () => ({
  DEFAULT_PLAYLIST_IMAGE: { publicId: 'default_playlist_image' },
}));

const ID = {
  user1: 'aaaaaaaaaaaaaaaaaaaaaaaa',
  user2: 'bbbbbbbbbbbbbbbbbbbbbbbb',
  artist1: 'cccccccccccccccccccccccc',
  playlist1: 'dddddddddddddddddddddddd',
  playlist2: 'eeeeeeeeeeeeeeeeeeeeeeee',
  track1: 'ffffffffffffffffffffffff',
  track2: '111111111111111111111111',
};

const makeFile = (
  extra: Partial<Express.Multer.File> = {},
): Express.Multer.File =>
  ({
    buffer: Buffer.from('img'),
    originalname: 'cover.jpg',
    mimetype: 'image/jpeg',
    ...extra,
  }) as Express.Multer.File;

const makePlaylist = (overrides: Record<string, any> = {}) => ({
  _id: { toString: () => ID.playlist1 },
  artistId: { toString: () => ID.artist1 },
  title: 'Test Playlist',
  image: { publicId: 'some_public_id', imgLink: 'http://img.url' },
  listOfTracks: [],
  ...overrides,
});

describe('PlaylistsService - FULL TEST', () => {
  let service: PlaylistsService;
  let repo: jest.Mocked<PlaylistsRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlaylistsService();
    repo = (PlaylistsRepository as jest.MockedClass<typeof PlaylistsRepository>)
      .mock.instances[0] as jest.Mocked<PlaylistsRepository>;
  });

  describe('findAll', () => {
    it('delegates to repository with swapped limit/offset', async () => {
      repo.findAll.mockResolvedValue([makePlaylist()] as any);

      const result = await service.findAll(2, 10, ID.user1);

      expect(repo.findAll).toHaveBeenCalledWith(10, 2, ID.user1);
      expect(result).toHaveLength(1);
    });

    it('passes null userId', async () => {
      repo.findAll.mockResolvedValue([]);

      await service.findAll(1, 5, null);

      expect(repo.findAll).toHaveBeenCalledWith(5, 1, null);
    });
  });

  describe('findById', () => {
    it('returns playlist when found', async () => {
      const pl = makePlaylist();
      repo.findByIdWithTracks.mockResolvedValue(pl as any);

      const result = await service.findById(ID.playlist1, ID.user1);

      expect(result).toEqual(pl);
    });

    it('throws NotFoundError when result is null', async () => {
      repo.findByIdWithTracks.mockResolvedValue(null);

      await expect(service.findById(ID.playlist1, null)).rejects.toMatchObject({
        message: 'Playlist not found',
      });
    });

    it('throws ForbiddenError when user is blocked', async () => {
      repo.findByIdWithTracks.mockResolvedValue(
        new Error('You are blocked from accessing this playlist'),
      );

      await expect(
        service.findById(ID.playlist1, ID.user1),
      ).rejects.toMatchObject({
        message: 'You are blocked from accessing this playlist',
      });
    });

    it('throws NotFoundError for other errors from repository', async () => {
      repo.findByIdWithTracks.mockResolvedValue(new Error('some other error'));

      await expect(
        service.findById(ID.playlist1, ID.user1),
      ).rejects.toMatchObject({ message: 'some other error' });
    });
  });

  describe('validateNumberOfPostedPlaylists', () => {
    it('returns immediately when role is Pro', async () => {
      await service.validateNumberOfPostedPlaylists(ID.user1, 'Pro');

      expect(repo.findNumberOfPostedPlaylists).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when user not found', async () => {
      repo.findNumberOfPostedPlaylists.mockResolvedValue(null);

      await expect(
        service.validateNumberOfPostedPlaylists(ID.user1, 'Free'),
      ).rejects.toMatchObject({ message: 'User not found' });
    });

    it('throws ForbiddenError when playlist limit reached', async () => {
      repo.findNumberOfPostedPlaylists.mockResolvedValue({
        _id: ID.user1 as any,
        playlists: [ID.playlist1, ID.playlist2, 'another'] as any,
      });

      await expect(
        service.validateNumberOfPostedPlaylists(ID.user1, 'Free'),
      ).rejects.toMatchObject({
        message: expect.stringContaining('maximum number'),
      });
    });

    it('passes when user has fewer than 3 playlists', async () => {
      repo.findNumberOfPostedPlaylists.mockResolvedValue({
        _id: ID.user1 as any,
        playlists: [ID.playlist1] as any,
      });

      await expect(
        service.validateNumberOfPostedPlaylists(ID.user1, 'Free'),
      ).resolves.toBeUndefined();
    });
  });

  describe('create', () => {
    it('creates playlist successfully', async () => {
      repo.findTrackLengthesByIds.mockResolvedValue(300);
      repo.create.mockResolvedValue(makePlaylist() as any);

      const result = await service.create(
        'My Playlist',
        ID.artist1,
        [ID.track1],
        false,
      );

      expect(repo.findTrackLengthesByIds).toHaveBeenCalledWith([ID.track1]);
      expect(repo.create).toHaveBeenCalledWith(
        'My Playlist',
        ID.artist1,
        [ID.track1],
        false,
        300,
      );
      expect(result).toBeDefined();
    });

    it('throws NotFoundError when tracks not found', async () => {
      repo.findTrackLengthesByIds.mockResolvedValue(
        new Error('One or more tracks not found'),
      );

      await expect(
        service.create('My Playlist', ID.artist1, [ID.track1], false),
      ).rejects.toMatchObject({ message: 'One or more tracks not found' });
    });

    it('throws BadRequestError when permalink is taken', async () => {
      repo.findTrackLengthesByIds.mockResolvedValue(300);
      repo.create.mockRejectedValue(
        new Error('Playlist permaLink is already taken'),
      );

      await expect(
        service.create('My Playlist', ID.artist1, [], false),
      ).rejects.toMatchObject({
        message: expect.stringContaining('PermaLink taken'),
      });
    });

    it('rethrows unknown errors from create', async () => {
      repo.findTrackLengthesByIds.mockResolvedValue(300);
      repo.create.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        service.create('My Playlist', ID.artist1, [], false),
      ).rejects.toThrow('DB connection lost');
    });
  });

  describe('createPlaylistWithImage', () => {
    const input = (overrides = {}) => ({
      body: {
        title: 'Image Playlist',
        description: 'desc',
        listOfTracks: [ID.track1],
        isPrivate: false,
        ...overrides,
      },
      imageFile: makeFile(),
    });

    it('creates playlist with image successfully', async () => {
      repo.findTrackLengthesByIds.mockResolvedValue(200);
      (CloudinaryService.uploadImage as jest.Mock).mockResolvedValue({
        url: 'http://cdn.url/img',
        publicId: 'new_public_id',
      });
      const pl = makePlaylist();
      repo.createWithImage.mockResolvedValue(pl as any);
      repo.findById.mockResolvedValue(pl as any);
      repo.updateImage.mockResolvedValue(pl as any);

      const result = await service.createPlaylistWithImage(
        input() as any,
        ID.artist1,
      );

      expect(CloudinaryService.uploadImage).toHaveBeenCalled();
      expect(repo.createWithImage).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws NotFoundError when tracks not found', async () => {
      repo.findTrackLengthesByIds.mockResolvedValue(
        new Error('tracks missing'),
      );

      await expect(
        service.createPlaylistWithImage(input() as any, ID.artist1),
      ).rejects.toMatchObject({ message: 'tracks missing' });
    });

    it('cleans up uploaded image and throws BadRequestError on permaLink error', async () => {
      repo.findTrackLengthesByIds.mockResolvedValue(200);
      (CloudinaryService.uploadImage as jest.Mock).mockResolvedValue({
        url: 'url',
        publicId: 'cleanup_id',
      });
      repo.createWithImage.mockRejectedValue(
        new Error('Playlist permaLink is already taken'),
      );

      await expect(
        service.createPlaylistWithImage(input() as any, ID.artist1),
      ).rejects.toMatchObject({
        message: expect.stringContaining('PermaLink taken'),
      });

      expect(CloudinaryService.deleteImage).toHaveBeenCalledWith('cleanup_id');
    });

    it('uses empty string description when not provided', async () => {
      repo.findTrackLengthesByIds.mockResolvedValue(200);
      (CloudinaryService.uploadImage as jest.Mock).mockResolvedValue({
        url: 'url',
        publicId: 'pid',
      });
      const pl = makePlaylist();
      repo.createWithImage.mockResolvedValue(pl as any);
      repo.findById.mockResolvedValue(pl as any);
      repo.updateImage.mockResolvedValue(pl as any);

      await service.createPlaylistWithImage(
        input({ description: undefined }) as any,
        ID.artist1,
      );

      expect(repo.createWithImage).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        '',
      );
    });
  });

  describe('addPlaylistToHistory', () => {
    it('adds playlist to history successfully', async () => {
      repo.findById.mockResolvedValue(makePlaylist() as any);
      repo.addPlaylistToHistory.mockResolvedValue(undefined);

      await service.addPlaylistToHistory(ID.playlist1, ID.user1);

      expect(repo.addPlaylistToHistory).toHaveBeenCalledWith(
        ID.playlist1,
        ID.user1,
      );
    });

    it('throws NotFoundError when playlist does not exist', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.addPlaylistToHistory(ID.playlist1, ID.user1),
      ).rejects.toMatchObject({ message: 'Playlist not found' });
    });
  });

  describe('addTrackToPlaylist', () => {
    it('adds track successfully', async () => {
      repo.addTrackToEndOfPlaylist.mockResolvedValue(undefined);

      await service.addTrackToPlaylist(ID.playlist1, ID.track1, ID.user1);

      expect(repo.addTrackToEndOfPlaylist).toHaveBeenCalledWith(
        ID.track1,
        ID.playlist1,
        ID.user1,
      );
    });

    it('throws BadRequestError when repository returns an Error', async () => {
      repo.addTrackToEndOfPlaylist.mockResolvedValue(
        new Error('Track already exists in the playlist'),
      );

      await expect(
        service.addTrackToPlaylist(ID.playlist1, ID.track1, ID.user1),
      ).rejects.toMatchObject({
        message: 'Track already exists in the playlist',
      });
    });
  });

  describe('getAlbumsOfAnArtist', () => {
    it('returns albums successfully', async () => {
      repo.getPlaylistsForArtist.mockResolvedValue([makePlaylist()] as any);

      const result = await service.getAlbumsOfAnArtist(ID.artist1, ID.user1);

      expect(repo.getPlaylistsForArtist).toHaveBeenCalledWith(
        ID.artist1,
        5,
        1,
        ID.user1,
        true,
      );
      expect(result).toHaveLength(1);
    });

    it('throws ForbiddenError when user is blocked', async () => {
      repo.getPlaylistsForArtist.mockResolvedValue(
        new Error('You are blocked from accessing this artist'),
      );

      await expect(
        service.getAlbumsOfAnArtist(ID.artist1, ID.user1),
      ).rejects.toMatchObject({
        message: 'You are blocked from accessing this artist',
      });
    });
  });

  describe('updatePlaylist', () => {
    const makeInput = (overrides: Record<string, any> = {}) => ({
      params: { id: ID.playlist1 },
      body: { permalink: 'my-playlist', listOfTracks: [ID.track1] },
      imageFile: undefined,
      ...overrides,
    });

    it('updates playlist successfully without image', async () => {
      repo.isPlaylsitPermalinkTaken.mockResolvedValue(false);
      repo.updatePlaylist.mockResolvedValue(true);
      repo.findById.mockResolvedValue(makePlaylist() as any);

      const result = await service.updatePlaylist(
        makeInput() as any,
        ID.artist1,
      );

      expect(result).toBe(true);
    });

    it('throws BadRequestError when permalink is taken', async () => {
      repo.isPlaylsitPermalinkTaken.mockResolvedValue(true);

      await expect(
        service.updatePlaylist(makeInput() as any, ID.artist1),
      ).rejects.toMatchObject({
        message: 'Playlist permalink is already taken',
      });
    });

    it('throws ForbiddenError when not the owner', async () => {
      repo.isPlaylsitPermalinkTaken.mockResolvedValue(false);
      repo.updatePlaylist.mockResolvedValue(
        new Error('You are not the owner of this playlist'),
      );

      await expect(
        service.updatePlaylist(makeInput() as any, ID.artist1),
      ).rejects.toMatchObject({
        message: 'You are not the owner of this playlist',
      });
    });

    it('throws BadRequestError for permaLink error from repository', async () => {
      repo.isPlaylsitPermalinkTaken.mockResolvedValue(false);
      repo.updatePlaylist.mockResolvedValue(
        new Error('permaLink already taken'),
      );

      await expect(
        service.updatePlaylist(makeInput() as any, ID.artist1),
      ).rejects.toMatchObject({ message: 'permaLink already taken' });
    });

    it('throws NotFoundError for other errors from repository', async () => {
      repo.isPlaylsitPermalinkTaken.mockResolvedValue(false);
      repo.updatePlaylist.mockResolvedValue(
        new Error('One or more tracks not found'),
      );

      await expect(
        service.updatePlaylist(makeInput() as any, ID.artist1),
      ).rejects.toMatchObject({ message: 'One or more tracks not found' });
    });

    it('calls updateImage after a successful update when imageFile provided', async () => {
      const pl = makePlaylist({ artistId: { toString: () => ID.artist1 } });
      repo.isPlaylsitPermalinkTaken.mockResolvedValue(false);
      repo.updatePlaylist.mockResolvedValue(true);
      repo.findById.mockResolvedValue(pl as any);
      (CloudinaryService.uploadImage as jest.Mock).mockResolvedValue({
        url: 'url',
        publicId: 'newPid',
      });
      repo.updateImage.mockResolvedValue(pl as any);

      await service.updatePlaylist(
        makeInput({ imageFile: makeFile() }) as any,
        ID.artist1,
      );

      expect(CloudinaryService.uploadImage).toHaveBeenCalled();
      expect(repo.updateImage).toHaveBeenCalled();
    });
  });

  describe('getByPermaLinkAndProfileLink', () => {
    it('returns playlist successfully', async () => {
      repo.getUserIdByProfileLink.mockResolvedValue(ID.user1);
      repo.findByPermalinkWithProfileLink.mockResolvedValue(
        makePlaylist() as any,
      );

      const result = await service.getByPermaLinkAndProfileLink(
        'my-playlist',
        'ahmed',
        ID.user2,
      );

      expect(result).toBeDefined();
    });

    it('throws NotFoundError when profile link not found', async () => {
      repo.getUserIdByProfileLink.mockResolvedValue(null);

      await expect(
        service.getByPermaLinkAndProfileLink('my-playlist', 'nobody', null),
      ).rejects.toMatchObject({ message: 'Profile not found' });
    });

    it('throws NotFoundError when playlist not found', async () => {
      repo.getUserIdByProfileLink.mockResolvedValue(ID.user1);
      repo.findByPermalinkWithProfileLink.mockResolvedValue(null);

      await expect(
        service.getByPermaLinkAndProfileLink('my-playlist', 'ahmed', null),
      ).rejects.toMatchObject({ message: 'Playlist not found' });
    });

    it('throws ForbiddenError when user is blocked', async () => {
      repo.getUserIdByProfileLink.mockResolvedValue(ID.user1);
      repo.findByPermalinkWithProfileLink.mockResolvedValue(
        new Error('You are blocked from accessing this playlist'),
      );

      await expect(
        service.getByPermaLinkAndProfileLink('my-playlist', 'ahmed', ID.user2),
      ).rejects.toMatchObject({
        message: 'You are blocked from accessing this playlist',
      });
    });

    it('throws NotFoundError for other errors', async () => {
      repo.getUserIdByProfileLink.mockResolvedValue(ID.user1);
      repo.findByPermalinkWithProfileLink.mockResolvedValue(
        new Error('some other error'),
      );

      await expect(
        service.getByPermaLinkAndProfileLink('my-playlist', 'ahmed', ID.user2),
      ).rejects.toMatchObject({ message: 'some other error' });
    });
  });

  describe('updateImage', () => {
    it('returns early when no imageFile provided', async () => {
      repo.findById.mockResolvedValue(makePlaylist() as any);

      const result = await service.updateImage(
        ID.playlist1,
        undefined as any,
        ID.artist1,
      );

      expect(result).toBeUndefined();
      expect(CloudinaryService.uploadImage).not.toHaveBeenCalled();
    });

    it('throws NotFoundError when playlist not found', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.updateImage(ID.playlist1, makeFile(), ID.artist1),
      ).rejects.toMatchObject({ message: 'Playlist not found' });
    });

    it('throws ForbiddenError when wrong user tries to update', async () => {
      repo.findById.mockResolvedValue(
        makePlaylist({ artistId: { toString: () => ID.artist1 } }) as any,
      );

      await expect(
        service.updateImage(ID.playlist1, makeFile(), ID.user2),
      ).rejects.toMatchObject({
        message: 'This is not your playlist, you cannot update its image',
      });
    });

    it('uploads image and skips deleting the default image', async () => {
      repo.findById.mockResolvedValue(
        makePlaylist({
          artistId: { toString: () => ID.artist1 },
          image: { publicId: 'default_playlist_image' },
        }) as any,
      );
      (CloudinaryService.uploadImage as jest.Mock).mockResolvedValue({
        url: 'url',
        publicId: 'new_pid',
      });
      repo.updateImage.mockResolvedValue(makePlaylist() as any);

      await service.updateImage(ID.playlist1, makeFile(), ID.artist1);

      expect(CloudinaryService.deleteImage).not.toHaveBeenCalled();
      expect(repo.updateImage).toHaveBeenCalled();
    });

    it('uploads image and deletes old non-default image', async () => {
      repo.findById.mockResolvedValue(
        makePlaylist({
          artistId: { toString: () => ID.artist1 },
          image: { publicId: 'old_custom_image' },
        }) as any,
      );
      (CloudinaryService.uploadImage as jest.Mock).mockResolvedValue({
        url: 'url',
        publicId: 'new_pid',
      });
      repo.updateImage.mockResolvedValue(makePlaylist() as any);

      await service.updateImage(ID.playlist1, makeFile(), ID.artist1);

      expect(CloudinaryService.deleteImage).toHaveBeenCalledWith(
        'old_custom_image',
      );
    });

    it('throws NotFoundError when updateImage returns null', async () => {
      repo.findById.mockResolvedValue(
        makePlaylist({ artistId: { toString: () => ID.artist1 } }) as any,
      );
      (CloudinaryService.uploadImage as jest.Mock).mockResolvedValue({
        url: 'url',
        publicId: 'pid',
      });
      repo.updateImage.mockResolvedValue(null as any);

      await expect(
        service.updateImage(ID.playlist1, makeFile(), ID.artist1),
      ).rejects.toMatchObject({ message: 'Playlist not found for updating' });
    });
  });

  describe('getArtistDetails', () => {
    it('returns artist details successfully', async () => {
      repo.getArtistDetails.mockResolvedValue({
        displayName: 'Ahmed',
        profileLink: 'ahmed',
        profileImage: 'img.png',
        followersCount: 5,
        isFollowed: false,
      });

      const result = await service.getArtistDetails(ID.artist1, ID.user1);

      expect(result).toMatchObject({ displayName: 'Ahmed' });
    });

    it('throws NotFoundError when artist not found', async () => {
      repo.getArtistDetails.mockResolvedValue(null);

      await expect(
        service.getArtistDetails(ID.artist1, null),
      ).rejects.toMatchObject({ message: 'Artist not found' });
    });
  });

  describe('getMorePlaylistsFromArtist', () => {
    it('returns playlists successfully', async () => {
      repo.getMorePlaylistsFromSameArtist.mockResolvedValue([
        makePlaylist(),
      ] as any);

      const result = await service.getMorePlaylistsFromArtist(
        ID.artist1,
        ID.playlist1,
        ID.user1,
      );

      expect(result).toHaveLength(1);
    });

    it('throws NotFoundError when user is blocked', async () => {
      repo.getMorePlaylistsFromSameArtist.mockResolvedValue(
        new Error('You are blocked from accessing this artist'),
      );

      await expect(
        service.getMorePlaylistsFromArtist(ID.artist1, ID.playlist1, ID.user1),
      ).rejects.toMatchObject({
        message: 'You are blocked from accessing this artist',
      });
    });
  });

  describe('getMyPlaylists', () => {
    it('returns playlists successfully', async () => {
      repo.getMyPlaylists.mockResolvedValue([makePlaylist()] as any);

      const result = await service.getMyPlaylists(ID.artist1, 1, 5);

      expect(result).toHaveLength(1);
    });

    it('throws BadRequestError when artistId is empty', async () => {
      await expect(service.getMyPlaylists('', 1, 5)).rejects.toMatchObject({
        message: 'Artist Id is required to fetch playlists',
      });
    });
  });

  describe('getPlaylistsForArtist', () => {
    it('returns playlists successfully', async () => {
      repo.getPlaylistsForArtist.mockResolvedValue([makePlaylist()] as any);

      const result = await service.getPlaylistsForArtist(
        ID.artist1,
        1,
        5,
        ID.user1,
      );

      expect(result).toHaveLength(1);
    });

    it('throws ForbiddenError when user is blocked', async () => {
      repo.getPlaylistsForArtist.mockResolvedValue(
        new Error('You are blocked from accessing this artist'),
      );

      await expect(
        service.getPlaylistsForArtist(ID.artist1, 1, 5, ID.user1),
      ).rejects.toMatchObject({
        message: 'You are blocked from accessing this artist',
      });
    });
  });

  describe('updateOrderOfSingleTrack', () => {
    it('reorders track successfully', async () => {
      repo.updateOrderOfSignleTrack.mockResolvedValue(true);

      const result = await service.updateOrderOfSingleTrack(
        ID.playlist1,
        ID.track1,
        0,
        2,
        ID.user1,
      );

      expect(result).toBe(true);
    });

    it('throws ForbiddenError when not owner', async () => {
      repo.updateOrderOfSignleTrack.mockResolvedValue(
        new Error(
          'You are not the owner of this playlist, you cannot update it',
        ),
      );

      await expect(
        service.updateOrderOfSingleTrack(
          ID.playlist1,
          ID.track1,
          0,
          2,
          ID.user1,
        ),
      ).rejects.toMatchObject({
        message: 'You are not the owner of this playlist, you cannot update it',
      });
    });

    it('throws BadRequestError for other errors', async () => {
      repo.updateOrderOfSignleTrack.mockResolvedValue(
        new Error('Old position is out of bounds'),
      );

      await expect(
        service.updateOrderOfSingleTrack(
          ID.playlist1,
          ID.track1,
          99,
          0,
          ID.user1,
        ),
      ).rejects.toMatchObject({ message: 'Old position is out of bounds' });
    });
  });

  describe('delete', () => {
    it('deletes playlist successfully', async () => {
      repo.delete.mockResolvedValue(true);

      const result = await service.delete(ID.playlist1, ID.user1);

      expect(result).toBe(true);
    });

    it('returns false when playlist does not exist', async () => {
      repo.delete.mockResolvedValue(false);

      const result = await service.delete(ID.playlist1, ID.user1);

      expect(result).toBe(false);
    });

    it('throws NotFoundError when repository returns an Error', async () => {
      repo.delete.mockResolvedValue(new Error('Playlist not found'));

      await expect(
        service.delete(ID.playlist1, ID.user1),
      ).rejects.toMatchObject({ message: 'Playlist not found' });
    });
  });
});
