import { Types } from 'mongoose';

import User, { IUser } from '../../shared/models/models.user';
import Following from '../../shared/models/models.following';
import Track from '../../shared/models/models.track';
import Playlist from '../../shared/models/models.playlist';
import Plays from '../../shared/models/models.plays';
import SearchHistory from '../../shared/models/models.search-history';

import { SearchQueryDTOType } from './dtos/feed.request.query';
import {
  SearchSuggestionDTOType,
  SearchResponseDTOType,
  SearchHistoryItemDTOType,
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
        $match: {
          _id: { $in: followedIds.map((id) => new Types.ObjectId(id)) },
        },
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
          actorId: { $toString: '$_id' },
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
    const { q, tag, limit = 20, offset = 0 } = params;

    const limitHint = limit + offset;

    const regex = new RegExp(q, 'i');

    const query: any = {
      title: regex,
      playlistType: 'album',
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
      results: results.map((a) => ({
        id: a._id.toString(),
        type: 'album' as const,
      })),
      count,
    };
  }

  async getSearchHistory(userId: string): Promise<SearchHistoryItemDTOType[]> {
    const history = await SearchHistory.findOne({ userId }).lean();

    if (!history?.historyList?.length) return [];

    const items = history.historyList;

    const trackIds = items.filter((i) => i.type === 'track').map((i) => i.id);
    const userIds = items.filter((i) => i.type === 'user').map((i) => i.id);
    const playlistIds = items
      .filter((i) => i.type === 'playlist')
      .map((i) => i.id);

    const tracks = trackIds.length
      ? await Track.find({ _id: { $in: trackIds } })
          .select('_id basicInfo.title image.url posterId')
          .lean()
      : [];

    const playlists = playlistIds.length
      ? await Playlist.find({ _id: { $in: playlistIds } })
          .select('_id title image.url artistId')
          .lean()
      : [];

    const trackOwnerIds = tracks.map((t) => t.posterId);
    const playlistOwnerIds = playlists.map((p) => p.artistId);

    const allUserIds = [...userIds, ...trackOwnerIds, ...playlistOwnerIds];

    const users = allUserIds.length
      ? await User.find({ _id: { $in: allUserIds } })
          .select('_id displayName profileImg.imgLink city')
          .lean()
      : [];

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));
    const trackMap = new Map(tracks.map((t) => [t._id.toString(), t]));
    const playlistMap = new Map(playlists.map((p) => [p._id.toString(), p]));

    return items.map((item) =>
      this.resolveHistoryItem(item, trackMap, playlistMap, userMap),
    );
  }

  private resolveHistoryItem(
    item: { id: any; type: string },
    trackMap: Map<string, any>,
    playlistMap: Map<string, any>,
    userMap: Map<string, any>,
  ): SearchHistoryItemDTOType {
    const id = item.id.toString();

    if (item.type === 'track') {
      const t = trackMap.get(id);
      const owner = t?.posterId ? userMap.get(t.posterId.toString()) : null;

      return {
        id,
        type: 'track',
        title: t?.basicInfo.title ?? '',
        imageUrl: t?.image?.url ?? null,
        metadata: owner?.displayName ?? null,
      };
    }

    if (item.type === 'playlist') {
      const p = playlistMap.get(id);
      const owner = p?.artistId ? userMap.get(p.artistId.toString()) : null;

      return {
        id,
        type: 'playlist',
        title: p?.title ?? '',
        imageUrl: p?.image?.url ?? null,
        metadata: owner?.displayName ?? null,
      };
    }

    const u = userMap.get(id);

    return {
      id,
      type: 'user',
      title: u?.displayName ?? '',
      imageUrl: u?.profileImg?.imgLink ?? null,
      metadata: u?.city ?? null,
    };
  }

  async addToSearchHistory(
    userId: string,
    item: { id: string; type: 'track' | 'user' | 'playlist' },
  ): Promise<void> {
    const history = await SearchHistory.findOne({ userId });

    if (!history) {
      await SearchHistory.create({
        userId,
        historyList: [item],
      });
      return;
    }

    history.historyList = history.historyList.filter(
      (h) => !(h.id.toString() === item.id),
    );

    history.historyList.unshift({ ...item, id: new Types.ObjectId(item.id) });

    if (history.historyList.length > 20) {
      history.historyList = history.historyList.slice(0, 20);
    }

    await history.save();
  }

  async deleteSearchHistoryItem(
    userId: string,
    historyId: string,
  ): Promise<boolean> {
    const result = await SearchHistory.updateOne(
      { userId },
      {
        $pull: {
          historyList: {
            id: new Types.ObjectId(historyId),
          },
        },
      },
    );

    return result.modifiedCount > 0;
  }
}
