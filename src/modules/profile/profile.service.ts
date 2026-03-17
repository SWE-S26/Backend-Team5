import Following from '../../shared/models/models.following';
import Track from '../../shared/models/models.track';
import { IUser } from '../../shared/models/models.user';
import { ProfileMapper } from './dtos/profile.mapper';
import { ProfileRepository } from './profile.repository';
import { ProfileResponseDtoType } from './dtos/profile.response';

export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async findById(id: string): Promise<ProfileResponseDtoType | null> {
    const user: IUser | null = await this.repository.findById(id);
    if (!user) return null;

    const followDoc = await Following.findOne({ userId: id }).lean();
    const followersCount = followDoc?.followers.length ?? 0;
    const followedCount = followDoc?.followed.length ?? 0;

    const trackCount = await Track.countDocuments({ posterId: id });

    const combined = {
      ...user,
      followersCount,
      followedCount,
      trackCount,
    };

    return ProfileMapper.toResponse(combined);
  }

  async update(id: string, data: any): Promise<any | null> {
    return this.repository.update(id, data);
  }
}
