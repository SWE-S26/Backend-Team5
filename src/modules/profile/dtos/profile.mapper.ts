import { Types } from 'mongoose';
import { ProfileResponseDtoType } from './profile.response';

export class ProfileMapper {
  static toResponse(user: any): ProfileResponseDtoType {
    return {
      userId: user._id.toString(),
      displayName: user.displayName,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileLink: user.profileLink,
      profileImgLink: user.profileImg?.url || null,
      bannerImgLink: user.bannerImg?.url || null,
      bio: user.bio || null,
      city: user.city || null,
      country: user.country || null,
      links: user.links?.map((link: any) => ({
        linkId: link._id || new Types.ObjectId(),
        title: link.name || null,
        link: link.link,
      })),
      bannerLinks: user.bannerLinks?.map((link: any) => ({
        linkId: link._id || new Types.ObjectId(),
        title: link.name || null,
        link: link.link,
      })),
      supportLink: user.supportLink || null,
      favoriteGenres: user.favoriteGenres || [],
      followersCount: user.followersCount || 0,
      followingsCount: user.followingsCount || 0,
      trackCount: user.trackCount || 0,
    };
  }
}
