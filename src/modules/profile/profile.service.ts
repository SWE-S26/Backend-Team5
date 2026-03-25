import Following from '../../shared/models/models.following';
import Track from '../../shared/models/models.track';
import { IUser } from '../../shared/models/models.user';
import { ProfileMapper } from './dtos/profile.mapper';
import { ProfileRepository } from './profile.repository';
import { ProfileResponseDTOType } from './dtos/profile.response';
import {
  UpdateProfileRequestBodyDTOType,
  UpdatePrivacySettingsDTOType,
  UpdateNotificationsSettingsDTOType,
  UpdateAccountSettingsDTOType,
} from './dtos/profile.request.body';
import Settings, { ISettings } from '../../shared/models/models.settings';
import {
  CloudinaryService,
  ImageFolder,
} from '../../shared/abstractions/cloudinary.service';

export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async getProfile(id: string): Promise<ProfileResponseDTOType | null> {
    const user: IUser | null = await this.repository.getProfile(id);
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

  async updateProfile(
    id: string,
    data: Partial<UpdateProfileRequestBodyDTOType>,
  ): Promise<ProfileResponseDTOType | null> {
    const updatedUser = await this.repository.updateProfile(id, data);
    if (!updatedUser) return null;

    const followDoc = await Following.findOne({ userId: id }).lean();
    const followersCount = followDoc?.followers.length ?? 0;
    const followedCount = followDoc?.followed.length ?? 0;
    const trackCount = await Track.countDocuments({ posterId: id });

    const combined = {
      ...updatedUser,
      followersCount,
      followedCount,
      trackCount,
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
    const existingUser = await this.repository.getProfile(id);
    if (!existingUser) return null;

    const updateData: Partial<UpdateProfileRequestBodyDTOType> = {};

    if (flags.removeProfileImg && existingUser.profileImg?.publicId) {
      await CloudinaryService.deleteImage(existingUser.profileImg.publicId);
    }

    if (files?.profileImg?.[0]?.buffer) {
      if (existingUser.profileImg?.publicId) {
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

    if (flags.removeBannerImg && existingUser.bannerImg?.publicId) {
      await CloudinaryService.deleteImage(existingUser.bannerImg.publicId);
    }

    if (files?.bannerImg?.[0]?.buffer) {
      if (existingUser.bannerImg?.publicId) {
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

    const updatedUser = await this.repository.updateProfileImages(id, {
      ...updateData,
      removeProfileImg: flags.removeProfileImg && !updateData.profileImg,
      removeBannerImg: flags.removeBannerImg && !updateData.bannerImg,
    });
    if (!updatedUser) return null;

    return ProfileMapper.toResponse(updatedUser);
  }
  async getPrivacySettings(
    id: string,
  ): Promise<UpdatePrivacySettingsDTOType | null> {
    const settings: ISettings['privacy'] | null =
      await this.repository.getPrivacySettings(id);
    if (!settings) return null;
    return settings;
  }

  async updatePrivacySettings(
    id: string,
    data: Partial<UpdatePrivacySettingsDTOType>,
  ): Promise<UpdatePrivacySettingsDTOType | null> {
    const updated = await this.repository.updatePrivacySettings(id, data);
    if (!updated) return null;
    return updated;
  }

  async getNotificationsSettings(
    id: string,
  ): Promise<UpdateNotificationsSettingsDTOType | null> {
    const settings: ISettings['notifications'] | null =
      await this.repository.getNotificationsSettings(id);
    if (!settings) return null;
    return settings;
  }

  async updateNotificationsSettings(
    id: string,
    data: Partial<UpdateNotificationsSettingsDTOType>,
  ): Promise<UpdateNotificationsSettingsDTOType | null> {
    const updated = await this.repository.updateNotificationsSettings(id, data);
    if (!updated) return null;
    return updated;
  }

  async getAccountSettings(
    id: string,
  ): Promise<UpdateAccountSettingsDTOType | null> {
    const settings: ISettings['account'] | null =
      await this.repository.getAccountSettings(id);
    if (!settings) return null;
    return settings;
  }

  async updateAccountSettings(
    id: string,
    data: Partial<UpdateAccountSettingsDTOType>,
  ): Promise<UpdateAccountSettingsDTOType | null> {
    const updated = await this.repository.updateAccountSettings(id, data);
    if (!updated) return null;
    return updated;
  }
}
