import { Types } from 'mongoose';

import User, { IUser } from '../../shared/models/models.user';
import Following from '../../shared/models/models.following';
import Track from '../../shared/models/models.track';
import Playlist from '../../shared/models/models.playlist';
import Plays from '../../shared/models/models.plays';

import { SearchQueryDTOType } from './dtos/feed.request.query';
import {
  SearchSuggestionDTOType,
  SearchResponseDTOType,
} from './dtos/feed.response';

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

  async getTrendingByGenresAndTags(
    userId: string,
    limitHint: number,
  ): Promise<string[]> {
    const userGenres = await Track.distinct('basicInfo.genre', {
      posterId: userId,
    });

    const userTags = await Track.distinct('basicInfo.tags', {
      posterId: userId,
    });

    if (!userGenres.length && !userTags.length) {
      return [];
    }

    const tracks = await Track.find(
      {
        hidden: false,
        'basicInfo.isPrivate': false,
        posterId: { $ne: userId },

        $or: [
          { 'basicInfo.genre': { $in: userGenres } },
          { 'basicInfo.tags': { $in: userTags } },
        ],
      },
      {
        _id: 1,
      },
    )
      .limit(limitHint)
      .lean();

    return tracks.map((t) => t._id.toString());
  }

  async getTrendingByStats(limitHint: number): Promise<string[]> {
    const tracks = await Track.find(
      {
        hidden: false,
        'basicInfo.isPrivate': false,
      },
      { _id: 1 },
    )
      .sort({
        numberOfReposts: -1,
        numOfLikes: -1,
        numOfPlays: -1,
      })
      .limit(limitHint)
      .lean();

    return tracks.map((t) => t._id.toString());
  }

  async getTrendingByRecentPlays(limitHint: number): Promise<string[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const tracks = await Plays.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: '$trackId',
          totalPlays: { $sum: '$numberOfPlay' },
        },
      },
      {
        $sort: {
          totalPlays: -1,
        },
      },
      {
        $limit: limitHint,
      },
      {
        $project: {
          _id: 1,
        },
      },
    ]);

    return tracks.map((t) => t._id.toString());
  }

  async getPersonalizedSearchSuggestions(
    userId: string,
    searchQuery: string,
  ): Promise<SearchSuggestionDTOType[]> {
    const user = await User.findById(userId)
      .select('likedTracks likedPlaylists')
      .lean();

    const following = await Following.findOne({ userId })
      .select('followed')
      .lean();

    const likedTracks = user?.likedTracks ?? [];
    const likedPlaylists = user?.likedPlaylists ?? [];
    const followedUsers = following?.followed ?? [];

    const regex = new RegExp(searchQuery, 'i');

    const trackPromise = Track.find({
      _id: { $in: likedTracks },
      'basicInfo.title': regex,
    })
      .limit(2)
      .select({
        _id: 1,
        title: '$basicInfo.title',
        image: '$image.url',
      })
      .lean();

    const playlistPromise = Playlist.find({
      _id: { $in: likedPlaylists },
      title: regex,
    })
      .limit(2)
      .select({
        _id: 1,
        title: 1,
        image: '$image.url',
      })
      .lean();

    const userPromise = User.find({
      _id: { $in: followedUsers },
      displayName: regex,
    })
      .limit(2)
      .select({
        _id: 1,
        displayName: 1,
        profileImg: 1,
      })
      .lean();

    const [tracks, playlists, users] = await Promise.all([
      trackPromise,
      playlistPromise,
      userPromise,
    ]);

    const trackSearch: SearchSuggestionDTOType[] = tracks.map((t) => ({
      id: t._id.toString(),
      title: t.basicInfo?.title ?? '',
      type: 'track',
      imgLink: t.image?.url ?? null,
      isPersonalized: true,
    }));

    const playlistSearch: SearchSuggestionDTOType[] = playlists.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      type: 'playlist',
      imgLink: p.image?.url ?? null,
      isPersonalized: true,
    }));

    const userSearch: SearchSuggestionDTOType[] = users.map((u) => ({
      id: u._id.toString(),
      title: u.displayName,
      type: 'user',
      imgLink: u.profileImg?.imgLink ?? null,
      isPersonalized: true,
    }));

    return [...trackSearch, ...playlistSearch, ...userSearch].slice(0, 2);
  }

  async getGlobalSearchSuggestions(
    searchQuery: string,
    limit: number,
  ): Promise<SearchSuggestionDTOType[]> {
    const regex = new RegExp(searchQuery, 'i');

    const trackPromise = Track.find({
      'basicInfo.title': regex,
    })
      .limit(limit)
      .select({
        _id: 1,
        'basicInfo.title': 1,
      })
      .lean();

    const playlistPromise = Playlist.find({
      title: regex,
    })
      .limit(limit)
      .select({
        _id: 1,
        title: 1,
      })
      .lean();

    const userPromise = User.find({
      displayName: regex,
    })
      .limit(limit)
      .select({
        _id: 1,
        displayName: 1,
      })
      .lean();

    const [tracks, playlists, users] = await Promise.all([
      trackPromise,
      playlistPromise,
      userPromise,
    ]);

    const trackResults = tracks.map((t) => ({
      id: t._id.toString(),
      title: t.basicInfo.title,
      isPersonalized: false,
    }));

    const playlistResults = playlists.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      isPersonalized: false,
    }));

    const userResults = users.map((u) => ({
      id: u._id.toString(),
      title: u.displayName,
      isPersonalized: false,
    }));

    return [...trackResults, ...playlistResults, ...userResults].slice(
      0,
      limit,
    );
  }

  async searchTracks(params: SearchQueryDTOType) {
    const {
      q,
      dateRange,
      duration,
      usage,
      tag,
      limit = 20,
      offset = 0,
    } = params;

    const limitHint = limit + offset;

    const regex = new RegExp(q, 'i');

    const query: any = {
      'basicInfo.title': regex,
      hidden: false,
      'basicInfo.isPrivate': false,
    };

    if (tag) {
      query['basicInfo.tags'] = tag;
    }

    if (duration && duration !== 'all') {
      if (duration === 'lt2') query.durationInSeconds = { $lt: 120 };
      if (duration === '2to10')
        query.durationInSeconds = { $gte: 120, $lte: 600 };
      if (duration === '10to30')
        query.durationInSeconds = { $gte: 600, $lte: 1800 };
      if (duration === 'gt30') query.durationInSeconds = { $gt: 1800 };
    }

    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      const past = new Date();

      if (dateRange === 'hour') past.setHours(now.getHours() - 1);
      if (dateRange === 'day') past.setDate(now.getDate() - 1);
      if (dateRange === 'week') past.setDate(now.getDate() - 7);
      if (dateRange === 'month') past.setMonth(now.getMonth() - 1);
      if (dateRange === 'year') past.setFullYear(now.getFullYear() - 1);

      query.createdAt = { $gte: past };
    }

    if (usage) {
      if (usage === 'commercial') query['license.nonCommercial'] = false;
      if (usage === 'modify') query['license.noDerivativeWorks'] = false;
      if (usage === 'share') query['license.shareAlike'] = true;
    }

    const [results, count] = await Promise.all([
      Track.find(query).limit(limitHint).select({ _id: 1 }).lean(),

      Track.countDocuments(query),
    ]);

    return {
      results: results.map((t) => ({
        id: t._id.toString(),
        type: 'track' as const,
      })),
      count,
    };
  }

  async searchUsers(params: SearchQueryDTOType) {
    const { q, location, limit = 20, offset = 0 } = params;

    const limitHint = limit + offset;

    const regex = new RegExp(q, 'i');

    const query: any = {
      displayName: regex,
    };

    if (location) {
      query.city = new RegExp(location, 'i');
    }

    const [results, count] = await Promise.all([
      User.find(query).limit(limitHint).select({ _id: 1 }).lean(),

      User.countDocuments(query),
    ]);

    return {
      results: results.map((u) => ({
        id: u._id.toString(),
        type: 'user' as const,
      })),
      count,
    };
  }

  async searchPlaylists(params: SearchQueryDTOType) {
    const { q, tag, limit = 20, offset = 0 } = params;

    const limitHint = limit + offset;

    const regex = new RegExp(q, 'i');

    const query: any = {
      title: regex,
      type: 'public',
    };

    if (tag) {
      query.additionalTags = tag;
    }

    const [results, count] = await Promise.all([
      Playlist.find(query).limit(limitHint).select({ _id: 1 }).lean(),

      Playlist.countDocuments(query),
    ]);

    return {
      results: results.map((p) => ({
        id: p._id.toString(),
        type: 'playlist' as const,
      })),
      count,
    };
  }

  async searchAlbums(params: SearchQueryDTOType) {
    const { q, limit = 20, offset = 0 } = params;

    const limitHint = limit + offset;

    const regex = new RegExp(q, 'i');

    const query: any = {
      title: regex,
      playlistType: 'album',
      type: 'public',
    };

    const [results, count] = await Promise.all([
      Playlist.find(query).limit(limitHint).select({ _id: 1 }).lean(),

      Playlist.countDocuments(query),
    ]);

    return {
      results: results.map((a) => ({
        id: a._id.toString(),
        type: 'album' as const,
      })),
      count,
    };
  }
}
