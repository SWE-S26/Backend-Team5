import Track, { ITrack } from '../../shared/models/models.track';
import History, { IHistory } from '../../shared/models/models.history';
import { NotFoundError } from '../../shared/errors/responseErrors';
import User, { IUser } from '../../shared/models/models.user';
import { PublitioUploadResult } from '../../shared/abstractions/publitio.service';
import {
  CreateTrackDTO,
  TrackUpdateInput,
  UpdateTrackDTO,
} from './dtos/tracks.request.body';
import AdvancedAudioDetails, {
  IAdvancedAudioDetails,
} from '../../shared/models/models.advanced-audio-details';
import { TrackInput } from './dtos/tracks.request.body';
import { Types } from 'mongoose';
import Playlist, { IPlaylist } from '../../shared/models/models.playlist';
import Plays from '../../shared/models/models.plays';
import Following, { IFollowing } from '../../shared/models/models.following';
import PlaysTrackHandling, {
  IPlaysTrackHandling,
} from '../../shared/models/models.plays-track-handling';
import Settings, { ISettings } from '../../shared/models/models.settings';

type PaginationList = {
  tracks: ITrack[];
  info: {
    totalNumTracks: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
  };
};

export type PopulatedFans = Omit<IPlaysTrackHandling, 'userId'> & {
  userId: { displayName: string; profileImg: string };
};

type ImageInfo = {
  imgLink: string;
  publicId: string;
};

export type PlaylistWithArtist = Omit<IPlaylist, 'artistId'> & {
  artistId: Pick<IUser, 'displayName' | 'profileLink' | 'profileImg'>;
};

export class TracksRepository {
  async findById(trackId: string): Promise<ITrack | null> {
    let track = await Track.findById<ITrack>(trackId);
    return track;
  }

  async deleteById(trackId: string, userId: string): Promise<boolean> {
    await Track.findOneAndDelete({
      _id: trackId,
    });

    await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { uploads: trackId } },
    );
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
    return tracksList.filter((track): track is ITrack => track !== null);
  }

  async createNewTrack(
    trackInput: TrackInput,
    trackId: Types.ObjectId,
  ): Promise<string> {
    const trackCreate = await Track.create({
      _id: trackId,
      ...trackInput.trackInfo,
    });
    await AdvancedAudioDetails.create({
      trackId: trackCreate._id,
      ...trackInput.advanced,
    });
    await User.findOneAndUpdate(
      { _id: trackInput.trackInfo.posterId },
      { $push: { uploads: [trackCreate._id] } },
    );
    return trackCreate._id.toString();
  }

  async getTrackByProfilePermalink(
    permalink: string,
    profileLink: string,
  ): Promise<ITrack | null> {
    const searchUser = await User.findOne({ profileLink: profileLink });
    if (!searchUser) return null;
    return await Track.findOne<ITrack>({
      'basicInfo.permalink': permalink,
      posterId: searchUser._id,
    });
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

  async updateTrackInfo(trackDetails: TrackUpdateInput): Promise<ITrack> {
    const { id, trackInfo, advanced } = trackDetails;

    const flattenObject = (obj: object, prefix = '') =>
      Object.entries(obj).reduce(
        (acc, [key, value]) => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          if (
            value !== null &&
            typeof value === 'object' &&
            !Array.isArray(value)
          ) {
            Object.assign(acc, flattenObject(value, fullKey));
          } else {
            acc[fullKey] = value;
          }
          return acc;
        },
        {} as Record<string, unknown>,
      );

    const [updatedTrack] = await Promise.all([
      Track.findByIdAndUpdate(
        id,
        { $set: flattenObject(trackInfo) },
        { returnDocument: 'after' },
      ),
      AdvancedAudioDetails.findOneAndUpdate(
        { trackId: id },
        { $set: advanced },
        { returnDocument: 'after' },
      ),
    ]).catch(() => {
      throw new Error('Unexpected Error Happened During Track Update');
    });

    return updatedTrack as ITrack;
  }

  async updateMobileProPreview(
    trackId: string,
    mobileProPreview: boolean,
  ): Promise<boolean> {
    const track = await Track.findById(trackId);

    if (!track) {
      throw new Error('Track not found');
    }

    if (track.mobileProPreview === mobileProPreview) {
      return false;
    }

    await Track.updateOne({ _id: trackId }, { $set: { mobileProPreview } });

    return true;
  }

  async getPostedTracks(userId: string): Promise<ITrack[]> {
    const searchUser = await User.findById<IUser>(userId);
    if (!searchUser) {
      throw NotFoundError('User Not Found');
    }

    // run queries in paralled insteaad of a for loop
    const postedTracks = await Track.find({
      posterId: userId,
    });
    // returns null if user doesnt have any liked tracks
    return postedTracks;
  }

  async addToHistory(userId: string, trackId: string) {
    let userHistory = await History.findOne({ userId: userId });

    if (!userHistory) {
      userHistory = await History.create({
        userId: userId,
        historyTracks: [{ trackId, timestamp: new Date() }],
      });
    } else {
      userHistory.historyTracks.push({
        trackId: new Types.ObjectId(trackId),
        timestamp: new Date(),
      });
      await userHistory.save();
    }
  }

  async getTrackAdvancedInfo(
    trackId: string,
  ): Promise<IAdvancedAudioDetails | null> {
    const advancedTrackInfo = await AdvancedAudioDetails.findOne({
      trackId: trackId,
    });
    return advancedTrackInfo;
  }

  async findUserById(userId: string): Promise<IUser | null> {
    return await User.findOne<IUser>({ _id: userId });
  }

  async trackExistsByPermalinkForUser(permalink: string, userId: string) {
    return await Track.findOne<ITrack>({
      'basicInfo.permalink': permalink,
      posterId: userId,
    });
  }

  async getPlaylistsContainingTrack(
    trackId: string,
    playlistType: string,
  ): Promise<PlaylistWithArtist[] | null> {
    return (await Playlist.find({
      listOfTracks: trackId,
      playlistType: playlistType,
    })
      .populate('artistId', 'displayName profileLink profileImg')
      .lean()) as unknown as PlaylistWithArtist[];
  }

  async incrementInPlaysTable(trackId: string): Promise<void> {
    const todayDate = new Date().toISOString().split('T')[0]; // "2026-04-29"
    await Plays.findOneAndUpdate(
      { trackId: trackId, date: todayDate },
      {
        $inc: { numberOfPlay: 1 },
      },
      { upsert: true },
    );
    return;
  }

  async addToTrackStats(
    track: ITrack,
    userId: string,
    listenedDuration: number,
  ) {
    const [userFollowing, userSettings] = await Promise.all([
      Following.findOne<IFollowing>({
        userId: userId,
      }),
      this.getUserSettingsById(userId),
    ]);
    const canAppear = userSettings?.privacy.showFirstTopFan ?? false;
    const isArtistFollowed = userFollowing?.followed.some(
      (id) => id.toString() === track.posterId.toString(),
    );
    const isTrackLikedByUser = track.likedBy.some(
      (id) => id.toString() === userId.toString(),
    );
    const isFanOfArtist = isArtistFollowed && isTrackLikedByUser;
    const isInFirstWeek =
      new Date().getTime() - track.createdAt.getTime() <
      7 * 24 * 60 * 60 * 1000;
    const trackStats =
      await PlaysTrackHandling.findOneAndUpdate<IPlaysTrackHandling>(
        {
          trackId: track._id,
          userId: userId,
        },
        {
          $inc: {
            totalNumberOfPlay: 1,
            totalListenedDuration: listenedDuration,
            ...(isInFirstWeek && { firstWeekNumPlays: 1 }),
          },
          $set: {
            isFanOfArtist: isFanOfArtist,
            canAppear: canAppear,
          },
        },
        { upsert: true, returnDocument: 'after' },
      );

    const playThroughPercentage =
      ((trackStats as IPlaysTrackHandling).totalListenedDuration /
        ((trackStats as IPlaysTrackHandling).totalNumberOfPlay *
          track.durationInSeconds)) *
      100;
    await PlaysTrackHandling.findOneAndUpdate(
      { trackId: track._id, userId: userId },
      { $set: { playThroughPercentage } },
    );
  }

  async getTopFans(trackId: string): Promise<PopulatedFans[]> {
    return (await PlaysTrackHandling.find({
      trackId: trackId,
      isFanOfArtist: true,
      canAppear: true,
    })
      .sort({ totalNumberOfPlay: -1 })
      .limit(5)
      .populate('userId', 'displayName profileImg')
      .lean()) as unknown as PopulatedFans[];
  }

  async getFirstFans(trackId: string): Promise<PopulatedFans[]> {
    return (await PlaysTrackHandling.find({
      trackId: trackId,
      canAppear: true,
    })
      .sort({ firstWeekNumPlays: -1 })
      .limit(5)
      .populate('userId', 'displayName profileImg')
      .lean()) as unknown as PopulatedFans[];
  }

  async getUserSettingsById(userId: string): Promise<ISettings | null> {
    return await Settings.findOne({ userId: userId });
  }

  async incrementDownloads(trackId: string) {
    await Track.findOneAndUpdate(
      { _id: trackId },
      { $inc: { numOfDownloads: 1 } },
    );
  }
}
