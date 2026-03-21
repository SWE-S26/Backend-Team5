import { Types } from 'mongoose';
import Track, { ITrack } from '../../shared/models/models.track';
import Playlist, { IPlaylist } from '../../shared/models/models.playlist';
import User, { IUser } from '../../shared/models/models.user';
import Following from '../../shared/models/models.following';
import Comment, { IComment } from '../../shared/models/models.comment';

export class EngagementRepository {
  async findTrackById(trackId: string): Promise<ITrack | null> {
    return Track.findById(trackId).select('likedBy numOfLikes');
  }

  async findTrackByIdForComments(trackId: string): Promise<ITrack | null> {
    return Track.findById(trackId).select('posterId');
  }

  async addLikeToTrack(trackId: string, userId: string): Promise<ITrack> {
    const userObjectId = new Types.ObjectId(userId);
    return Track.findByIdAndUpdate(
      trackId,
      { $addToSet: { likedBy: userObjectId }, $inc: { numOfLikes: 1 } },
      { new: true },
    ).select('numOfLikes') as Promise<ITrack>;
  }

  async removeLikeFromTrack(trackId: string, userId: string): Promise<ITrack> {
    const userObjectId = new Types.ObjectId(userId);
    return Track.findByIdAndUpdate(
      trackId,
      { $pull: { likedBy: userObjectId }, $inc: { numOfLikes: -1 } },
      { new: true },
    ).select('numOfLikes') as Promise<ITrack>;
  }

  async addTrackToUserLikes(userId: string, trackId: string): Promise<void> {
    const trackObjectId = new Types.ObjectId(trackId);
    await User.findByIdAndUpdate(userId, {
      $addToSet: { likedTracks: trackObjectId },
    });
  }

  async removeTrackFromUserLikes(
    userId: string,
    trackId: string,
  ): Promise<void> {
    const trackObjectId = new Types.ObjectId(trackId);
    await User.findByIdAndUpdate(userId, {
      $pull: { likedTracks: trackObjectId },
    });
  }

  async findTrackLikers(
    userIds: Types.ObjectId[],
  ): Promise<Pick<IUser, '_id' | 'displayName' | 'profileImg'>[]> {
    return User.find({
      _id: { $in: userIds },
    }).select('_id displayName profileImg');
  }

  async findFollowersCountByUserIds(
    userIds: Types.ObjectId[],
  ): Promise<Record<string, number>> {
    const rows = await Following.aggregate<{
      userId: Types.ObjectId;
      followersCount: number;
    }>([
      { $match: { userId: { $in: userIds } } },
      {
        $project: {
          _id: 0,
          userId: 1,
          followersCount: { $size: { $ifNull: ['$followers', []] } },
        },
      },
    ]);

    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.userId.toString()] = row.followersCount;
      return acc;
    }, {});
  }

  async findPlaylistById(playlistId: string): Promise<IPlaylist | null> {
    return Playlist.findById(playlistId).select('likedUser numOfLikes');
  }

  async addLikeToPlaylist(
    playlistId: string,
    userId: string,
  ): Promise<IPlaylist> {
    const userObjectId = new Types.ObjectId(userId);
    return Playlist.findByIdAndUpdate(
      playlistId,
      { $addToSet: { likedUser: userObjectId }, $inc: { numOfLikes: 1 } },
      { new: true },
    ).select('numOfLikes') as Promise<IPlaylist>;
  }

  async removeLikeFromPlaylist(
    playlistId: string,
    userId: string,
  ): Promise<IPlaylist> {
    const userObjectId = new Types.ObjectId(userId);
    return Playlist.findByIdAndUpdate(
      playlistId,
      { $pull: { likedUser: userObjectId }, $inc: { numOfLikes: -1 } },
      { new: true },
    ).select('numOfLikes') as Promise<IPlaylist>;
  }

  async addPlaylistToUserLikes(
    userId: string,
    playlistId: string,
  ): Promise<void> {
    const playlistObjectId = new Types.ObjectId(playlistId);
    await User.findByIdAndUpdate(userId, {
      $addToSet: { likedPlaylists: playlistObjectId },
    });
  }

  async removePlaylistFromUserLikes(
    userId: string,
    playlistId: string,
  ): Promise<void> {
    const playlistObjectId = new Types.ObjectId(playlistId);
    await User.findByIdAndUpdate(userId, {
      $pull: { likedPlaylists: playlistObjectId },
    });
  }

  async addRepostToTrack(trackId: string): Promise<ITrack> {
    return Track.findByIdAndUpdate(
      trackId,
      { $inc: { numberOfReposts: 1 } },
      { new: true },
    ).select('numberOfReposts') as Promise<ITrack>;
  }

  async removeRepostFromTrack(trackId: string): Promise<ITrack> {
    return Track.findByIdAndUpdate(
      trackId,
      { $inc: { numberOfReposts: -1 } },
      { new: true },
    ).select('numberOfReposts') as Promise<ITrack>;
  }

  async findUserReposts(userId: string): Promise<IUser['reposts'] | null> {
    const user = await User.findById(userId).select('reposts');
    return user?.reposts || null;
  }

  async addRepostToUser(
    userId: string,
    trackId: string,
    caption?: string,
  ): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $push: {
        reposts: {
          id: trackId,
          caption: caption || '',
          type: 'track',
          timestamp: new Date(),
        },
      },
    });
  }

  async removeRepostFromUser(userId: string, trackId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { reposts: { id: trackId, type: 'track' } },
    });
  }

  async findUserTrackRepost(
    userId: string,
    trackId: string,
  ): Promise<IUser['reposts'][number] | null> {
    const user = await User.findById(userId).select('reposts');
    if (!user?.reposts) return null;

    const repost = user.reposts.find(
      (r) => r.id === trackId && r.type === 'track',
    );
    return repost || null;
  }

  async updateRepostCaption(
    userId: string,
    trackId: string,
    caption: string,
  ): Promise<void> {
    await User.findOneAndUpdate(
      {
        _id: userId,
        'reposts.id': trackId,
        'reposts.type': 'track',
      },
      {
        $set: {
          'reposts.$.caption': caption,
        },
      },
    );
  }

  async addRepostToPlaylist(playlistId: string): Promise<IPlaylist> {
    return Playlist.findByIdAndUpdate(
      playlistId,
      { $inc: { numOfReposts: 1 } },
      { new: true },
    ).select('numOfReposts') as Promise<IPlaylist>;
  }

  async removeRepostFromPlaylist(playlistId: string): Promise<IPlaylist> {
    return Playlist.findByIdAndUpdate(
      playlistId,
      { $inc: { numOfReposts: -1 } },
      { new: true },
    ).select('numOfReposts') as Promise<IPlaylist>;
  }

  async addPlaylistRepostToUser(
    userId: string,
    playlistId: string,
    caption?: string,
  ): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $push: {
        reposts: {
          id: playlistId,
          caption: caption || '',
          type: 'playlist',
          timestamp: new Date(),
        },
      },
    });
  }

  async removePlaylistRepostFromUser(
    userId: string,
    playlistId: string,
  ): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { reposts: { id: playlistId, type: 'playlist' } },
    });
  }

  async findUserPlaylistRepost(
    userId: string,
    playlistId: string,
  ): Promise<IUser['reposts'][number] | null> {
    const user = await User.findById(userId).select('reposts');
    if (!user?.reposts) return null;

    const repost = user.reposts.find(
      (r) => r.id === playlistId && r.type === 'playlist',
    );
    return repost || null;
  }

  async updatePlaylistRepostCaption(
    userId: string,
    playlistId: string,
    caption: string,
  ): Promise<void> {
    await User.findOneAndUpdate(
      {
        _id: userId,
        'reposts.id': playlistId,
        'reposts.type': 'playlist',
      },
      {
        $set: {
          'reposts.$.caption': caption,
        },
      },
    );
  }

  async findTrackReposters(
    trackId: string,
    page: number,
    limit: number,
  ): Promise<{
    users: Pick<IUser, '_id' | 'displayName' | 'profileImg'>[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [users, countResult] = await Promise.all([
      User.find({
        reposts: {
          $elemMatch: {
            id: trackId,
            type: 'track',
          },
        },
      })
        .select('_id displayName profileImg')
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({
        reposts: {
          $elemMatch: {
            id: trackId,
            type: 'track',
          },
        },
      }),
    ]);

    return {
      users: users as Pick<IUser, '_id' | 'displayName' | 'profileImg'>[],
      total: countResult,
    };
  }

  async findPlaylistReposters(
    playlistId: string,
    page: number,
    limit: number,
  ): Promise<{
    users: Pick<IUser, '_id' | 'displayName' | 'profileImg'>[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [users, countResult] = await Promise.all([
      User.find({
        reposts: {
          $elemMatch: {
            id: playlistId,
            type: 'playlist',
          },
        },
      })
        .select('_id displayName profileImg')
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({
        reposts: {
          $elemMatch: {
            id: playlistId,
            type: 'playlist',
          },
        },
      }),
    ]);

    return {
      users: users as Pick<IUser, '_id' | 'displayName' | 'profileImg'>[],
      total: countResult,
    };
  }

  async createComment(
    userId: string,
    trackId: string,
    content: string,
    timestampSeconds?: number,
  ): Promise<IComment> {
    const userObjectId = new Types.ObjectId(userId);
    const trackObjectId = new Types.ObjectId(trackId);

    const comment = await Comment.create({
      userId: userObjectId,
      trackId: trackObjectId,
      content,
      timestampSeconds: timestampSeconds || 0,
      numLikes: 0,
      likedList: [],
      replyList: [],
    });

    return comment;
  }

  async findCommentById(commentId: string): Promise<IComment | null> {
    try {
      return await Comment.findById(commentId);
    } catch (error) {
      // Return null for invalid ObjectId format instead of throwing
      return null;
    }
  }

  async addCommentToTrack(trackId: string, commentId: string): Promise<void> {
    const commentObjectId = new Types.ObjectId(commentId);
    await Track.findByIdAndUpdate(trackId, {
      $push: { comments: commentObjectId },
    });
  }

  async addReplyToComment(
    parentCommentId: string,
    replyCommentId: string,
  ): Promise<void> {
    const replyObjectId = new Types.ObjectId(replyCommentId);
    await Comment.findByIdAndUpdate(parentCommentId, {
      $push: { replyList: replyObjectId },
    });
  }

  async findCommentByIdWithLikes(commentId: string): Promise<IComment | null> {
    return Comment.findById(commentId).select('likedList numLikes');
  }

  async addLikeToComment(commentId: string, userId: string): Promise<IComment> {
    const userObjectId = new Types.ObjectId(userId);
    return Comment.findByIdAndUpdate(
      commentId,
      { $addToSet: { likedList: userObjectId }, $inc: { numLikes: 1 } },
      { new: true },
    ).select('numLikes') as Promise<IComment>;
  }

  async removeLikeFromComment(
    commentId: string,
    userId: string,
  ): Promise<IComment> {
    const userObjectId = new Types.ObjectId(userId);
    return Comment.findByIdAndUpdate(
      commentId,
      { $pull: { likedList: userObjectId }, $inc: { numLikes: -1 } },
      { new: true },
    ).select('numLikes') as Promise<IComment>;
  }

  async deleteComment(commentId: string): Promise<void> {
    await Comment.findByIdAndDelete(commentId);
  }

  async deleteComments(commentIds: string[]): Promise<void> {
    const objectIds = commentIds.map((id) => new Types.ObjectId(id));
    await Comment.deleteMany({ _id: { $in: objectIds } });
  }

  async removeCommentFromTrack(
    trackId: string,
    commentId: string,
  ): Promise<void> {
    const commentObjectId = new Types.ObjectId(commentId);
    await Track.findByIdAndUpdate(trackId, {
      $pull: { comments: commentObjectId },
    });
  }

  async removeCommentsFromTrack(
    trackId: string,
    commentIds: string[],
  ): Promise<void> {
    const objectIds = commentIds.map((id) => new Types.ObjectId(id));
    await Track.findByIdAndUpdate(trackId, {
      $pull: { comments: { $in: objectIds } },
    });
  }

  async removeCommentFromParent(
    parentCommentId: string,
    commentId: string,
  ): Promise<void> {
    const commentObjectId = new Types.ObjectId(commentId);
    await Comment.findByIdAndUpdate(parentCommentId, {
      $pull: { replyList: commentObjectId },
    });
  }

  async findParentCommentByReplyId(replyId: string): Promise<IComment | null> {
    const replyObjectId = new Types.ObjectId(replyId);
    return Comment.findOne({ replyList: replyObjectId });
  }

  async findCommentsByIds(commentIds: string[]): Promise<IComment[]> {
    const objectIds = commentIds.map((id) => new Types.ObjectId(id));
    return Comment.find({ _id: { $in: objectIds } }).select('_id replyList');
  }

  async getTrackComments(
    trackId: string,
    page: number,
    limit: number,
    sortBy: 'newest' | 'oldest' | 'trackTime' = 'newest',
  ): Promise<{
    comments: Array<
      IComment & {
        user: Pick<IUser, '_id' | 'displayName' | 'profileImg'>;
      }
    >;
    total: number;
  }> {
    const trackObjectId = new Types.ObjectId(trackId);
    const skip = (page - 1) * limit;

    const replyIds = (await Comment.distinct('replyList', {
      trackId: trackObjectId,
    })) as Types.ObjectId[];

    const filter = {
      trackId: trackObjectId,
      _id: { $nin: replyIds },
    };

    // Determine sort order based on sortBy parameter
    let sortOrder: Record<string, 1 | -1> = { createdAt: -1 }; // default: newest
    if (sortBy === 'oldest') {
      sortOrder = { createdAt: 1 };
    } else if (sortBy === 'trackTime') {
      sortOrder = { timestampSeconds: 1 };
    }

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .populate<{
          user: Pick<IUser, '_id' | 'displayName' | 'profileImg'>;
        }>({
          path: 'userId',
          select: '_id displayName profileImg',
          model: 'User',
        })
        .lean(),
      Comment.countDocuments(filter),
    ]);

    return {
      comments: comments
        .filter((c) => c.userId != null) // Filter out comments with deleted users
        .map((c) => ({
          ...c,
          user: c.userId as any,
        })),
      total,
    };
  }

  async getCommentReplies(
    commentId: string,
    page: number,
    limit: number,
  ): Promise<{
    replies: Array<
      IComment & {
        user: Pick<IUser, '_id' | 'displayName' | 'profileImg'>;
      }
    >;
    total: number;
  }> {
    try {
      const comment = await Comment.findById(commentId).select('replyList');
      if (!comment) {
        return { replies: [], total: 0 };
      }

      const skip = (page - 1) * limit;
      const total = comment.replyList.length;
      const pagedReplyIds = comment.replyList.slice(skip, skip + limit);

      const replies = await Comment.find({ _id: { $in: pagedReplyIds } })
        .populate<{
          user: Pick<IUser, '_id' | 'displayName' | 'profileImg'>;
        }>({
          path: 'userId',
          select: '_id displayName profileImg',
          model: 'User',
        })
        .lean();

      const repliesById = new Map(
        replies.map((reply) => [reply._id.toString(), reply]),
      );
      const orderedReplies = pagedReplyIds
        .map((id) => repliesById.get(id.toString()))
        .filter((reply): reply is (typeof replies)[number] => Boolean(reply))
        .filter((reply) => reply.userId != null) // Filter out replies with deleted users
        .map((reply) => ({
          ...reply,
          user: reply.userId as any,
        }));

      return {
        replies: orderedReplies,
        total,
      };
    } catch (error) {
      // Return empty result for invalid ObjectId format
      return { replies: [], total: 0 };
    }
  }
}
