import Track, { ITrack } from '../../shared/models/models.track';
import User from '../../shared/models/models.user';

export class TracksRepository {
  async findAll(): Promise<any[]> {
    // TODO: query your data source
    return [];
  }

  async findById(id: string): Promise<ITrack | null> {
    const track = await Track.findById<ITrack>(id);
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

  async create(data: any): Promise<any> {
    // TODO: insert into your data source
    return data;
  }

  async update(id: string, data: any): Promise<any | null> {
    // TODO: update in your data source
    return null;
  }
}
