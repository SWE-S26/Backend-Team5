import User, { IUser } from '../../shared/models/models.user';
import Settings, { ISettings } from '../../shared/models/models.settings';
import {
  UpdateProfileRequestBodyDTOType,
  UpdatePrivacySettingsDTOType,
} from './dtos/profile.request.body';
import { promises } from 'node:dns';

export class ProfileRepository {
  async findById(id: string): Promise<IUser | null> {
    return await User.findById(id).lean();
  }

  async update(
    id: string,
    data: Partial<UpdateProfileRequestBodyDTOType>,
  ): Promise<IUser | null> {
    const { links, bannerLinks, ...otherFields } = data;
    const updateData: any = { ...otherFields };

    if (links) updateData.links = links;
    if (bannerLinks) updateData.bannerLinks = bannerLinks;

    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();
  }

  async getPrivacySettings(id: string): Promise<ISettings['privacy'] | null> {
    const doc = await Settings.findOne({ id }, { privacy: 1 }).lean();
    return doc?.privacy ?? null;
  }

  async updatePrivacySettings(
    id: string,
    data: Partial<UpdatePrivacySettingsDTOType>,
  ): Promise<ISettings['privacy'] | null> {
    const updated = await Settings.findOneAndUpdate(
      { id },
      { privacy: data },
      { new: true, runValidators: true, projection: { privacy: 1 } },
    );
    return updated?.privacy ?? null;
  }
}
