import User, { IUser } from '../../shared/models/models.user';
import Settings, { ISettings } from '../../shared/models/models.settings';
import {
  UpdateProfileRequestBodyDTOType,
  UpdatePrivacySettingsDTOType,
} from './dtos/profile.request.body';

export class ProfileRepository {
  async getProfile(id: string): Promise<IUser | null> {
    return await User.findById(id).lean();
  }

  async updateProfile(
    id: string,
    data: Partial<UpdateProfileRequestBodyDTOType>,
  ): Promise<IUser | null> {
    const {
      links,
      bannerLinks,
      removeProfileImg,
      removeBannerImg,
      ...otherFields
   
    } = data;
    const updateData: any = { ...otherFields };

    if (links !== undefined) updateData.links = links;
    if (bannerLinks !== undefined) updateData.bannerLinks = bannerLinks;


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
}
