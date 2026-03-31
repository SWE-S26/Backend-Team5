import { FollowingRepository, UserStats } from './following.repository';
import User, { IUser } from '../../shared/models/models.user';
import Following from '../../shared/models/models.following';
import Track from '../../shared/models/models.track';
import { UserSummaryDTOType } from './dtos/following.response';
import { NotFoundError } from '../../shared/errors/responseErrors';
import { FollowingMapper } from './dtos/following.mapper';

export class FollowingService {
  constructor(private readonly repository: FollowingRepository) {}

  async addFollower(
    userId: string,
    followedId: string,
  ): Promise<UserSummaryDTOType> {
    const followedUser: IUser | null =
      await this.repository.getUserById(followedId);
    if (!followedUser)
      throw NotFoundError('User you want to follow is not found');

    await this.repository.addFollower(userId, followedId);

    const userStats: UserStats = await this.repository.getUserStats(followedId);

    return FollowingMapper.toUserSummary({ ...followedUser, ...userStats });
  }
}
