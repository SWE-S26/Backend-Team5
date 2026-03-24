import Track, { ITrack } from '../../shared/models/models.track';
import User, { IUser } from '../../shared/models/models.user';
import Following, { IFollowing } from '../../shared/models/models.following';
import Comment, { IComment } from '../../shared/models/models.comment';

export class TracksRepository {
  async findAll(): Promise<any[]> {
    // TODO: query your data source
    return [];
  }

  async findById(id: string, populate: boolean): Promise<ITrack | null> {
    let query = Track.findById<ITrack>(id);
    if (populate) {
      query = query.populate('posterId') as any;
    }
    const track = await query;
    return track;
  }

  async deleteById(id: string): Promise<boolean> {
    const deletedTrack = await Track.findOneAndDelete({
      _id: id,
    });

    if (deletedTrack) {
      throw new Error('Track not found');
    }
    return true;
  }

  async getNumberOfPostedTracks(posterId: string): Promise<number> {
    const tracksCount = await Track.countDocuments({ posterId: posterId });
    return tracksCount;
  }

  async getNumberOfFollowers(posterId: string): Promise<number> {
    const userFollowing = await Following.findById<IFollowing>(posterId);
    const numFollowers = userFollowing?.followers.length ?? 0;
    return numFollowers;
  }

  async getTrackComments(trackId: string): Promise<IComment[]> {
    const trackComments = await Comment.find<IComment>({ trackId: trackId })
      .populate('replyList')
      .populate('userId');
    return trackComments;
  }
  async create(data: any): Promise<any> {
    // TODO: insert into your data source
    return data;
  }

  async update(id: string, data: any): Promise<any | null> {
    // TODO: update in your data source
    return null;
  }
}
