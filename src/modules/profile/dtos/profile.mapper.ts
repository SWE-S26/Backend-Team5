import { Types } from 'mongoose';
import { ProfileResponseDTOType } from './profile.response';

export class ProfileMapper {
  static toResponse(user: any): ProfileResponseDTOType {
    return {
      userId: user._id.toString(),
      displayName: user.displayName,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      role: user.role,
      profileLink: user.profileLink,
      profileImgLink: user.profileImg?.imgLink || null,
      bannerImgLink: user.bannerImg?.imgLink || null,
      bio: user.bio || null,
      city: user.city || null,
      country: user.country || null,
      links: user.socialMediaLinks?.map((link: any) => ({
        linkId: link._id || new Types.ObjectId(),
        name: link.name || null,
        link: link.link,
      })),
      bannerLinks: user.links?.map((link: any) => ({
        linkId: link._id || new Types.ObjectId(),
        name: link.name || null,
        link: link.link,
      })),
      isPaid: user.isPaid,
      isPrivate: user.isPrivate,
      isFollowed: user.isFollowed,
      isBlocked: user.isBlocked,
      amIBlocked: user.amIBlocked,
      supportLink: user.supportLink || null,
      favoriteGenres: user.favoriteGenres || [],
      followersCount: user.followersCount || 0,
      followedCount: user.followedCount || 0,
      trackCount: user.trackCount || 0,
    };
  }
}
