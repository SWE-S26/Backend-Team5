import { PipelineStage, Types } from 'mongoose';
import User, { IUser } from '../../shared/models/models.user';
import Track from '../../shared/models/models.track';
import { AdminMediaListRow, AdminUserListRow } from './dtos/admin.mapper';

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

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class AdminRepository {
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
    }>([
      ...trackProjectionPipeline,
      ...sharedPipeline,
    ]);

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
