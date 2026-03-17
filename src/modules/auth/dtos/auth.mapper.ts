import { LoginResponse } from './auth.response';
import { IUser } from '../../../shared/models/models.user';

export class AuthMapper {
  static toUserCredientialsResponse(user: IUser): LoginResponse {
    return {
      id: user._id.toString(),
      displayName: user.displayName,
      role: user.role,
      profileLink: user.profileLink,
      profileImg: {
        imgLink: user.profileImg
          ? user.profileImg.imgLink
          : 'https://res.cloudinary.com/dexluedse/image/upload/v1744719629/mobile-app/lwvswk21xn3wpgoufqxi.jpg',
        publicId: user.profileImg
          ? user.profileImg.publicId
          : 'mobile-app/lwvswk21xn3wpgoufqxi',
      },
      subscription: {
        subscriptionType: user.subscription.subscriptionType,
        quota: {
          unlimited: user.subscription.quota.unlimited,
          usedSeconds: user.subscription.quota.usedSeconds,
        },
      },
    };
  }

  static toEntity(dto: unknown): IUser {
    throw new Error('Not implemented');
  }
}
