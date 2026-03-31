import { UserSummaryDTOType } from './following.response';

export class FollowingMapper {
  static toUserSummary(user: any): UserSummaryDTOType {
    return {
      userId: user._id.toString(),
      displayName: user.displayName,
      profileImgLink: user.profileImg?.imgLink || null,
      trackCount: user.trackCount || 0,
      followersCount: user.followersCount || 0,
    };
  }
}
