import { Types } from 'mongoose';

import User, { IUser } from '../../shared/models/models.user';
import Following from '../../shared/models/models.following';
import Track from '../../shared/models/models.track';
import Playlist from '../../shared/models/models.playlist';

export interface feedItem {
  id: string;
  type: 'playlist' | 'track';
  isRepost: boolean;
  createdAt: Date;
  actorId: string;
}

export interface actor {
  actorId: string;
  displayName: string;
  imgLink: string;
}

export class FeedRepository {
  async getUserById(id: string): Promise<IUser | null> {
    return await User.findById(id).lean();
  }

  async getUsersIds(id: string): Promise<string[]> {
    const followDoc = await Following.findOne(
      { userId: id },
      { followed: 1 },
    ).lean();
    return (followDoc?.followed ?? []).map(String);
  }

  async getPostsFeed(
    followedIds: string[],
    limitHint: number,
  ): Promise<feedItem[]> {
    const tracks = await Track.find(
      {
        posterId: { $in: followedIds },
        hidden: false,
      },
      {
        createdAt: 1,
        posterId: 1,
      },
    )
      .sort({ createdAt: -1 })
      .limit(limitHint)
      .lean();

    const trackActivities = tracks.map((t) => ({
      id: t._id.toString(),
      type: 'track' as const,
      isRepost: false,
      createdAt: t.createdAt,
      actorId: t.posterId.toString(),
    }));

    const playlists = await Playlist.find(
      {
        artistId: { $in: followedIds },
        type: 'public',
      },
      {
        createdAt: 1,
        artistId: 1,
      },
    )
      .sort({ createdAt: -1 })
      .limit(limitHint)
      .lean();

    const playlistActivities = playlists.map((pl) => ({
      id: pl._id.toString(),
      type: 'playlist' as const,
      isRepost: false,
      createdAt: pl.createdAt,
      actorId: pl.artistId.toString(),
    }));

    return [...trackActivities, ...playlistActivities];
  }

  async getRepostsFeed(
    followedIds: string[],
    limitHint: number,
  ): Promise<feedItem[]> {
    const reposts = await User.aggregate([
      {
        $match: { _id: { $in: followedIds } },
      },
      {
        $unwind: '$reposts',
      },
      {
        $project: {
          id: '$reposts.id',
          type: '$reposts.type',
          isRepost: { $literal: true },
          createdAt: '$reposts.timestamp',
          actorId: '$_id',
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $limit: limitHint,
      },
    ]);

    return reposts;
  }

  async getActorsInfo(actorsIds: string[]): Promise<actor[]> {
    const actors = await User.find(
      {
        _id: { $in: actorsIds },
      },
      {
        displayName: 1,
        'profileImg.imgLink': 1,
      },
    ).lean();

    return actors.map((a) => ({
      actorId: a._id.toString(),
      displayName: a.displayName,
      imgLink: a.profileImg?.imgLink ?? null,
    }));
  }
}
