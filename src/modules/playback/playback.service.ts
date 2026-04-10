import { PlaybackRepository } from './playback.repository';
import { TracksMapper } from '../tracks/dtos/tracks.mapper';

export class PlaybackService {
  private readonly repository: PlaybackRepository;
  constructor() {
    this.repository = new PlaybackRepository();
  }

  async getUserHistoryTracks(userId: string): Promise<any[]> {
    const tracks = await this.repository.getUserHistoryTracks(userId);
    return TracksMapper.toTrackResponseList(tracks);
  }
}
