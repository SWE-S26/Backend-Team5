import { PlaylistsController } from '../../../src/modules/playlists/playlists.controller';
import { PlaylistsService } from '../../../src/modules/playlists/playlists.service';
import { Request, Response } from 'express';
import { parseRequest } from '../../../src/shared/dtos/requestParser';

jest.mock('../../../src/shared/abstractions/blob.service', () => ({
  default: {
    uploadWaveToBlob: jest.fn(),
    deleteWaveFromBlob: jest.fn(),
  },
}));
jest.mock('../../../src/modules/playlists/playlists.service');
jest.mock('../../../src/shared/dtos/requestParser');
jest.mock('../../../src/shared/errors/responseErrors', () => ({
  BadRequestError: jest.fn((msg: string) => new Error(msg)),
  ForbiddenError: jest.fn((msg: string) => new Error(msg)),
}));

const fakePlaylist = {
  _id: 'playlist_1',
  playlistName: 'My Playlist',
  isPrivate: false,
  tracks: ['track_1', 'track_2'],
  userId: 'user_123',
};

const fakePaginatedPlaylists = {
  playlists: [fakePlaylist],
  total: 1,
};

const fakeArtistDetails = {
  _id: 'artist_1',
  name: 'Artist Name',
  followers: 500,
};

function mockParseSuccess(
  params: object = {},
  body: object = {},
  query: object = {},
): void {
  (parseRequest as jest.Mock).mockReturnValue({
    success: true,
    data: { params, body, query },
  });
}

function mockParseFailure(message = 'Validation error'): void {
  (parseRequest as jest.Mock).mockReturnValue({
    success: false,
    error: new Error(message),
  });
}

let controller: PlaylistsController;
let mockRes: Partial<Response>;

describe('PlaylistsController : findAll', () => {
  beforeEach(() => {
    controller = new PlaylistsController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: { offset: 0, limit: 10 },
    params: {},
    userInfo: { _id: 'user_123', role: 'user' },
  };

  it('should return playlists on success', async () => {
    mockParseSuccess({}, {}, { offset: 0, limit: 10 });
    (PlaylistsService.prototype.findAll as jest.Mock).mockResolvedValue(
      fakePaginatedPlaylists,
    );

    await controller.findAll(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Playlists retrieved successfully',
      data: { playlists: fakePaginatedPlaylists },
    });
  });

  it('should call findAll with correct offset, limit, and userId', async () => {
    mockParseSuccess({}, {}, { offset: 0, limit: 10 });
    (PlaylistsService.prototype.findAll as jest.Mock).mockResolvedValue(
      fakePaginatedPlaylists,
    );

    await controller.findAll(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(PlaylistsService.prototype.findAll).toHaveBeenCalledWith(
      0,
      10,
      'user_123',
    );
  });

  it('should pass null as userId when userInfo is not present', async () => {
    mockParseSuccess({}, {}, { offset: 0, limit: 10 });
    (PlaylistsService.prototype.findAll as jest.Mock).mockResolvedValue(
      fakePaginatedPlaylists,
    );

    const reqWithoutUser = { body: {}, query: {}, params: {} };
    await controller.findAll(
      reqWithoutUser as unknown as Request,
      mockRes as Response,
    );

    expect(PlaylistsService.prototype.findAll).toHaveBeenCalledWith(
      0,
      10,
      null,
    );
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('offset must be a number');

    await expect(
      controller.findAll(mockReq as unknown as Request, mockRes as Response),
    ).rejects.toThrow('offset must be a number');
  });

  it('should throw when service throws', async () => {
    mockParseSuccess({}, {}, { offset: 0, limit: 10 });
    (PlaylistsService.prototype.findAll as jest.Mock).mockRejectedValue(
      new Error('DB error'),
    );

    await expect(
      controller.findAll(mockReq as unknown as Request, mockRes as Response),
    ).rejects.toThrow('DB error');
  });
});

describe('PlaylistsController : findById', () => {
  beforeEach(() => {
    controller = new PlaylistsController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: { offset: 0, limit: 10 },
    params: { id: 'playlist_1' },
    userInfo: { _id: 'user_123', role: 'user' },
  };

  it('should return a playlist on success', async () => {
    mockParseSuccess({ id: 'playlist_1' }, {}, { offset: 0, limit: 10 });
    (PlaylistsService.prototype.findById as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );

    await controller.findById(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Playlist retrieved successfully',
      data: { playlist: fakePlaylist },
    });
  });

  it('should call findById with correct id, userId, offset, and limit', async () => {
    mockParseSuccess({ id: 'playlist_1' }, {}, { offset: 0, limit: 10 });
    (PlaylistsService.prototype.findById as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );

    await controller.findById(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(PlaylistsService.prototype.findById).toHaveBeenCalledWith(
      'playlist_1',
      'user_123',
      0,
      10,
    );
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('id is required');

    await expect(
      controller.findById(mockReq as unknown as Request, mockRes as Response),
    ).rejects.toThrow('id is required');
  });

  it('should throw when service throws', async () => {
    mockParseSuccess({ id: 'playlist_1' }, {}, { offset: 0, limit: 10 });
    (PlaylistsService.prototype.findById as jest.Mock).mockRejectedValue(
      new Error('Playlist not found'),
    );

    await expect(
      controller.findById(mockReq as unknown as Request, mockRes as Response),
    ).rejects.toThrow('Playlist not found');
  });
});

describe('PlaylistsController : create', () => {
  beforeEach(() => {
    controller = new PlaylistsController();
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: { playlistName: 'My Playlist', isPrivate: false, tracks: [] },
    query: {},
    params: {},
    userInfo: { _id: 'user_123', role: 'user' },
  };

  it('should return 201 with created playlist on success', async () => {
    mockParseSuccess(
      {},
      { playlistName: 'My Playlist', isPrivate: false, tracks: [] },
    );
    (
      PlaylistsService.prototype.validateNumberOfPostedPlaylists as jest.Mock
    ).mockReturnValue(undefined);
    (PlaylistsService.prototype.create as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );

    await controller.create(mockReq as unknown as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Playlist created successfully',
      data: { playlist: fakePlaylist },
    });
  });

  it('should call create with correct arguments', async () => {
    mockParseSuccess(
      {},
      { playlistName: 'My Playlist', isPrivate: false, tracks: [] },
    );
    (
      PlaylistsService.prototype.validateNumberOfPostedPlaylists as jest.Mock
    ).mockReturnValue(undefined);
    (PlaylistsService.prototype.create as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );

    await controller.create(mockReq as unknown as Request, mockRes as Response);

    expect(PlaylistsService.prototype.create).toHaveBeenCalledWith(
      'My Playlist',
      'user_123',
      [],
      false,
    );
  });

  it('should throw ForbiddenError when user role is admin', async () => {
    mockParseSuccess(
      {},
      { playlistName: 'My Playlist', isPrivate: false, tracks: [] },
    );
    const adminReq = {
      ...mockReq,
      userInfo: { _id: 'admin_1', role: 'admin' },
    };

    await expect(
      controller.create(adminReq as unknown as Request, mockRes as Response),
    ).rejects.toThrow('Admins are not allowed to perform this action');
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('playlistName is required');

    await expect(
      controller.create(mockReq as unknown as Request, mockRes as Response),
    ).rejects.toThrow('playlistName is required');
  });

  it('should throw when service throws', async () => {
    mockParseSuccess(
      {},
      { playlistName: 'My Playlist', isPrivate: false, tracks: [] },
    );
    (
      PlaylistsService.prototype.validateNumberOfPostedPlaylists as jest.Mock
    ).mockReturnValue(undefined);
    (PlaylistsService.prototype.create as jest.Mock).mockRejectedValue(
      new Error('Creation failed'),
    );

    await expect(
      controller.create(mockReq as unknown as Request, mockRes as Response),
    ).rejects.toThrow('Creation failed');
  });
});

describe('PlaylistsController : delete', () => {
  beforeEach(() => {
    controller = new PlaylistsController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: {},
    params: { id: 'playlist_1' },
    userInfo: { _id: 'user_123', role: 'user' },
  };

  it('should return deleted playlist on success', async () => {
    mockParseSuccess({ id: 'playlist_1' });
    (PlaylistsService.prototype.delete as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );

    await controller.delete(mockReq as unknown as Request, mockRes as Response);

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Playlist deleted successfully',
      data: { deleted: fakePlaylist },
    });
  });

  it('should call delete with correct id and userId', async () => {
    mockParseSuccess({ id: 'playlist_1' });
    (PlaylistsService.prototype.delete as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );

    await controller.delete(mockReq as unknown as Request, mockRes as Response);

    expect(PlaylistsService.prototype.delete).toHaveBeenCalledWith(
      'playlist_1',
      'user_123',
    );
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('id is required');

    await expect(
      controller.delete(mockReq as unknown as Request, mockRes as Response),
    ).rejects.toThrow('id is required');
  });

  it('should throw when service throws', async () => {
    mockParseSuccess({ id: 'playlist_1' });
    (PlaylistsService.prototype.delete as jest.Mock).mockRejectedValue(
      new Error('Playlist not found'),
    );

    await expect(
      controller.delete(mockReq as unknown as Request, mockRes as Response),
    ).rejects.toThrow('Playlist not found');
  });
});

describe('PlaylistsController : updatePlaylistPicture', () => {
  beforeEach(() => {
    controller = new PlaylistsController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const fakeImageFile = {
    originalname: 'cover.png',
    buffer: Buffer.from(''),
  } as Express.Multer.File;

  const buildReq = (imageFile?: Express.Multer.File, role = 'user') => ({
    body: {},
    query: {},
    params: { id: 'playlist_1' },
    userInfo: { _id: 'user_123', role },
    files: imageFile ? { image: [imageFile] } : {},
  });

  it('should return updated playlist on success', async () => {
    mockParseSuccess({ id: 'playlist_1' });
    (PlaylistsService.prototype.updateImage as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );

    await controller.updatePlaylistPicture(
      buildReq(fakeImageFile) as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Playlist picture updated successfully',
      data: { playlist: fakePlaylist },
    });
  });

  it('should call updateImage with correct id, imageFile, and userId', async () => {
    mockParseSuccess({ id: 'playlist_1' });
    (PlaylistsService.prototype.updateImage as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );

    await controller.updatePlaylistPicture(
      buildReq(fakeImageFile) as unknown as Request,
      mockRes as Response,
    );

    expect(PlaylistsService.prototype.updateImage).toHaveBeenCalledWith(
      'playlist_1',
      fakeImageFile,
      'user_123',
    );
  });

  it('should throw BadRequestError when no image file is provided', async () => {
    await expect(
      controller.updatePlaylistPicture(
        buildReq(undefined) as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Image file is required for updating playlist picture');
  });

  it('should throw ForbiddenError when user role is admin', async () => {
    await expect(
      controller.updatePlaylistPicture(
        buildReq(fakeImageFile, 'admin') as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Admins are not allowed to perform this action');
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('id is required');

    await expect(
      controller.updatePlaylistPicture(
        buildReq(fakeImageFile) as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('id is required');
  });
});

describe('PlaylistsController : addPlaylistToHistory', () => {
  beforeEach(() => {
    controller = new PlaylistsController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: {},
    params: { id: 'playlist_1' },
    userInfo: { _id: 'user_123', role: 'user' },
  };

  it('should return success response on success', async () => {
    mockParseSuccess({ id: 'playlist_1' });
    (
      PlaylistsService.prototype.addPlaylistToHistory as jest.Mock
    ).mockResolvedValue(undefined);

    await controller.addPlaylistToHistory(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Playlist added to history successfully',
      data: null,
    });
  });

  it('should call addPlaylistToHistory with correct id and userId', async () => {
    mockParseSuccess({ id: 'playlist_1' });
    (
      PlaylistsService.prototype.addPlaylistToHistory as jest.Mock
    ).mockResolvedValue(undefined);

    await controller.addPlaylistToHistory(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(
      PlaylistsService.prototype.addPlaylistToHistory,
    ).toHaveBeenCalledWith('playlist_1', 'user_123');
  });

  it('should throw ForbiddenError when user role is admin', async () => {
    mockParseSuccess({ id: 'playlist_1' });
    const adminReq = {
      ...mockReq,
      userInfo: { _id: 'admin_1', role: 'admin' },
    };

    await expect(
      controller.addPlaylistToHistory(
        adminReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Admins are not allowed to perform this action');
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('id is required');

    await expect(
      controller.addPlaylistToHistory(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('id is required');
  });
});

describe('PlaylistsController : updatePlaylistSingleTrackOrder', () => {
  beforeEach(() => {
    controller = new PlaylistsController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: { trackId: 'track_1', oldPosition: 0, newPosition: 2 },
    query: {},
    params: { id: 'playlist_1' },
    userInfo: { _id: 'user_123', role: 'user' },
  };

  it('should return success response on success', async () => {
    mockParseSuccess(
      { id: 'playlist_1' },
      { trackId: 'track_1', oldPosition: 0, newPosition: 2 },
    );
    (
      PlaylistsService.prototype.updateOrderOfSingleTrack as jest.Mock
    ).mockResolvedValue(undefined);

    await controller.updatePlaylistSingleTrackOrder(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Updated Playlist track order successfully.',
    });
  });

  it('should call updateOrderOfSingleTrack with correct args', async () => {
    mockParseSuccess(
      { id: 'playlist_1' },
      { trackId: 'track_1', oldPosition: 0, newPosition: 2 },
    );
    (
      PlaylistsService.prototype.updateOrderOfSingleTrack as jest.Mock
    ).mockResolvedValue(undefined);

    await controller.updatePlaylistSingleTrackOrder(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(
      PlaylistsService.prototype.updateOrderOfSingleTrack,
    ).toHaveBeenCalledWith('playlist_1', 'track_1', 0, 2, 'user_123');
  });

  it('should throw ForbiddenError when user role is admin', async () => {
    mockParseSuccess(
      { id: 'playlist_1' },
      { trackId: 'track_1', oldPosition: 0, newPosition: 2 },
    );
    const adminReq = {
      ...mockReq,
      userInfo: { _id: 'admin_1', role: 'admin' },
    };

    await expect(
      controller.updatePlaylistSingleTrackOrder(
        adminReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Admins are not allowed to perform this action');
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('trackId is required');

    await expect(
      controller.updatePlaylistSingleTrackOrder(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('trackId is required');
  });

  it('should throw when service throws', async () => {
    mockParseSuccess(
      { id: 'playlist_1' },
      { trackId: 'track_1', oldPosition: 0, newPosition: 2 },
    );
    (
      PlaylistsService.prototype.updateOrderOfSingleTrack as jest.Mock
    ).mockRejectedValue(new Error('Track not found'));

    await expect(
      controller.updatePlaylistSingleTrackOrder(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Track not found');
  });
});

describe('PlaylistsController : addTrackToPlaylist', () => {
  beforeEach(() => {
    controller = new PlaylistsController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: {},
    params: { id: 'playlist_1', trackId: 'track_1' },
    userInfo: { _id: 'user_123', role: 'user' },
  };

  it('should return success response on success', async () => {
    mockParseSuccess({ id: 'playlist_1', trackId: 'track_1' });
    (
      PlaylistsService.prototype.addTrackToPlaylist as jest.Mock
    ).mockResolvedValue(undefined);

    await controller.addTrackToPlaylist(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Track added to playlist successfully',
    });
  });

  it('should call addTrackToPlaylist with correct id, trackId, and userId', async () => {
    mockParseSuccess({ id: 'playlist_1', trackId: 'track_1' });
    (
      PlaylistsService.prototype.addTrackToPlaylist as jest.Mock
    ).mockResolvedValue(undefined);

    await controller.addTrackToPlaylist(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(PlaylistsService.prototype.addTrackToPlaylist).toHaveBeenCalledWith(
      'playlist_1',
      'track_1',
      'user_123',
    );
  });

  it('should throw ForbiddenError when user role is admin', async () => {
    mockParseSuccess({ id: 'playlist_1', trackId: 'track_1' });
    const adminReq = {
      ...mockReq,
      userInfo: { _id: 'admin_1', role: 'admin' },
    };

    await expect(
      controller.addTrackToPlaylist(
        adminReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Admins are not allowed to perform this action');
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('trackId is required');

    await expect(
      controller.addTrackToPlaylist(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('trackId is required');
  });

  it('should throw when service throws', async () => {
    mockParseSuccess({ id: 'playlist_1', trackId: 'track_1' });
    (
      PlaylistsService.prototype.addTrackToPlaylist as jest.Mock
    ).mockRejectedValue(new Error('Track already in playlist'));

    await expect(
      controller.addTrackToPlaylist(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Track already in playlist');
  });
});

describe('PlaylistsController : removeTrackFromPlaylist', () => {
  beforeEach(() => {
    controller = new PlaylistsController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: {},
    params: { id: 'playlist_1', trackId: 'track_1' },
    userInfo: { _id: 'user_123', role: 'user' },
  };

  it('should return success response on success', async () => {
    mockParseSuccess({ id: 'playlist_1', trackId: 'track_1' });
    (
      PlaylistsService.prototype.removeTrackFromPlaylist as jest.Mock
    ).mockResolvedValue(undefined);

    await controller.removeTrackFromPlaylist(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Track removed from playlist successfully',
    });
  });

  it('should call removeTrackFromPlaylist with correct id, trackId, and userId', async () => {
    mockParseSuccess({ id: 'playlist_1', trackId: 'track_1' });
    (
      PlaylistsService.prototype.removeTrackFromPlaylist as jest.Mock
    ).mockResolvedValue(undefined);

    await controller.removeTrackFromPlaylist(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(
      PlaylistsService.prototype.removeTrackFromPlaylist,
    ).toHaveBeenCalledWith('playlist_1', 'track_1', 'user_123');
  });

  it('should throw ForbiddenError when user role is admin', async () => {
    mockParseSuccess({ id: 'playlist_1', trackId: 'track_1' });
    const adminReq = {
      ...mockReq,
      userInfo: { _id: 'admin_1', role: 'admin' },
    };

    await expect(
      controller.removeTrackFromPlaylist(
        adminReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Admins are not allowed to perform this action');
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('id is required');

    await expect(
      controller.removeTrackFromPlaylist(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('id is required');
  });

  it('should throw when service throws', async () => {
    mockParseSuccess({ id: 'playlist_1', trackId: 'track_1' });
    (
      PlaylistsService.prototype.removeTrackFromPlaylist as jest.Mock
    ).mockRejectedValue(new Error('Track not in playlist'));

    await expect(
      controller.removeTrackFromPlaylist(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Track not in playlist');
  });
});

describe('PlaylistsController : getArtistDetails', () => {
  beforeEach(() => {
    controller = new PlaylistsController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: {},
    params: { id: 'artist_1' },
    userInfo: { _id: 'user_123', role: 'user' },
  };

  it('should return artist details on success', async () => {
    mockParseSuccess({ id: 'artist_1' });
    (
      PlaylistsService.prototype.getArtistDetails as jest.Mock
    ).mockResolvedValue(fakeArtistDetails);

    await controller.getArtistDetails(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Artist details retrieved successfully',
      data: { artist: fakeArtistDetails },
    });
  });

  it('should call getArtistDetails with correct id and userId', async () => {
    mockParseSuccess({ id: 'artist_1' });
    (
      PlaylistsService.prototype.getArtistDetails as jest.Mock
    ).mockResolvedValue(fakeArtistDetails);

    await controller.getArtistDetails(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(PlaylistsService.prototype.getArtistDetails).toHaveBeenCalledWith(
      'artist_1',
      'user_123',
    );
  });

  it('should pass null as userId when userInfo is not present', async () => {
    mockParseSuccess({ id: 'artist_1' });
    (
      PlaylistsService.prototype.getArtistDetails as jest.Mock
    ).mockResolvedValue(fakeArtistDetails);

    const reqWithoutUser = { body: {}, query: {}, params: { id: 'artist_1' } };
    await controller.getArtistDetails(
      reqWithoutUser as unknown as Request,
      mockRes as Response,
    );

    expect(PlaylistsService.prototype.getArtistDetails).toHaveBeenCalledWith(
      'artist_1',
      null,
    );
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('id is required');

    await expect(
      controller.getArtistDetails(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('id is required');
  });

  it('should throw when service throws', async () => {
    mockParseSuccess({ id: 'artist_1' });
    (
      PlaylistsService.prototype.getArtistDetails as jest.Mock
    ).mockRejectedValue(new Error('Artist not found'));

    await expect(
      controller.getArtistDetails(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Artist not found');
  });
});

describe('PlaylistsController : getMorePlaylistsFromArtist', () => {
  beforeEach(() => {
    controller = new PlaylistsController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: {},
    params: { artistId: 'artist_1', playlistId: 'playlist_1' },
    userInfo: { _id: 'user_123', role: 'user' },
  };

  it('should return more playlists on success', async () => {
    mockParseSuccess({ artistId: 'artist_1', playlistId: 'playlist_1' });
    (
      PlaylistsService.prototype.getMorePlaylistsFromArtist as jest.Mock
    ).mockResolvedValue([fakePlaylist]);

    await controller.getMorePlaylistsFromArtist(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'More playlists from same artist retrieved successfully',
      data: { playlists: [fakePlaylist] },
    });
  });

  it('should call getMorePlaylistsFromArtist with correct artistId, playlistId, and userId', async () => {
    mockParseSuccess({ artistId: 'artist_1', playlistId: 'playlist_1' });
    (
      PlaylistsService.prototype.getMorePlaylistsFromArtist as jest.Mock
    ).mockResolvedValue([fakePlaylist]);

    await controller.getMorePlaylistsFromArtist(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(
      PlaylistsService.prototype.getMorePlaylistsFromArtist,
    ).toHaveBeenCalledWith('artist_1', 'playlist_1', 'user_123');
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('artistId is required');

    await expect(
      controller.getMorePlaylistsFromArtist(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('artistId is required');
  });

  it('should throw when service throws', async () => {
    mockParseSuccess({ artistId: 'artist_1', playlistId: 'playlist_1' });
    (
      PlaylistsService.prototype.getMorePlaylistsFromArtist as jest.Mock
    ).mockRejectedValue(new Error('Artist not found'));

    await expect(
      controller.getMorePlaylistsFromArtist(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Artist not found');
  });
});

describe('PlaylistsController : getMyPlaylists', () => {
  beforeEach(() => {
    controller = new PlaylistsController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: { offset: 0, limit: 10 },
    params: {},
    userInfo: { _id: 'user_123', role: 'user' },
  };

  it('should return user playlists on success', async () => {
    mockParseSuccess({}, {}, { offset: 0, limit: 10 });
    (PlaylistsService.prototype.getMyPlaylists as jest.Mock).mockResolvedValue(
      fakePaginatedPlaylists,
    );

    await controller.getMyPlaylists(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'My playlists retrieved successfully',
      data: { playlists: fakePaginatedPlaylists },
    });
  });

  it('should call getMyPlaylists with correct userId, offset, and limit', async () => {
    mockParseSuccess({}, {}, { offset: 0, limit: 10 });
    (PlaylistsService.prototype.getMyPlaylists as jest.Mock).mockResolvedValue(
      fakePaginatedPlaylists,
    );

    await controller.getMyPlaylists(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(PlaylistsService.prototype.getMyPlaylists).toHaveBeenCalledWith(
      'user_123',
      0,
      10,
    );
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('limit must be a number');

    await expect(
      controller.getMyPlaylists(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('limit must be a number');
  });

  it('should throw when service throws', async () => {
    mockParseSuccess({}, {}, { offset: 0, limit: 10 });
    (PlaylistsService.prototype.getMyPlaylists as jest.Mock).mockRejectedValue(
      new Error('DB error'),
    );

    await expect(
      controller.getMyPlaylists(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('DB error');
  });
});

describe('PlaylistsController : getPlaylistByPermalink', () => {
  beforeEach(() => {
    controller = new PlaylistsController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: {},
    params: { permalink: 'my-playlist' },
    userInfo: { _id: 'user_123', role: 'user' },
  };

  it('should return playlist on success', async () => {
    mockParseSuccess({ permalink: 'my-playlist' });
    (PlaylistsService.prototype.getByPermalink as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );

    await controller.getPlaylistByPermalink(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Playlist retrieved successfully',
      data: { playlist: fakePlaylist },
    });
  });

  it('should call getByPermalink with correct permalink and userId', async () => {
    mockParseSuccess({ permalink: 'my-playlist' });
    (PlaylistsService.prototype.getByPermalink as jest.Mock).mockResolvedValue(
      fakePlaylist,
    );

    await controller.getPlaylistByPermalink(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(PlaylistsService.prototype.getByPermalink).toHaveBeenCalledWith(
      'my-playlist',
      'user_123',
    );
  });

  it('should throw BadRequestError when playlist is not found', async () => {
    mockParseSuccess({ permalink: 'my-playlist' });
    (PlaylistsService.prototype.getByPermalink as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      controller.getPlaylistByPermalink(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Playlist with the given permalink not found');
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('permalink is required');

    await expect(
      controller.getPlaylistByPermalink(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('permalink is required');
  });
});

describe('PlaylistsController : getPlaylistByPermalinkAndProfileLink', () => {
  beforeEach(() => {
    controller = new PlaylistsController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: { limit: 10, offset: 0 },
    params: { permalink: 'my-playlist', profilelink: 'user-profile' },
    userInfo: { _id: 'user_123', role: 'user' },
  };

  it('should return playlist on success', async () => {
    mockParseSuccess(
      { permalink: 'my-playlist', profilelink: 'user-profile' },
      {},
      { limit: 10, offset: 0 },
    );
    (
      PlaylistsService.prototype.getByPermaLinkAndProfileLink as jest.Mock
    ).mockResolvedValue(fakePlaylist);

    await controller.getPlaylistByPermalinkAndProfileLink(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Playlist retrieved successfully',
      data: { playlist: fakePlaylist },
    });
  });

  it('should call getByPermaLinkAndProfileLink with correct args', async () => {
    mockParseSuccess(
      { permalink: 'my-playlist', profilelink: 'user-profile' },
      {},
      { limit: 10, offset: 0 },
    );
    (
      PlaylistsService.prototype.getByPermaLinkAndProfileLink as jest.Mock
    ).mockResolvedValue(fakePlaylist);

    await controller.getPlaylistByPermalinkAndProfileLink(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(
      PlaylistsService.prototype.getByPermaLinkAndProfileLink,
    ).toHaveBeenCalledWith('my-playlist', 'user-profile', 'user_123', 10, 0);
  });

  it('should throw BadRequestError when playlist is not found', async () => {
    mockParseSuccess(
      { permalink: 'my-playlist', profilelink: 'user-profile' },
      {},
      { limit: 10, offset: 0 },
    );
    (
      PlaylistsService.prototype.getByPermaLinkAndProfileLink as jest.Mock
    ).mockResolvedValue(null);

    await expect(
      controller.getPlaylistByPermalinkAndProfileLink(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Playlist with the given permalink not found');
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('permalink is required');

    await expect(
      controller.getPlaylistByPermalinkAndProfileLink(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('permalink is required');
  });
});

describe('PlaylistsController : getPlaylistsForArtist', () => {
  beforeEach(() => {
    controller = new PlaylistsController();
    mockRes = { json: jest.fn() };
    jest.clearAllMocks();
  });

  const mockReq = {
    body: {},
    query: { offset: 0, limit: 10 },
    params: { id: 'artist_1' },
    userInfo: { _id: 'user_123', role: 'user' },
  };

  it('should return playlists for artist on success', async () => {
    mockParseSuccess({ id: 'artist_1' }, {}, { offset: 0, limit: 10 });
    (
      PlaylistsService.prototype.getPlaylistsForArtist as jest.Mock
    ).mockResolvedValue([fakePlaylist]);

    await controller.getPlaylistsForArtist(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'Playlists for artist retrieved successfully',
      data: { playlists: [fakePlaylist] },
    });
  });

  it('should call getPlaylistsForArtist with correct id, offset, limit, and userId', async () => {
    mockParseSuccess({ id: 'artist_1' }, {}, { offset: 0, limit: 10 });
    (
      PlaylistsService.prototype.getPlaylistsForArtist as jest.Mock
    ).mockResolvedValue([fakePlaylist]);

    await controller.getPlaylistsForArtist(
      mockReq as unknown as Request,
      mockRes as Response,
    );

    expect(
      PlaylistsService.prototype.getPlaylistsForArtist,
    ).toHaveBeenCalledWith('artist_1', 0, 10, 'user_123');
  });

  it('should pass null as userId when userInfo is not present', async () => {
    mockParseSuccess({ id: 'artist_1' }, {}, { offset: 0, limit: 10 });
    (
      PlaylistsService.prototype.getPlaylistsForArtist as jest.Mock
    ).mockResolvedValue([fakePlaylist]);

    const reqWithoutUser = {
      body: {},
      query: {},
      params: { id: 'artist_1' },
    };
    await controller.getPlaylistsForArtist(
      reqWithoutUser as unknown as Request,
      mockRes as Response,
    );

    expect(
      PlaylistsService.prototype.getPlaylistsForArtist,
    ).toHaveBeenCalledWith('artist_1', 0, 10, null);
  });

  it('should throw when request validation fails', async () => {
    mockParseFailure('id is required');

    await expect(
      controller.getPlaylistsForArtist(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('id is required');
  });

  it('should throw when service throws', async () => {
    mockParseSuccess({ id: 'artist_1' }, {}, { offset: 0, limit: 10 });
    (
      PlaylistsService.prototype.getPlaylistsForArtist as jest.Mock
    ).mockRejectedValue(new Error('Artist not found'));

    await expect(
      controller.getPlaylistsForArtist(
        mockReq as unknown as Request,
        mockRes as Response,
      ),
    ).rejects.toThrow('Artist not found');
  });
});
