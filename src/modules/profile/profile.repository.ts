import User, { IUser } from '../../shared/models/models.user';
import Settings, { ISettings } from '../../shared/models/models.settings';
import {
  UpdateProfileRequestBodyDTOType,
  UpdatePrivacySettingsDTOType,
  UpdateNotificationsSettingsDTOType,
  UpdateAccountSettingsDTOType,
  UpdateContentSettingsDTOType,
} from './dtos/profile.request.body';

export class ProfileRepository {
  async getProfileById(id: string): Promise<IUser | null> {
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
    },
  ): Promise<IUser | null> {
    const updateData: any = {};

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
    const existing = await Settings.findOne(
      { userId: id },
      { privacy: 1 },
    ).lean();
    if (!existing) return null;
    const merged = { ...existing.privacy, ...data };

    const updated = await Settings.findOneAndUpdate(
      { userId: id },
      { privacy: merged },
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
    const existing = await Settings.findOne(
      { userId: id },
      { notifications: 1 },
    ).lean();
    if (!existing) return null;
    const merged = { ...existing.notifications, ...data };

    const updated = await Settings.findOneAndUpdate(
      { userId: id },
      { notifications: merged },
      { new: true, runValidators: true, projection: { notifications: 1 } },
    ).lean();
    return updated?.notifications ?? null;
  }

  async getAccountSettings(id: string): Promise<ISettings['account'] | null> {
    const doc = await Settings.findOne({ userId: id }, { account: 1 }).lean();
    return doc?.account ?? null;
  }

  async updateAccountSettings(
    id: string,
    data: Partial<UpdateAccountSettingsDTOType>,
  ): Promise<ISettings['account'] | null> {
    const existing = await Settings.findOne(
      { userId: id },
      { account: 1 },
    ).lean();
    if (!existing) return null;
    const merged = { ...existing.account, ...data };

    const updated = await Settings.findOneAndUpdate(
      { userId: id },
      { account: merged },
      { new: true, runValidators: true, projection: { account: 1 } },
    ).lean();

    const userUpdate: any = {};
    if (data.gender !== undefined) userUpdate.gender = data.gender;
    if (data.dateOfBirth !== undefined)
      userUpdate.dateOfBirth = data.dateOfBirth;
    await User.findByIdAndUpdate(id, userUpdate, {
      new: true,
      runValidators: true,
    });

    return updated?.account ?? null;
  }

  async getContentSettings(id: string): Promise<ISettings['content'] | null> {
    const doc = await Settings.findOne({ userId: id }, { content: 1 }).lean();
    return doc?.content ?? null;
  }

  async updateContentSettings(
    id: string,
    data: Partial<UpdateContentSettingsDTOType>,
  ): Promise<ISettings['content'] | null> {
    const existing = await Settings.findOne(
      { userId: id },
      { content: 1 },
    ).lean();
    if (!existing) return null;
    const merged = { ...existing.content, ...data };

    const updated = await Settings.findOneAndUpdate(
      { userId: id },
      { content: merged },
      { new: true, runValidators: true, projection: { content: 1 } },
    ).lean();
    return updated?.content ?? null;
  }

  async getProfileByProfileLink(username: string): Promise<IUser | null> {
    return await User.findOne({ profileLink: username }).lean();
  }

  async isProfileLinkTaken(username: string): Promise<boolean> {
    const user = await User.findOne({ profileLink: username }).lean();
    return !!user;
  }
}
