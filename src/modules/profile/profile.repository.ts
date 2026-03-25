import User, { IUser } from '../../shared/models/models.user';
import Settings, { ISettings } from '../../shared/models/models.settings';
import {
  UpdateProfileRequestBodyDTOType,
  UpdatePrivacySettingsDTOType,
  UpdateNotificationsSettingsDTOType,
} from './dtos/profile.request.body';

export class ProfileRepository {
  async getProfile(id: string): Promise<IUser | null> {
    return await User.findById(id).lean();
  }

  async updateProfile(
    id: string,
    data: Partial<UpdateProfileRequestBodyDTOType>,
  ): Promise<IUser | null> {
    const { links, bannerLinks, ...otherFields } = data;
    const updateData: any = { ...otherFields };

    if (links !== undefined) updateData.links = links;
    if (bannerLinks !== undefined) updateData.bannerLinks = bannerLinks;

    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();
  }

  async updateProfileImages(
    id: string,
    data: {
      profileImg?: { imgLink: string; publicId: string };
      bannerImg?: { imgLink: string; publicId: string };
      removeProfileImg?: boolean;
      removeBannerImg?: boolean;
    },
  ): Promise<IUser | null> {
    const updateData: any = {};

    if (data.removeProfileImg) {
      updateData.$unset = updateData.$unset || {};
      updateData.$unset.profileImg = '';
    }

    if (data.removeBannerImg) {
      updateData.$unset = updateData.$unset || {};
      updateData.$unset.bannerImg = '';
    }

    if (data.profileImg) {
      updateData.profileImg = data.profileImg;
    }

    if (data.bannerImg) {
      updateData.bannerImg = data.bannerImg;
    }

    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();
  }

  async getPrivacySettings(id: string): Promise<ISettings['privacy'] | null> {
    const doc = await Settings.findOne({ userId: id }, { privacy: 1 }).lean();
    return doc?.privacy ?? null;
  }

  async updatePrivacySettings(
    id: string,
    data: Partial<UpdatePrivacySettingsDTOType>,
  ): Promise<ISettings['privacy'] | null> {
    const updated = await Settings.findOneAndUpdate(
      { userId: id },
      { privacy: data },
      { new: true, runValidators: true, projection: { privacy: 1 } },
    ).lean();
    return updated?.privacy ?? null;
  }

  async getNotificationsSettings(
    id: string,
  ): Promise<ISettings['notifications'] | null> {
    const doc = await Settings.findOne(
      { userId: id },
      { notifications: 1 },
    ).lean();
    return doc?.notifications ?? null;
  }

  async updateNotificationsSettings(
    id: string,
    data: Partial<UpdateNotificationsSettingsDTOType>,
  ): Promise<ISettings['notifications'] | null> {
    const updated = await Settings.findOneAndUpdate(
      { userId: id },
      { notifications: data },
      { new: true, runValidators: true, projection: { notifications: 1 } },
    ).lean();
    return updated?.notifications ?? null;
  }
}
