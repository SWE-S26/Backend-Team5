import { IPlaylist } from '../../../shared/models/models.playlist';
import { ITrack } from '../../../shared/models/models.track';
import { TrackResponsePrivateDTO } from '../../tracks/dtos/tracks.response';

export class PlaybackMapper {
  static toTrackResponsePrivateWithOutGeo(
    track: ITrack,
    userId: string,
    repostedList: string[],
  ) {
    const trackBasicInfo = track.basicInfo;
    return {
      trackId: track._id.toString(),
      basicInfo: {
        title: trackBasicInfo.title,
        permalink: trackBasicInfo.permalink,
        mainArtists: trackBasicInfo.mainArtists,
        genre: trackBasicInfo.genre,
        tags: trackBasicInfo.tags,
        description: trackBasicInfo.description,
        isPrivate: trackBasicInfo.isPrivate,
        caption: trackBasicInfo.caption,
      },
      posterId: track.posterId.toString(),
      durationInSeconds: track.durationInSeconds,
      audio: track.audio,
      image: track.image,
      numLikes: track.numOfLikes,
      numPlays: track.numOfPlays,
      numReposts: track.numberOfReposts,
      numComments: track.comments.length,
      numDownloads: track.numOfDownloads,
      releaseDate: track.createdAt,
      isLikedByUser: track.likedBy.map((id) => id.toString()).includes(userId),
      isRepostedByUser: repostedList.includes(track._id.toString()),
      permissions: track.permissions,
      license: track.license,
      audioClip: {
        start: track.audioClip?.start ?? 0,
        end: track.audioClip?.end ?? 0,
      },
      mobileProPreview: track.mobileProPreview ?? false,
    };
  }

  static toTrackResponsePrivateListWithoutGeo(
    tracks: ITrack[],
    userId: string,
    repostedList: string[],
  ): TrackResponsePrivateDTO[] {
    const tracksMapped: TrackResponsePrivateDTO[] = [];
    tracks.forEach((track) => {
      const trackMapped = this.toTrackResponsePrivateWithOutGeo(
        track,
        userId,
        repostedList,
      );
      tracksMapped.push(trackMapped);
    });
    return tracksMapped;
  }

  static toPlayListResponsePrivate(
    playlist: IPlaylist,
    userId: string,
    repostedList: string[],
  ) {
    const plain = (playlist as any).toObject();
    return {
      ...plain,
      isLikedByUser: playlist.likedUser
        .map((id) => id.toString())
        .includes(userId),
      isRepostedByUser: repostedList.includes(playlist._id.toString()),
    };
  }

  static toPlaylistResponsePrivateList(
    playlists: IPlaylist[],
    userId: string,
    repostedList: string[],
  ): any[] {
    return playlists.map((playlist) =>
      this.toPlayListResponsePrivate(playlist, userId, repostedList),
    );
  }
}
