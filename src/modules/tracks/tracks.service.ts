import {
  NotFoundError,
  UnauthorizedError,
} from '../../shared/errors/responseErrors';
import { TracksRepository } from './tracks.repository';

export class TracksService {
  private readonly tracksRepository: TracksRepository;

  constructor() {
    this.tracksRepository = new TracksRepository();
  }

  async deleteTrackById(
    userId: string,
    trackId: string,
    userRole: string,
  ): Promise<Boolean> {
    const searchTrack = await this.tracksRepository.findById(trackId);

    if (!searchTrack) {
      throw NotFoundError('Track Not Found');
    }

    const posterId = searchTrack.posterId.toString();

    // if the user trying to delete is not
    if (userRole !== 'Admin') {
      if (userId !== posterId) {
        // means user is trying to delete a track he has not posted
        throw UnauthorizedError('Unauthorized Action');
      }
    }

    const isDeleted = await this.tracksRepository.deleteById(trackId);
    return isDeleted;
  }

  async findById(id: string): Promise<any | null> {
    return this.tracksRepository.findById(id);
  }

  async create(data: any): Promise<any> {
    return this.tracksRepository.create(data);
  }

  async update(id: string, data: any): Promise<any | null> {
    return this.tracksRepository.update(id, data);
  }
}
