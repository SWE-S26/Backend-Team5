import { PlaybackRepository } from './playback.repository';
import { TracksMapper } from '../tracks/dtos/tracks.mapper';
import { PlaybackMapper } from './dtos/playback.mapper';

export class PlaybackService {
  private readonly repository: PlaybackRepository;
  constructor() {
    this.repository = new PlaybackRepository();
  }

  async getUserHistoryTracks(userId: string): Promise<any[]> {
    const [tracks, user] = await Promise.all([
      this.repository.getUserHistoryTracks(userId),
      this.repository.findUserById(userId),
    ]);
    const repostedTracks =
      user?.reposts
        ?.filter((repost) => repost.type === 'track')
        .map((repost) => repost.id) ?? [];

    return PlaybackMapper.toTrackResponsePrivateListWithoutGeo(
      tracks,
      userId,
      repostedTracks,
    );
  }

  async getUserHistoryPlaylists(userId: string): Promise<any[]> {
    const [playlists, user] = await Promise.all([
      this.repository.getUserHistoryPlaylists(userId),
      this.repository.findUserById(userId),
    ]);
    const repostedTracks =
      user?.reposts
        ?.filter((repost) => repost.type === 'track')
        .map((repost) => repost.id) ?? [];

    return PlaybackMapper.toPlaylistResponsePrivateList(
      playlists,
      userId,
      repostedTracks,
    );
  }

  async deleteUserHistory(userId: string): Promise<void> {
    await this.repository.deleteUserHistory(userId);
    return;
  }
}
