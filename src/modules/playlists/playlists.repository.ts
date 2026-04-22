import { Types } from 'mongoose';
import Playlist, { IPlaylist } from '../../shared/models/models.playlist';
import Track, { ITrack } from '../../shared/models/models.track';
import User, { IUser } from '../../shared/models/models.user';
import BlockedList from '../../shared/models/models.blocked-list';
import Following from '../../shared/models/models.following';
import { PlaylistArtistDetailsDTOType } from './dtos/playlists.response';
import { NotFoundError } from '../../shared/errors/responseErrors';

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

  async findTracksOfPlaylist(
    ids: string[],
  ): Promise<{ _id: Types.ObjectId; durationInSeconds: number }[]> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    return await Track.find({ _id: { $in: objectIds } })
      .select('_id durationInSeconds')
      .lean()
      .exec();
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
      artistId,
      listOfTracks: tracks,
      type: isPrivate ? 'private' : 'public',
      playlistLengthInSeconds: playlistDuration,
    });
    return (await playlist.save()).toObject() as IPlaylist;
  }

  async updateImage(
    playlistId: string,
    publicUrl: string,
    publicId: string,
  ): Promise<IPlaylist> {
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      {
        image: { imgLink: publicUrl, publicId },
      },
      { new: true },
    ).lean();

    if (!updatedPlaylist) {
      throw new Error('Playlist not found');
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
    const playlist = await Playlist.findByIdCached(playlistId);

    if (!playlist) {
      return new Error('Playlist not found');
    }

    if (playlist.artistId.toString() !== userId) {
      return new Error('This is not your playlist, you cannot update it');
    }

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
    limit: number = 5,
  ): Promise<IPlaylist[]> {
    return await Playlist.find({
      artistId,
      _id: { $ne: new Types.ObjectId(excludePlaylistId) },
      type: 'public',
    })
      .limit(limit)
      .lean()
      .exec();
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
    })
      .skip((offset - 1) * limit)
      .limit(limit)
      .lean()
      .exec();
  }

  async delete(playlistId: string): Promise<boolean> {
    const deleted = await Playlist.findByIdAndDelete(playlistId).exec();
    return deleted !== null;
  }
}
