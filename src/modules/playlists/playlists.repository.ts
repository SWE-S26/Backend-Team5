import { Types } from 'mongoose';
import Playlist, { IPlaylist } from '../../shared/models/models.playlist';
import Track, { ITrack } from '../../shared/models/models.track';
import User, { IUser } from '../../shared/models/models.user';
import BlockedList from '../../shared/models/models.blocked-list';
import Following from '../../shared/models/models.following';
import { PlaylistArtistDetailsDTOType } from './dtos/playlists.response';
import { UpdatePlaylistInfoInput } from './dtos/playlists.request';
import {
  redisRepoCacher,
  RedisObjectType,
} from '../../shared/abstractions/redis/redisRepoCacher';
import {
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors/responseErrors';

export type TrackInPlaylist = Omit<ITrack, 'likedBy'> & {
  poster: Pick<IUser, 'displayName' | 'profileLink'> | null;
  isLiked: boolean;
  isReposted: boolean;
};

export type PlaylistWithTracks = Omit<IPlaylist, 'listOfTracks'> & {
  tracks: TrackInPlaylist[];
  totalTracks: number;
  totalPages: number;
  page: number;
  isLiked: boolean;
  isReposted: boolean;
};

const TRACKS_PER_PAGE = 20;

export class PlaylistsRepository {
  private validateEditingUser(
    playlist: IPlaylist | null,
    userId: string,
  ): Error | void {
    if (!playlist) {
      throw NotFoundError('Playlist not found');
    }

    if (playlist.artistId.toString() !== userId) {
      throw ForbiddenError('This is not your playlist, you cannot edit it');
    }
  }

  async findAll(
    limit: number,
    offset: number = 1,
    userId: string | null = null,
  ): Promise<(IPlaylist & { isLiked: boolean; isReposted: boolean })[]> {
    const skip = (offset - 1) * limit;

    let blockedUserIds: Types.ObjectId[] = [];

    if (userId) {
      const { blockedByMe, blockedMe } = await this.getBlockedRelations(userId);

      blockedUserIds = [
        ...blockedByMe,
        ...blockedMe.map((id) => new Types.ObjectId(id)),
      ];
    }

    const baseMatch: any = {
      type: 'public',
    };

    if (userId && blockedUserIds.length > 0) {
      baseMatch.artistId = { $nin: blockedUserIds };
    }

    const viewerStages = userId
      ? [
          {
            $lookup: {
              from: 'users',
              pipeline: [
                { $match: { _id: new Types.ObjectId(userId) } },
                {
                  $project: {
                    likedPlaylists: 1,
                    reposts: {
                      $filter: {
                        input: '$reposts',
                        as: 'r',
                        cond: { $eq: ['$$r.type', 'playlist'] },
                      },
                    },
                  },
                },
              ],
              as: '_viewer',
            },
          },
          { $addFields: { _viewer: { $arrayElemAt: ['$_viewer', 0] } } },
        ]
      : [
          {
            $addFields: {
              _viewer: { likedPlaylists: [], reposts: [] },
            },
          },
        ];

    return await Playlist.aggregate([
      { $match: baseMatch },

      { $skip: skip },
      { $limit: limit },

      ...viewerStages,

      {
        $addFields: {
          isLiked: {
            $in: ['$_id', { $ifNull: ['$_viewer.likedPlaylists', []] }],
          },
          isReposted: {
            $in: [
              { $toString: '$_id' },
              {
                $map: {
                  input: { $ifNull: ['$_viewer.reposts', []] },
                  as: 'r',
                  in: '$$r.id',
                },
              },
            ],
          },
        },
      },

      {
        $project: {
          _viewer: 0,
        },
      },
    ]);
  }

  async getBlockedRelations(userId: string) {
    const myBlockDoc = await BlockedList.findOne({ blockerId: userId })
      .select('blockedIds')
      .lean()
      .exec();

    const blockedByMe = myBlockDoc?.blockedIds || [];

    const blockedMeDocs = await BlockedList.find({
      blockedIds: userId,
    })
      .select('blockerId')
      .lean()
      .exec();

    const blockedMe = blockedMeDocs.map((doc) => doc.blockerId.toString());

    return {
      blockedByMe,
      blockedMe,
    };
  }

  async isUserBlocked(artistId: string, userId: string): Promise<boolean> {
    const blockedDoc = await BlockedList.findOne({ blockerId: artistId })
      .select('blockedIds')
      .lean()
      .exec();

    return (
      blockedDoc?.blockedIds.some(
        (blockedUserId) => blockedUserId.toString() === userId,
      ) || false
    );
  }

  async findById(id: string): Promise<IPlaylist | null> {
    return await Playlist.findByIdCached(id);
  }

  async findNumberOfPostedPlaylists(
    artistId: string,
  ): Promise<{ _id: Types.ObjectId; playlists: Types.ObjectId[] } | null> {
    return await User.findById(artistId).select('playlists').lean().exec();
  }

  async findTrackLengthesByIds(ids: string[]): Promise<number | Error> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    const tracks = await Track.find({ _id: { $in: objectIds } })
      .select('durationInSeconds')
      .lean()
      .exec();
    if (tracks.length !== ids.length) {
      return new Error('One or more tracks not found');
    }
    return tracks.reduce((total, track) => total + track.durationInSeconds, 0);
  }

  /**
   * el hay2oly AI, 3ayezo y3melha be2do we yb2a yrga3ly law 3erf
   * y3melha fe sa3a
   */
  async findByIdWithTracks(
    playlistId: string,
    requestingUserId: string | null,
    offset: number = 1,
  ): Promise<PlaylistWithTracks | Error | null> {
    const skip = (offset - 1) * TRACKS_PER_PAGE;

    const somePlaylist = await this.findById(playlistId);

    if (
      requestingUserId &&
      (await this.isUserBlocked(
        somePlaylist!.artistId!.toString(),
        requestingUserId,
      ))
    ) {
      return new Error('You are blocked from accessing this playlist') as Error;
    }

    /*
     * Viewer lookup stage — injected conditionally.
     *
     * We pull only two fields from the viewer:
     *   likedTracks  – array of ObjectIds
     *   reposts      – filtered to type 'track' only
     *
     * Note: reposts.id is stored as a string, not an ObjectId.
     * We handle the ObjectId → string comparison later via $toString.
     *
     * If no viewer is authenticated we inject a synthetic empty object
     * so the rest of the pipeline never needs to branch.
     */
    const viewerStages = requestingUserId
      ? [
          {
            $lookup: {
              from: 'users',
              pipeline: [
                { $match: { _id: new Types.ObjectId(requestingUserId) } },
                {
                  $project: {
                    likedTracks: 1,
                    likedPlaylists: 1,
                    reposts: {
                      $filter: {
                        input: '$reposts',
                        as: 'r',
                        cond: { $in: ['$$r.type', ['track', 'playlist']] },
                      },
                    },
                  },
                },
              ],
              as: '_viewer',
            },
          },
          { $addFields: { _viewer: { $arrayElemAt: ['$_viewer', 0] } } },
        ]
      : [{ $addFields: { _viewer: { likedTracks: [], reposts: [] } } }];

    const [result] = await Playlist.aggregate<PlaylistWithTracks>([
      // ── 1. Find the playlist ────────────────────────────────────────────────
      { $match: { _id: new Types.ObjectId(playlistId) } },

      // ── 2. Snapshot total track count, then slice for this page ────────────
      {
        $addFields: {
          totalTracks: { $size: '$listOfTracks' },
          totalPages: {
            $ceil: { $divide: [{ $size: '$listOfTracks' }, TRACKS_PER_PAGE] },
          },
          _pageIds: { $slice: ['$listOfTracks', skip, TRACKS_PER_PAGE] },
          page: offset,
        },
      },

      // ── 3. Inject viewer data (liked / reposted context) ───────────────────
      ...viewerStages,

      // ── 4. Fetch paginated tracks + each track's poster in one lookup ───────
      //
      // Inner $lookup: poster details
      //   We only need displayName and profileLink from User.
      //   basicInfo.permalink already lives on the track itself.
      //
      {
        $lookup: {
          from: 'tracks',
          let: { ids: '$_pageIds' },
          pipeline: [
            { $match: { $expr: { $in: ['$_id', '$$ids'] } } },
            {
              $lookup: {
                from: 'users',
                let: { posterId: '$posterId' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$_id', '$$posterId'] } } },
                  {
                    $project: { displayName: 1, profileLink: 1 },
                  },
                ],
                as: 'poster',
              },
            },
            { $addFields: { poster: { $arrayElemAt: ['$poster', 0] } } },
            {
              $project: {
                'basicInfo.title': 1,
                'basicInfo.permalink': 1,
                'basicInfo.mainArtists': 1,
                audio: 1,
                image: 1,
                permissions: 1,
                durationInSeconds: 1,
                numOfPlays: 1,
                numOfLikes: 1,
                numOfReposts: 1,
                poster: 1,
                hidden: 1,
                isPrivate: '$basicInfo.isPrivate',
              },
            },
          ],
          as: '_fetchedTracks',
        },
      },

      // ── 5. Re-order tracks to match playlist order, add viewer flags ────────
      //
      // $lookup does NOT preserve the order of the input array — we must
      // map back over _pageIds (the ordered slice) and pick each track out.
      //
      // isLiked:    viewer.likedTracks contains the track's ObjectId
      // isReposted: viewer.reposts[].id (string) matches track._id as string
      //
      {
        $addFields: {
          isLiked: {
            $in: ['$_id', { $ifNull: ['$_viewer.likedPlaylists', []] }],
          },
          isReposted: {
            $in: [
              { $toString: '$_id' },
              {
                $map: {
                  input: {
                    $filter: {
                      input: { $ifNull: ['$_viewer.reposts', []] },
                      as: 'r',
                      cond: { $eq: ['$$r.type', 'playlist'] },
                    },
                  },
                  as: 'r',
                  in: '$$r.id',
                },
              },
            ],
          },
          tracks: {
            $map: {
              input: '$_pageIds',
              as: 'tid',
              in: {
                $let: {
                  vars: {
                    track: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$_fetchedTracks',
                            as: 't',
                            cond: { $eq: ['$$t._id', '$$tid'] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                  in: {
                    $mergeObjects: [
                      '$$track',
                      {
                        isLiked: {
                          $in: [
                            '$$track._id',
                            { $ifNull: ['$_viewer.likedTracks', []] },
                          ],
                        },
                        isReposted: {
                          $in: [
                            { $toString: '$$track._id' },
                            {
                              $map: {
                                input: {
                                  $ifNull: ['$_viewer.reposts', []],
                                },
                                as: 'r',
                                in: '$$r.id',
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },

      // ── 6. Clean up all internal pipeline fields ────────────────────────────
      {
        $project: {
          listOfTracks: 0, // replaced by `tracks`
          _pageIds: 0,
          _fetchedTracks: 0,
          _viewer: 0,
        },
      },
    ]);

    return result ?? null;
  }

  async create(
    playlistName: string,
    artistId: string,
    tracks: Types.ObjectId[],
    isPrivate: boolean,
    playlistDuration: number,
  ): Promise<IPlaylist> {
    const playlist = new Playlist({
      title: playlistName,
      permaLink: playlistName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-'),
      artistId,
      listOfTracks: tracks,
      type: isPrivate ? 'private' : 'public',
      playlistLengthInSeconds: playlistDuration,
    });
    return (await playlist.save()).toObject() as IPlaylist;
  }

  async addTrackToEndOfPlaylist(
    trackId: string,
    playlistId: string,
    userId: string,
  ): Promise<Error | void> {
    const playlist = await this.findById(playlistId);

    this.validateEditingUser(playlist, userId);

    const track = await Track.findById(trackId).exec();
    if (!track) {
      return new Error('Track not found');
    }

    if (playlist!.listOfTracks.some((t) => t.toString() === trackId)) {
      return new Error('Track already exists in the playlist');
    }

    await Playlist.findByIdAndUpdate(
      { _id: playlistId },
      {
        $push: { listOfTracks: track._id },
        $inc: { playlistLengthInSeconds: track.durationInSeconds },
      },
      { new: true },
    ).exec();
  }

  async updateImage(
    playlistId: string,
    publicUrl: string,
    publicId: string,
    userId: string,
  ): Promise<IPlaylist> {
    const playlist = await this.findById(playlistId);
    this.validateEditingUser(playlist, userId);

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        image: { imgLink: publicUrl, publicId },
      },
      { new: true },
    ).lean();

    if (!updatedPlaylist) {
      throw NotFoundError('Playlist not found');
    }

    return updatedPlaylist as IPlaylist;
  }

  async updateOrderOfSignleTrack(
    playlistId: string,
    trackId: string,
    oldPosition: number,
    newPosition: number,
    userId: string,
  ): Promise<Error | boolean> {
    const playlist = await this.findById(playlistId);

    if (!playlist) {
      return new Error('Playlist not found');
    }

    this.validateEditingUser(playlist, userId);

    const tracks = playlist.listOfTracks;
    const length = tracks.length;

    if (oldPosition < 0 || oldPosition >= length) {
      return new Error('Old position is out of bounds');
    }

    if (newPosition < 0 || newPosition >= length) {
      return new Error('New position is out of bounds');
    }

    if (oldPosition === newPosition) {
      return true;
    }

    const targetTrackId = tracks[oldPosition];

    if (!targetTrackId || trackId.toString() !== targetTrackId.toString()) {
      return new Error(
        'Track not found in the old position given in the playlist',
      );
    }

    const [movedTrack] = tracks.splice(oldPosition, 1);
    tracks.splice(newPosition, 0, movedTrack);

    await Playlist.findByIdAndUpdate(playlistId, {
      listOfTracks: tracks,
    }).exec();

    return true;
  }

  async findByPermalink(
    permalink: string,
    userId: string | null,
  ): Promise<PlaylistWithTracks | Error | null> {
    const playlist = await Playlist.findOne({ permaLink: permalink })
      .lean()
      .exec();

    if (!playlist) {
      return null;
    }

    const playlistPro = await this.findByIdWithTracks(
      playlist._id.toString(),
      userId,
    );

    return playlistPro;
  }

  async updatePlaylist(
    playlist: UpdatePlaylistInfoInput,
  ): Promise<Error | boolean> {
    const { id } = playlist.params;
    const { body } = playlist;

    const objectIds = body.listOfTracks.map((id) => new Types.ObjectId(id));
    const [result] = await Track.aggregate([
      { $match: { _id: { $in: objectIds } } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          totalDuration: { $sum: '$durationInSeconds' },
        },
      },
    ]);

    if (!result || result.count !== body.listOfTracks.length) {
      return new Error('One or more tracks not found');
    }

    const existingPlaylist = await Playlist.find({
      permaLink: body.permalink,
      _id: { $ne: id },
    });

    if (existingPlaylist.length > 0) {
      return new Error('A playlist with this permalink already exists');
    }

    const { totalDuration } = result;

    await Playlist.findByIdAndUpdate(id, {
      title: body.title,
      description: body.description,
      genre: body.genre,
      additionalTags: body.additionalTags,
      releaseDate: body.releaseDate,
      listOfTracks: body.listOfTracks,
      type: body.type,
      playlistType: body.playlistType,
      recordLabel: body.recordLabel,
      playlistLengthInSeconds: totalDuration,
    }).exec();

    return true;
  }

  async getArtistDetails(
    artistId: string,
    userId: string | null,
  ): Promise<PlaylistArtistDetailsDTOType | null> {
    const artist = await User.findById(artistId)
      .select('displayName profileLink profileImg')
      .lean()
      .exec();

    if (!artist) {
      return null;
    }

    const followingDoc = await Following.findOne({ userId: artistId })
      .select('followers')
      .lean()
      .exec();

    const followersCount = followingDoc?.followers?.length || 0;

    let isFollowed = false;

    if (userId) {
      const myFollowing = await Following.findOne({ userId })
        .select('followed')
        .lean()
        .exec();

      isFollowed =
        myFollowing?.followed?.some((id) => id.toString() === artistId) ||
        false;
    }

    return {
      displayName: artist.displayName,
      profileLink: artist.profileLink,
      profileImage: artist.profileImg,
      followersCount,
      isFollowed,
    };
  }

  async getMorePlaylistsFromSameArtist(
    artistId: string,
    excludePlaylistId: string,
    userId: string | null = null,
  ): Promise<IPlaylist[] | Error> {
    if (userId) {
      const isUserBlocked = await this.isUserBlocked(artistId, userId);

      if (isUserBlocked) {
        return new Error('You are blocked from accessing this artist');
      }
    }

    const playlists = await Playlist.find({
      artistId,
      _id: { $ne: new Types.ObjectId(excludePlaylistId) },
      type: 'public',
    })
      .limit(5)
      .lean()
      .exec();

    await Promise.all(
      playlists.map((p) =>
        redisRepoCacher.cacheObject(
          RedisObjectType.PLAYLIST,
          p._id.toString(),
          p,
        ),
      ),
    );
    return playlists;
  }

  async getMyPlaylists(
    artistId: string,
    offset: number = 1,
    limit: number = 5,
  ): Promise<IPlaylist[]> {
    return await Playlist.find({ artistId })
      .skip((offset - 1) * limit)
      .limit(limit)
      .lean()
      .exec();
  }

  async getPlaylistsForArtist(
    artistId: string,
    offset: number = 1,
    limit: number = 5,
    userId: string | null,
    getAlbums: boolean = false,
  ): Promise<IPlaylist[] | Error> {
    if (userId) {
      const isUserBlocked = await this.isUserBlocked(artistId, userId);

      if (isUserBlocked) {
        return new Error('You are blocked from accessing this artist');
      }
    }

    return await Playlist.find({
      artistId,
      type: 'public',
      ...(getAlbums ? { playlistType: 'album' } : {}),
    })
      .skip((offset - 1) * limit)
      .limit(limit)
      .lean()
      .exec();
  }

  async delete(playlistId: string, userId: string): Promise<boolean | Error> {
    const playlist = await this.findById(playlistId);

    if (!playlist) {
      return false;
    }

    this.validateEditingUser(playlist, userId);

    const deleted = await Playlist.findByIdAndDelete(playlistId).exec();
    return deleted !== null;
  }
}
