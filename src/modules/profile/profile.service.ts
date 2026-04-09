import Following from '../../shared/models/models.following';
import Track from '../../shared/models/models.track';
import { IUser } from '../../shared/models/models.user';
import { ProfileMapper } from './dtos/profile.mapper';
import { ProfileRepository, UserStats } from './profile.repository';
import { ProfileResponseDTOType } from './dtos/profile.response';
import {
  UpdateProfileRequestBodyDTOType,
  UpdatePrivacySettingsDTOType,
  UpdateNotificationsSettingsDTOType,
  UpdateAccountSettingsDTOType,
  UpdateContentSettingsDTOType,
} from './dtos/profile.request.body';
import Settings, { ISettings } from '../../shared/models/models.settings';
import {
  CloudinaryService,
  ImageFolder,
} from '../../shared/abstractions/cloudinary.service';
import {
  ResourceAlreadyExists,
  NotFoundError,
} from '../../shared/errors/responseErrors';
import { DEFAULT_PROFILE_IMAGE } from '../../config/constants';

const isDefaultImage = (publicId: string) => {
  return publicId === DEFAULT_PROFILE_IMAGE.publicId;
};

export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async getProfileById(id: string): Promise<ProfileResponseDTOType | null> {
    const user: IUser | null = await this.repository.getProfileById(id);
    if (!user) throw NotFoundError('User not found');

    const userStats: UserStats = await this.repository.getUserStats(id);

    const combined = {
      ...user,
      ...userStats,
    };

    return ProfileMapper.toResponse(combined);
  }

  async updateProfile(
    id: string,
    data: Partial<UpdateProfileRequestBodyDTOType>,
  ): Promise<ProfileResponseDTOType | null> {
    let updatedUser;
    try {
      updatedUser = await this.repository.updateProfile(id, data);
    } catch (err: any) {
      if (err.code === 11000 && err.keyPattern?.profileLink) {
        throw ResourceAlreadyExists('Profile link already taken');
      }
      throw err;
    }
    if (!updatedUser) throw NotFoundError('User not found');

    const userStats: UserStats = await this.repository.getUserStats(id);

    const combined = {
      ...updatedUser,
      ...userStats,
    };

    return ProfileMapper.toResponse(combined);
  }

  async updateProfileImages(
    id: string,
    flags: { removeProfileImg?: boolean; removeBannerImg?: boolean },
    files: {
      profileImg?: Express.Multer.File[];
      bannerImg?: Express.Multer.File[];
    },
  ): Promise<ProfileResponseDTOType | null> {
    const existingUser = await this.repository.getProfileById(id);
    if (!existingUser) {
      throw NotFoundError('User not found');
    }

    const updateData: Partial<UpdateProfileRequestBodyDTOType> = {};

    if (flags.removeProfileImg) {
      if (
        existingUser.profileImg?.publicId &&
        !isDefaultImage(existingUser.profileImg.publicId)
      ) {
        await CloudinaryService.deleteImage(existingUser.profileImg.publicId);
      }
      updateData.profileImg = DEFAULT_PROFILE_IMAGE;
    }

    if (files?.profileImg?.[0]?.buffer) {
      if (
        existingUser.profileImg?.publicId &&
        !isDefaultImage(existingUser.profileImg.publicId)
      ) {
        await CloudinaryService.deleteImage(existingUser.profileImg.publicId);
      }
      const result = await CloudinaryService.uploadImage(
        files.profileImg[0].buffer,
        ImageFolder.PROFILE,
      );
      updateData.profileImg = {
        imgLink: result.url,
        publicId: result.publicId,
      };
    }

    if (flags.removeBannerImg) {
      if (
        existingUser.bannerImg?.publicId &&
        !isDefaultImage(existingUser.bannerImg.publicId)
      ) {
        await CloudinaryService.deleteImage(existingUser.bannerImg.publicId);
      }
      updateData.bannerImg = DEFAULT_PROFILE_IMAGE;
    }

    if (files?.bannerImg?.[0]?.buffer) {
      if (
        existingUser.bannerImg?.publicId &&
        !isDefaultImage(existingUser.bannerImg.publicId)
      ) {
        await CloudinaryService.deleteImage(existingUser.bannerImg.publicId);
      }
      const result = await CloudinaryService.uploadImage(
        files.bannerImg[0].buffer,
        ImageFolder.PROFILE,
      );
      updateData.bannerImg = {
        imgLink: result.url,
        publicId: result.publicId,
      };
    }

    const updatedUser = await this.repository.updateProfileImages(
      id,
      updateData,
    );
    if (!updatedUser) {
      throw NotFoundError('User not found');
    }

    return ProfileMapper.toResponse(updatedUser);
  }
  async getPrivacySettings(
    id: string,
  ): Promise<UpdatePrivacySettingsDTOType | null> {
    const settings: ISettings['privacy'] | null =
      await this.repository.getPrivacySettings(id);
    if (!settings) throw NotFoundError('User settings not found');
    return settings;
  }

  async updatePrivacySettings(
    id: string,
    data: Partial<UpdatePrivacySettingsDTOType>,
  ): Promise<UpdatePrivacySettingsDTOType | null> {
    const updated = await this.repository.updatePrivacySettings(id, data);
    if (!updated) throw NotFoundError('User settings not found');
    return updated;
  }

  async getNotificationsSettings(
    id: string,
  ): Promise<UpdateNotificationsSettingsDTOType | null> {
    const settings: ISettings['notifications'] | null =
      await this.repository.getNotificationsSettings(id);
    if (!settings) throw NotFoundError('User settings not found');
    return settings;
  }

  async updateNotificationsSettings(
    id: string,
    data: Partial<UpdateNotificationsSettingsDTOType>,
  ): Promise<UpdateNotificationsSettingsDTOType | null> {
    const updated = await this.repository.updateNotificationsSettings(id, data);
    if (!updated) throw NotFoundError('User settings not found');
    return updated;
  }

  async getAccountSettings(
    id: string,
  ): Promise<UpdateAccountSettingsDTOType | null> {
    const settings: ISettings['account'] | null =
      await this.repository.getAccountSettings(id);
    if (!settings) throw NotFoundError('User settings not found');
    return settings;
  }

  async updateAccountSettings(
    id: string,
    data: Partial<UpdateAccountSettingsDTOType>,
  ): Promise<UpdateAccountSettingsDTOType | null> {
    const updated = await this.repository.updateAccountSettings(id, data);
    if (!updated) throw NotFoundError('User settings not found');
    return updated;
  }

  async getContentSettings(
    id: string,
  ): Promise<UpdateContentSettingsDTOType | null> {
    const settings: ISettings['content'] | null =
      await this.repository.getContentSettings(id);
    if (!settings) throw NotFoundError('User settings not found');
    return settings;
  }

  async updateContentSettings(
    id: string,
    data: Partial<UpdateContentSettingsDTOType>,
  ): Promise<UpdateContentSettingsDTOType | null> {
    const updated = await this.repository.updateContentSettings(id, data);
    if (!updated) throw NotFoundError('User settings not found');
    return updated;
  }

  async getProfileByProfileLink(
    username: string,
  ): Promise<ProfileResponseDTOType | null> {
    const user = await this.repository.getProfileByProfileLink(username);
    if (!user) throw NotFoundError('User not found');

    const userStats: UserStats = await this.repository.getUserStats(
      user._id.toString(),
    );

    const combined = {
      ...user,
      ...userStats,
    };

    return ProfileMapper.toResponse(combined);
  }

  async isProfileLinkTaken(username: string): Promise<{ taken: boolean }> {
    const taken = await this.repository.isProfileLinkTaken(username);
    return { taken };
  }
}
