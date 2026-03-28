import Track, { ITrack } from '../../shared/models/models.track';
import { NotFoundError } from '../../shared/errors/responseErrors';
import User, { IUser } from '../../shared/models/models.user';
import { PublitioUploadResult } from '../../shared/abstractions/publitio';
import { CreateTrackDTO, UpdateTrackDTO } from './dtos/tracks.request.body';
import AdvancedAudioDetails from '../../shared/models/models.advanced-audio-details';

type PaginationList = {
  tracks: ITrack[];
  info: {
    totalNumTracks: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
  };
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

  async incrementNumPlays(
    trackId: string,
    newNumPlays: number,
  ): Promise<Boolean> {
    const updatedTrack = await Track.findByIdAndUpdate(trackId, {
      $set: { numOfPlays: newNumPlays },
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

  async createNewTrack(
    trackInfo: CreateTrackDTO,
    audioInfo: PublitioUploadResult,
    imgInfo: any,
  ): Promise<Boolean> {
    const trackCreate = await Track.create({
      ...trackInfo,
      audio: {
        ...audioInfo,
      },
      image: {
        ...imgInfo,
      },
    });
    if (trackCreate) return true;
    else return false;
  }

  async getTrackByPermalink(permalink: string): Promise<ITrack | null> {
    return await Track.findOne<ITrack>({ 'basicInfo.permalink': permalink });
  }

  async getPaginatedList(page: number, limit: number): Promise<PaginationList> {
    // skip to the number of page to start with
    const skip = (page - 1) * limit;

    // get limited tracks + total count of tracks
    const [tracks, totalNumTracks] = await Promise.all([
      Track.find().skip(skip).limit(limit),
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

  async updateTrackInfo(trackInfo: UpdateTrackDTO): Promise<ITrack> {
    const { id, advanced, ...mainInfo } = trackInfo;

    const [updatedTrack] = await Promise.all([
      Track.findByIdAndUpdate(id, { $set: mainInfo }, { new: true }),
      await AdvancedAudioDetails.findByIdAndUpdate(
        id,
        { $set: advanced },
        { new: true },
      ),
    ]).catch((error) => {
      throw new Error('Unexpected Error Happened During Track Update');
    });
    return updatedTrack as ITrack;
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
