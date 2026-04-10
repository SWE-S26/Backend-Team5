import Track, { ITrack } from '../../shared/models/models.track';
import { NotFoundError } from '../../shared/errors/responseErrors';
import User, { IUser } from '../../shared/models/models.user';
import { PublitioUploadResult } from '../../shared/abstractions/publitio';
import { CreateTrackDTO, UpdateTrackDTO } from './dtos/tracks.request.body';
import AdvancedAudioDetails from '../../shared/models/models.advanced-audio-details';
import { TrackInput } from './dtos/tracks.request.body';

type PaginationList = {
  tracks: ITrack[];
  info: {
    totalNumTracks: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
  };
};

type ImageInfo = {
  imgLink: string;
  publicId: string;
};

export class TracksRepository {
  async findById(trackId: string): Promise<ITrack | null> {
    let track = await Track.findById<ITrack>(trackId);
    return track;
  }

  async deleteById(trackId: string): Promise<boolean> {
    const deletedTrack = await Track.findOneAndDelete({
      _id: trackId,
    });

    if (!deletedTrack) throw NotFoundError('Track Not found');
    return true;
  }

  async incrementNumPlays(trackId: string): Promise<Boolean> {
    const updatedTrack = await Track.findByIdAndUpdate(trackId, {
      $inc: { numOfPlays: 1 },
    });

    if (!updatedTrack) return false;
    return true;
  }

  async getLikedTracks(userId: string): Promise<(ITrack | null)[]> {
    const searchUser = await User.findById<IUser>(userId);
    if (!searchUser) {
      throw new Error('Internal Server Error');
    }

    const tracksIdList = searchUser.likedTracks;

    // run queries in paralled insteaad of a for loop
    const tracksList = await Promise.all(
      tracksIdList.map((trackId) => this.findById(trackId.toString())),
    );

    // returns null if user doesnt have any liked tracks
    return tracksList;
  }

  async createNewTrack(trackInput: TrackInput): Promise<Boolean> {
    const trackCreate = await Track.create(trackInput.trackInfo);
    const advancedTrackInfoCreate = await AdvancedAudioDetails.create({
      trackId: trackCreate._id,
      ...trackInput.advanced,
    });
    return true;
  }

  async getTrackByPermalink(permalink: string): Promise<ITrack | null> {
    return await Track.findOne<ITrack>({ 'basicInfo.permalink': permalink });
  }

  async getPaginatedList(page: number, limit: number): Promise<PaginationList> {
    // skip to the number of page to start with
    const skip = (page - 1) * limit;

    // get limited tracks + total count of tracks
    const [tracks, totalNumTracks] = await Promise.all([
      Track.find({ 'basicInfo.isPrivate': false }).skip(skip).limit(limit),
      Track.countDocuments(),
    ]);

    // calc total pages
    const totalPages = Math.ceil(totalNumTracks / limit);

    // see if we reached the end or not
    const hasNext = page < totalPages;
    return {
      tracks,
      info: {
        totalNumTracks,
        page,
        totalPages,
        hasNext,
      },
    };
  }

  async updateTrackInfo(
    trackInfo: UpdateTrackDTO,
    imgInfo: ImageInfo | null,
  ): Promise<ITrack> {
    const { id, advanced, ...mainInfo } = trackInfo;

    const updatePayload = {
      ...mainInfo,
      ...(imgInfo && { image: imgInfo }),
    };
    console.log('THE ADVANCED SHIT', advanced);
    const [updatedTrack] = await Promise.all([
      Track.findByIdAndUpdate(id, { $set: updatePayload }, { new: true }),
      AdvancedAudioDetails.findOneAndUpdate(
        { trackId: id },
        { $set: advanced },
        { new: true },
      ),
    ]).catch((error) => {
      throw new Error('Unexpected Error Happened During Track Update');
    });
    return updatedTrack as ITrack;
  }

  async getPostedTracks(userId: string): Promise<ITrack[]> {
    const searchUser = await User.findById<IUser>(userId);
    if (!searchUser) {
      throw NotFoundError('User Not Found');
    }

    // run queries in paralled insteaad of a for loop
    const postedTracks = await Track.find({
      posterId: userId,
      'basicInfo.isPrivate': false,
    });
    // returns null if user doesnt have any liked tracks
    return postedTracks;
  }
}
