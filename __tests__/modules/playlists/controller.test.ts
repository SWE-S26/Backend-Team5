import { PlaylistsController } from '../../../src/modules/playlists/playlists.controller';
import { PlaylistsService } from '../../../src/modules/playlists/playlists.service';
import { Request, Response } from 'express';
import { parseRequest } from '../../../src/shared/dtos/requestParser';

jest.mock('../../../src/shared/dtos/requestParser');
jest.mock('../../../src/modules/playlists/playlists.service');

describe('PlaylistsController - FULL TEST', () => {
  let controller: PlaylistsController;
  let service: jest.Mocked<PlaylistsService>;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    service = {
      findAll: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      createPlaylistWithImage: jest.fn(),
      validateNumberOfPostedPlaylists: jest.fn(),
      delete: jest.fn(),
      updateImage: jest.fn(),
      addPlaylistToHistory: jest.fn(),
      updateOrderOfSingleTrack: jest.fn(),
      updatePlaylist: jest.fn(),
      addTrackToPlaylist: jest.fn(),
      getAlbumsOfAnArtist: jest.fn(),
      getArtistDetails: jest.fn(),
      getMorePlaylistsFromArtist: jest.fn(),
      getMyPlaylists: jest.fn(),
      getByPermaLinkAndProfileLink: jest.fn(),
      getPlaylistsForArtist: jest.fn(),
    } as any;

    (PlaylistsService as jest.Mock).mockImplementation(() => service);
    controller = new PlaylistsController();

    req = {
      userInfo: { _id: 'user1', role: 'user' },
      params: {},
      body: {},
      query: {},
      files: {},
    } as unknown as Request;

    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  const mockValid = (data: any) => {
    (parseRequest as jest.Mock).mockReturnValue({ success: true, data });
  };

  const mockInvalid = (error = new Error('invalid')) => {
    (parseRequest as jest.Mock).mockReturnValue({ success: false, error });
  };

  it('findAll - success (authenticated)', async () => {
    mockValid({ query: { offset: 0, limit: 10 } });
    service.findAll.mockResolvedValue([{ id: 'p1' }] as any);

    await controller.findAll(req as Request, res as Response);

    expect(service.findAll).toHaveBeenCalledWith(0, 10, 'user1');
    expect(res.json).toHaveBeenCalledWith({
      message: 'Playlists retrieved successfully',
      data: { playlists: [{ id: 'p1' }] },
    });
  });

  it('findAll - success (unauthenticated)', async () => {
    req.userInfo = undefined;
    mockValid({ query: { offset: 0, limit: 10 } });
    service.findAll.mockResolvedValue([] as any);

    await controller.findAll(req as Request, res as Response);

    expect(service.findAll).toHaveBeenCalledWith(0, 10, null);
  });

  it('findAll - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.findAll(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  it('findById - success', async () => {
    mockValid({ params: { id: 'p1' }, query: { offset: 0, limit: 10 } });
    service.findById.mockResolvedValue({ id: 'p1' } as any);

    await controller.findById(req as Request, res as Response);

    expect(service.findById).toHaveBeenCalledWith('p1', 'user1', 0, 10);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Playlist retrieved successfully',
      data: { playlist: { id: 'p1' } },
    });
  });

  it('findById - unauthenticated user passes null', async () => {
    req.userInfo = undefined;
    mockValid({ params: { id: 'p1' }, query: { offset: 0, limit: 5 } });
    service.findById.mockResolvedValue({ id: 'p1' } as any);

    await controller.findById(req as Request, res as Response);

    expect(service.findById).toHaveBeenCalledWith('p1', null, 0, 5);
  });

  it('findById - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.findById(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  it('create - success', async () => {
    mockValid({
      body: { playlistName: 'My Playlist', isPrivate: false, tracks: [] },
    });
    service.validateNumberOfPostedPlaylists.mockReturnValue(undefined as any);
    service.create.mockResolvedValue({
      id: 'p1',
      playlistName: 'My Playlist',
    } as any);

    await controller.create(req as Request, res as Response);

    expect(service.create).toHaveBeenCalledWith(
      'My Playlist',
      'user1',
      [],
      false,
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Playlist created successfully',
      data: { playlist: { id: 'p1', playlistName: 'My Playlist' } },
    });
  });

  it('create - admin is forbidden', async () => {
    req.userInfo = { _id: 'admin1', role: 'admin' } as any;
    mockValid({
      body: { playlistName: 'My Playlist', isPrivate: false, tracks: [] },
    });

    await expect(
      controller.create(req as Request, res as Response),
    ).rejects.toThrow();
  });

  it('create - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.create(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  it('createWithImage - success', async () => {
    req.files = { image: [{ buffer: Buffer.from('img') }] as any };
    req.body = {
      data: JSON.stringify({ playlistName: 'Img Playlist', isPrivate: false }),
    };

    mockValid({ body: { playlistName: 'Img Playlist', isPrivate: false } });
    service.validateNumberOfPostedPlaylists.mockReturnValue(undefined as any);
    service.createPlaylistWithImage.mockResolvedValue({ id: 'p2' } as any);

    await controller.createWithImage(req as Request, res as Response);

    expect(service.createPlaylistWithImage).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: 'Playlist created successfully',
      data: { playlist: { id: 'p2' } },
    });
  });

  it('createWithImage - invalid JSON in body throws', async () => {
    req.body = { data: 'not-valid-json' };

    await expect(
      controller.createWithImage(req as Request, res as Response),
    ).rejects.toThrow('Invalid JSON in "data" field');
  });

  it('createWithImage - admin is forbidden', async () => {
    req.userInfo = { _id: 'admin1', role: 'admin' } as any;
    req.body = { data: JSON.stringify({ playlistName: 'Test' }) };

    await expect(
      controller.createWithImage(req as Request, res as Response),
    ).rejects.toThrow();
  });

  it('createWithImage - invalid request throws', async () => {
    req.body = { data: JSON.stringify({ playlistName: 'Test' }) };
    mockInvalid(new Error('bad request'));

    await expect(
      controller.createWithImage(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  it('delete - success', async () => {
    mockValid({ params: { id: 'p1' } });
    service.delete.mockResolvedValue({ deleted: true } as any);

    await controller.delete(req as Request, res as Response);

    expect(service.delete).toHaveBeenCalledWith('p1', 'user1');
    expect(res.json).toHaveBeenCalledWith({
      message: 'Playlist deleted successfully',
      data: { deleted: { deleted: true } },
    });
  });

  it('delete - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.delete(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  it('updatePlaylistPicture - success', async () => {
    req.files = { image: [{ buffer: Buffer.from('img') }] as any };
    mockValid({ params: { id: 'p1' } });
    service.updateImage.mockResolvedValue({ id: 'p1' } as any);

    await controller.updatePlaylistPicture(req as Request, res as Response);

    expect(service.updateImage).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: 'Playlist picture updated successfully',
      data: { playlist: { id: 'p1' } },
    });
  });

  it('updatePlaylistPicture - no image file throws', async () => {
    req.files = {};

    await expect(
      controller.updatePlaylistPicture(req as Request, res as Response),
    ).rejects.toThrow('Image file is required for updating playlist picture');
  });

  it('updatePlaylistPicture - admin is forbidden', async () => {
    req.userInfo = { _id: 'admin1', role: 'admin' } as any;
    req.files = { image: [{ buffer: Buffer.from('img') }] as any };

    await expect(
      controller.updatePlaylistPicture(req as Request, res as Response),
    ).rejects.toThrow();
  });

  it('updatePlaylistPicture - invalid request throws', async () => {
    req.files = { image: [{ buffer: Buffer.from('img') }] as any };
    mockInvalid(new Error('bad request'));

    await expect(
      controller.updatePlaylistPicture(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  it('addPlaylistToHistory - success', async () => {
    mockValid({ params: { id: 'p1' } });
    service.addPlaylistToHistory.mockResolvedValue(undefined as any);

    await controller.addPlaylistToHistory(req as Request, res as Response);

    expect(service.addPlaylistToHistory).toHaveBeenCalledWith('p1', 'user1');
    expect(res.json).toHaveBeenCalledWith({
      message: 'Playlist added to history successfully',
      data: null,
    });
  });

  it('addPlaylistToHistory - admin is forbidden', async () => {
    req.userInfo = { _id: 'admin1', role: 'admin' } as any;
    mockValid({ params: { id: 'p1' } });

    await expect(
      controller.addPlaylistToHistory(req as Request, res as Response),
    ).rejects.toThrow();
  });

  it('addPlaylistToHistory - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.addPlaylistToHistory(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  it('updatePlaylistSingleTrackOrder - success', async () => {
    mockValid({
      params: { id: 'p1' },
      body: { trackId: 't1', oldPosition: 0, newPosition: 2 },
    });
    service.updateOrderOfSingleTrack.mockResolvedValue(undefined as any);

    await controller.updatePlaylistSingleTrackOrder(
      req as Request,
      res as Response,
    );

    expect(service.updateOrderOfSingleTrack).toHaveBeenCalledWith(
      'p1',
      't1',
      0,
      2,
      'user1',
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'Updated Playlist track order successfully.',
    });
  });

  it('updatePlaylistSingleTrackOrder - admin is forbidden', async () => {
    req.userInfo = { _id: 'admin1', role: 'admin' } as any;
    mockValid({
      params: { id: 'p1' },
      body: { trackId: 't1', oldPosition: 0, newPosition: 2 },
    });

    await expect(
      controller.updatePlaylistSingleTrackOrder(
        req as Request,
        res as Response,
      ),
    ).rejects.toThrow();
  });

  it('updatePlaylistSingleTrackOrder - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.updatePlaylistSingleTrackOrder(
        req as Request,
        res as Response,
      ),
    ).rejects.toThrow('bad request');
  });

  it('updatePlaylist - success', async () => {
    req.files = { image: [{ buffer: Buffer.from('img') }] as any };
    req.body = { data: JSON.stringify({ playlistName: 'Updated' }) };

    mockValid({ params: { id: 'p1' }, body: { playlistName: 'Updated' } });
    service.updatePlaylist.mockResolvedValue(undefined as any);

    await controller.updatePlaylist(req as Request, res as Response);

    expect(service.updatePlaylist).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: 'Playlist updated successfully',
    });
  });

  it('updatePlaylist - invalid JSON in body throws', async () => {
    req.body = { data: 'not-valid-json' };

    await expect(
      controller.updatePlaylist(req as Request, res as Response),
    ).rejects.toThrow('Invalid JSON in "data" field');
  });

  it('updatePlaylist - admin is forbidden', async () => {
    req.userInfo = { _id: 'admin1', role: 'admin' } as any;
    req.body = { data: JSON.stringify({ playlistName: 'Updated' }) };

    await expect(
      controller.updatePlaylist(req as Request, res as Response),
    ).rejects.toThrow();
  });

  it('updatePlaylist - invalid request throws', async () => {
    req.body = { data: JSON.stringify({ playlistName: 'Updated' }) };
    mockInvalid(new Error('bad request'));

    await expect(
      controller.updatePlaylist(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  it('addTrackToPlaylist - success', async () => {
    mockValid({ params: { id: 'p1', trackId: 't1' } });
    service.addTrackToPlaylist.mockResolvedValue(undefined as any);

    await controller.addTrackToPlaylist(req as Request, res as Response);

    expect(service.addTrackToPlaylist).toHaveBeenCalledWith(
      'p1',
      't1',
      'user1',
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'Track added to playlist successfully',
    });
  });

  it('addTrackToPlaylist - admin is forbidden', async () => {
    req.userInfo = { _id: 'admin1', role: 'admin' } as any;
    mockValid({ params: { id: 'p1', trackId: 't1' } });

    await expect(
      controller.addTrackToPlaylist(req as Request, res as Response),
    ).rejects.toThrow();
  });

  it('addTrackToPlaylist - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.addTrackToPlaylist(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  it('getAlbumsOfAnArtist - success (authenticated)', async () => {
    mockValid({ params: { id: 'artist1' }, query: { offset: 0, limit: 10 } });
    service.getAlbumsOfAnArtist.mockResolvedValue([{ id: 'a1' }] as any);

    await controller.getAlbumsOfAnArtist(req as Request, res as Response);

    expect(service.getAlbumsOfAnArtist).toHaveBeenCalledWith(
      'artist1',
      'user1',
      10,
      0,
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'Albums for artist retrieved successfully',
      data: { albums: [{ id: 'a1' }] },
    });
  });

  it('getAlbumsOfAnArtist - success (unauthenticated)', async () => {
    req.userInfo = undefined;
    mockValid({ params: { id: 'artist1' }, query: { offset: 0, limit: 10 } });
    service.getAlbumsOfAnArtist.mockResolvedValue([] as any);

    await controller.getAlbumsOfAnArtist(req as Request, res as Response);

    expect(service.getAlbumsOfAnArtist).toHaveBeenCalledWith(
      'artist1',
      null,
      10,
      0,
    );
  });

  it('getAlbumsOfAnArtist - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.getAlbumsOfAnArtist(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  it('getArtistDetails - success (authenticated)', async () => {
    mockValid({ params: { id: 'artist1' } });
    service.getArtistDetails.mockResolvedValue({ name: 'Artist' } as any);

    await controller.getArtistDetails(req as Request, res as Response);

    expect(service.getArtistDetails).toHaveBeenCalledWith('artist1', 'user1');
    expect(res.json).toHaveBeenCalledWith({
      message: 'Artist details retrieved successfully',
      data: { artist: { name: 'Artist' } },
    });
  });

  it('getArtistDetails - success (unauthenticated)', async () => {
    req.userInfo = undefined;
    mockValid({ params: { id: 'artist1' } });
    service.getArtistDetails.mockResolvedValue({ name: 'Artist' } as any);

    await controller.getArtistDetails(req as Request, res as Response);

    expect(service.getArtistDetails).toHaveBeenCalledWith('artist1', null);
  });

  it('getArtistDetails - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.getArtistDetails(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  it('getMorePlaylistsFromArtist - success', async () => {
    mockValid({ params: { playlistId: 'p1', artistId: 'artist1' } });
    service.getMorePlaylistsFromArtist.mockResolvedValue([{ id: 'p2' }] as any);

    await controller.getMorePlaylistsFromArtist(
      req as Request,
      res as Response,
    );

    expect(service.getMorePlaylistsFromArtist).toHaveBeenCalledWith(
      'artist1',
      'p1',
      'user1',
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'More playlists from same artist retrieved successfully',
      data: { playlists: [{ id: 'p2' }] },
    });
  });

  it('getMorePlaylistsFromArtist - unauthenticated passes null', async () => {
    req.userInfo = undefined;
    mockValid({ params: { playlistId: 'p1', artistId: 'artist1' } });
    service.getMorePlaylistsFromArtist.mockResolvedValue([] as any);

    await controller.getMorePlaylistsFromArtist(
      req as Request,
      res as Response,
    );

    expect(service.getMorePlaylistsFromArtist).toHaveBeenCalledWith(
      'artist1',
      'p1',
      null,
    );
  });

  it('getMorePlaylistsFromArtist - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.getMorePlaylistsFromArtist(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  it('getMyPlaylists - success', async () => {
    mockValid({ query: { offset: 0, limit: 10 } });
    service.getMyPlaylists.mockResolvedValue([{ id: 'p1' }] as any);

    await controller.getMyPlaylists(req as Request, res as Response);

    expect(service.getMyPlaylists).toHaveBeenCalledWith('user1', 0, 10);
    expect(res.json).toHaveBeenCalledWith({
      message: 'My playlists retrieved successfully',
      data: { playlists: [{ id: 'p1' }] },
    });
  });

  it('getMyPlaylists - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.getMyPlaylists(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  it('getPlaylistByPermalinkAndProfileLink - success', async () => {
    mockValid({
      params: { permalink: 'my-playlist', profilelink: 'ahmed' },
      query: { limit: 10, offset: 0 },
    });
    service.getByPermaLinkAndProfileLink.mockResolvedValue({ id: 'p1' } as any);

    await controller.getPlaylistByPermalinkAndProfileLink(
      req as Request,
      res as Response,
    );

    expect(service.getByPermaLinkAndProfileLink).toHaveBeenCalledWith(
      'my-playlist',
      'ahmed',
      'user1',
      10,
      0,
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'Playlist retrieved successfully',
      data: { playlist: { id: 'p1' } },
    });
  });

  it('getPlaylistByPermalinkAndProfileLink - not found throws', async () => {
    mockValid({
      params: { permalink: 'missing', profilelink: 'ahmed' },
      query: { limit: 10, offset: 0 },
    });
    service.getByPermaLinkAndProfileLink.mockResolvedValue(null as any);

    await expect(
      controller.getPlaylistByPermalinkAndProfileLink(
        req as Request,
        res as Response,
      ),
    ).rejects.toThrow('Playlist with the given permalink not found');
  });

  it('getPlaylistByPermalinkAndProfileLink - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.getPlaylistByPermalinkAndProfileLink(
        req as Request,
        res as Response,
      ),
    ).rejects.toThrow('bad request');
  });

  it('getPlaylistsForArtist - success (authenticated)', async () => {
    mockValid({ params: { id: 'artist1' }, query: { offset: 0, limit: 10 } });
    service.getPlaylistsForArtist.mockResolvedValue([{ id: 'p1' }] as any);

    await controller.getPlaylistsForArtist(req as Request, res as Response);

    expect(service.getPlaylistsForArtist).toHaveBeenCalledWith(
      'artist1',
      0,
      10,
      'user1',
    );
    expect(res.json).toHaveBeenCalledWith({
      message: 'Playlists for artist retrieved successfully',
      data: { playlists: [{ id: 'p1' }] },
    });
  });

  it('getPlaylistsForArtist - unauthenticated passes null', async () => {
    req.userInfo = undefined;
    mockValid({ params: { id: 'artist1' }, query: { offset: 0, limit: 10 } });
    service.getPlaylistsForArtist.mockResolvedValue([] as any);

    await controller.getPlaylistsForArtist(req as Request, res as Response);

    expect(service.getPlaylistsForArtist).toHaveBeenCalledWith(
      'artist1',
      0,
      10,
      null,
    );
  });

  it('getPlaylistsForArtist - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.getPlaylistsForArtist(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });
});
