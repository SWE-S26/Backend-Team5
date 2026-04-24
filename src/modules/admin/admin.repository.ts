import { PipelineStage, Types } from 'mongoose';
import axios from 'axios';
import crypto from 'crypto';
import User, { IUser } from '../../shared/models/models.user';
import Track from '../../shared/models/models.track';
import Report from '../../shared/models/models.report';
import {
  AdminAnalyticsOverviewRow,
  AdminAnalyticsStorageRow,
  AdminMediaListRow,
  AdminReportRow,
  AdminUserListRow,
} from './dtos/admin.mapper';

type ListUsersFilters = {
  offset: number;
  limit: number;
  role?: IUser['role'];
  suspended?: boolean;
  query?: string;
};

type ListUsersResult = {
  users: AdminUserListRow[];
  total: number;
};

type ListMediaFilters = {
  offset: number;
  limit: number;
  query?: string;
};

type ListMediaResult = {
  items: AdminMediaListRow[];
  total: number;
};

type CreateReportPayload = {
  reporterId: string;
  violatorId: string;
  violatorType: 'user' | 'track';
  reason: string;
};

type AnalyticsOverviewResult = AdminAnalyticsOverviewRow;

type AnalyticsStorageResult = AdminAnalyticsStorageRow;

type PublitioListFile = {
  size?: number | string;
};

type PublitioListResponse = {
  files?: PublitioListFile[];
  files_total?: number | string;
  files_count?: number | string;
};

type PublitioCredentials = {
  apiKey: string;
  apiSecret: string;
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class AdminRepository {
  private getPublitioCredentials(): PublitioCredentials[] {
    const credentialPairs: PublitioCredentials[] = [];
    const suffixes = ['', '2', '3', '4'];

    for (const suffix of suffixes) {
      const apiKey = process.env[`PUBLITO_KEY${suffix}`];
      const apiSecret = process.env[`PUBLITO_SECRET${suffix}`];

      if (apiKey && apiSecret) {
        credentialPairs.push({ apiKey, apiSecret });
      }
    }

    return credentialPairs;
  }

  private generatePublitioNonce() {
    const min = 10000000;
    const max = 99999999;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  private generatePublitioTimestamp() {
    return Math.floor(Date.now() / 1000).toString();
  }

  private generatePublitioSignature(
    nonce: string,
    timestamp: string,
    secret: string,
  ) {
    return crypto
      .createHash('sha1')
      .update(`${timestamp}${nonce}${secret}`)
      .digest('hex');
  }

  private buildPublitioAuthParams(apiKey: string, apiSecret: string) {
    const nonce = this.generatePublitioNonce();
    const timestamp = this.generatePublitioTimestamp();

    return {
      api_key: apiKey,
      api_nonce: nonce,
      api_timestamp: timestamp,
      api_signature: this.generatePublitioSignature(
        nonce,
        timestamp,
        apiSecret,
      ),
    };
  }

  private parseNonNegativeNumber(value: unknown) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return 0;
    }
    return parsed;
  }

  async findAll(filters: ListUsersFilters): Promise<ListUsersResult> {
    const match: Record<string, unknown> = {};

    if (filters.role) {
      match.role = filters.role;
    }

    if (typeof filters.suspended === 'boolean') {
      match.ban = filters.suspended;
    }

    if (filters.query) {
      const regex = new RegExp(escapeRegex(filters.query), 'i');
      match.$or = [{ displayName: regex }, { email: regex }];
    }

    const skip = (filters.offset - 1) * filters.limit;

    const pipeline: PipelineStage[] = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          users: [
            { $skip: skip },
            { $limit: filters.limit },
            {
              $lookup: {
                from: 'followings',
                localField: '_id',
                foreignField: 'userId',
                as: 'followingDoc',
              },
            },
            {
              $lookup: {
                from: 'tracks',
                let: { userId: '$_id' },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ['$posterId', '$$userId'] },
                    },
                  },
                  { $count: 'count' },
                ],
                as: 'uploadedTracks',
              },
            },
            {
              $project: {
                _id: 1,
                displayName: 1,
                email: 1,
                role: 1,
                ban: 1,
                createdAt: 1,
                followersCount: {
                  $size: {
                    $ifNull: [{ $first: '$followingDoc.followers' }, []],
                  },
                },
                uploadedTracksCount: {
                  $ifNull: [{ $first: '$uploadedTracks.count' }, 0],
                },
              },
            },
          ],
          metadata: [{ $count: 'total' }],
        },
      },
      {
        $project: {
          users: 1,
          total: {
            $ifNull: [{ $first: '$metadata.total' }, 0],
          },
        },
      },
    ];

    const [result] = await User.aggregate<{
      users: AdminUserListRow[];
      total: number;
    }>(pipeline);

    return {
      users: result?.users ?? [],
      total: result?.total ?? 0,
    };
  }

  async findUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId).lean();
  }

  async findTrackById(trackId: string) {
    return Track.findById(trackId).lean();
  }

  async getAnalyticsOverview(): Promise<AnalyticsOverviewResult> {
    const [userStats, trackStats] = await Promise.all([
      User.aggregate<{
        totalUsers: number;
        proUsers: number;
        listenerUsers: number;
      }>([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            proUsers: {
              $sum: {
                $cond: [{ $eq: ['$role', 'Pro'] }, 1, 0],
              },
            },
            listenerUsers: {
              $sum: {
                $cond: [{ $eq: ['$role', 'Listener'] }, 1, 0],
              },
            },
          },
        },
      ]),
      Track.aggregate<{
        totalTracks: number;
        totalPlays: number;
      }>([
        {
          $group: {
            _id: null,
            totalTracks: { $sum: 1 },
            totalPlays: { $sum: '$numOfPlays' },
          },
        },
      ]),
    ]);

    return {
      totalUsers: userStats[0]?.totalUsers ?? 0,
      proUsers: userStats[0]?.proUsers ?? 0,
      listenerUsers: userStats[0]?.listenerUsers ?? 0,
      totalTracks: trackStats[0]?.totalTracks ?? 0,
      totalPlays: trackStats[0]?.totalPlays ?? 0,
    };
  }

  async getAnalyticsStorage(): Promise<AnalyticsStorageResult> {
    const limit = 100;
    let usedBytes = 0;
    const credentialsList = this.getPublitioCredentials();

    for (const credentials of credentialsList) {
      let offset = 0;
      let pageGuard = 0;

      while (pageGuard < 500) {
        const response = await axios.get<PublitioListResponse>(
          'https://api.publit.io/v1/files/list',
          {
            params: {
              ...this.buildPublitioAuthParams(
                credentials.apiKey,
                credentials.apiSecret,
              ),
              limit,
              offset,
            },
          },
        );

        const data = response.data;
        const files = Array.isArray(data?.files) ? data.files : [];

        for (const file of files) {
          usedBytes += this.parseNonNegativeNumber(file?.size);
        }

        const filesTotal = this.parseNonNegativeNumber(data?.files_total);
        const filesCount = this.parseNonNegativeNumber(data?.files_count);

        if (filesTotal > 0) {
          if (offset + files.length >= filesTotal) {
            break;
          }
        } else if (filesCount <= 0 || files.length === 0) {
          break;
        }

        offset += filesCount > 0 ? filesCount : files.length;
        pageGuard += 1;
      }
    }

    return {
      usedBytes: Math.trunc(usedBytes),
    };
  }

  async findAllMedia(filters: ListMediaFilters): Promise<ListMediaResult> {
    const skip = (filters.offset - 1) * filters.limit;
    const regex = filters.query
      ? new RegExp(escapeRegex(filters.query), 'i')
      : null;

    const trackProjectionPipeline: PipelineStage[] = [
      {
        $project: {
          _id: 0,
          title: '$basicInfo.title',
          artistId: '$posterId',
          type: { $literal: 'track' },
          numberOfPlays: '$numOfPlays',
          numberOfLikes: '$numOfLikes',
          ban: { $ifNull: ['$hidden', false] },
          createdAt: 1,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'artistId',
          foreignField: '_id',
          as: 'artistDoc',
        },
      },
      {
        $addFields: {
          artistName: {
            $ifNull: [{ $first: '$artistDoc.displayName' }, 'Unknown Artist'],
          },
        },
      },
      {
        $project: {
          title: 1,
          artistName: 1,
          type: 1,
          numberOfPlays: 1,
          numberOfLikes: 1,
          ban: 1,
          createdAt: 1,
        },
      },
    ];

    const sharedPipeline: PipelineStage[] = [
      ...(regex
        ? [
            {
              $match: {
                $or: [{ title: regex }, { artistName: regex }],
              },
            } as PipelineStage.Match,
          ]
        : []),
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: filters.limit }],
          metadata: [{ $count: 'total' }],
        },
      },
      {
        $project: {
          items: 1,
          total: {
            $ifNull: [{ $first: '$metadata.total' }, 0],
          },
        },
      },
    ];

    const [result] = await Track.aggregate<{
      items: AdminMediaListRow[];
      total: number;
    }>([...trackProjectionPipeline, ...sharedPipeline]);

    return {
      items: result?.items ?? [],
      total: result?.total ?? 0,
    };
  }

  async findAdminUserRowById(userId: string): Promise<AdminUserListRow | null> {
    const [result] = await User.aggregate<AdminUserListRow>([
      { $match: { _id: new Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'followings',
          localField: '_id',
          foreignField: 'userId',
          as: 'followingDoc',
        },
      },
      {
        $lookup: {
          from: 'tracks',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$posterId', '$$userId'] },
              },
            },
            { $count: 'count' },
          ],
          as: 'uploadedTracks',
        },
      },
      {
        $project: {
          _id: 1,
          displayName: 1,
          email: 1,
          role: 1,
          ban: 1,
          createdAt: 1,
          followersCount: {
            $size: {
              $ifNull: [{ $first: '$followingDoc.followers' }, []],
            },
          },
          uploadedTracksCount: {
            $ifNull: [{ $first: '$uploadedTracks.count' }, 0],
          },
        },
      },
      { $limit: 1 },
    ]);

    return result ?? null;
  }

  async findAdminMediaTrackRowById(
    trackId: string,
  ): Promise<AdminMediaListRow | null> {
    const [result] = await Track.aggregate<AdminMediaListRow>([
      { $match: { _id: new Types.ObjectId(trackId) } },
      {
        $project: {
          _id: 0,
          title: '$basicInfo.title',
          artistId: '$posterId',
          type: { $literal: 'track' },
          numberOfPlays: '$numOfPlays',
          numberOfLikes: '$numOfLikes',
          ban: { $ifNull: ['$hidden', false] },
          createdAt: 1,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'artistId',
          foreignField: '_id',
          as: 'artistDoc',
        },
      },
      {
        $addFields: {
          artistName: {
            $ifNull: [{ $first: '$artistDoc.displayName' }, 'Unknown Artist'],
          },
        },
      },
      {
        $project: {
          title: 1,
          artistName: 1,
          type: 1,
          numberOfPlays: 1,
          numberOfLikes: 1,
          ban: 1,
          createdAt: 1,
        },
      },
      { $limit: 1 },
    ]);

    return result ?? null;
  }

  async banUser(userId: string, reason: string): Promise<IUser | null> {
    return User.findByIdAndUpdate<IUser>(
      userId,
      {
        ban: true,
        banReason: reason,
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();
  }

  async unbanUser(userId: string): Promise<IUser | null> {
    return User.findByIdAndUpdate<IUser>(
      userId,
      {
        ban: false,
        banReason: '',
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();
  }

  async banTrack(trackId: string, reason: string) {
    return Track.findByIdAndUpdate(
      trackId,
      {
        hidden: true,
        banReason: reason,
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();
  }

  async unbanTrack(trackId: string) {
    return Track.findByIdAndUpdate(
      trackId,
      {
        hidden: false,
      },
      {
        new: true,
        runValidators: true,
      },
    ).lean();
  }

  async deleteTrackById(trackId: string): Promise<boolean> {
    const track = await Track.findById(trackId);

    if (!track) {
      return false;
    }

    await track.deleteOne();
    return true;
  }

  async createReport(payload: CreateReportPayload): Promise<AdminReportRow> {
    const report = await Report.create({
      reporterId: new Types.ObjectId(payload.reporterId),
      violatorId: new Types.ObjectId(payload.violatorId),
      violatorType: payload.violatorType,
      reason: payload.reason,
    });

    return {
      _id: report._id,
      reporterId: report.reporterId,
      violatorId: report.violatorId,
      violatorType: report.violatorType,
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt,
    };
  }

  async findById(id: string): Promise<any | null> {
    // TODO: query your data source
    return null;
  }

  async create(data: any): Promise<any> {
    // TODO: insert into your data source
    return data;
  }

  async update(id: string, data: any): Promise<any | null> {
    // TODO: update in your data source
    return null;
  }

  async delete(id: string): Promise<boolean> {
    // TODO: delete from your data source
    return false;
  }
}
