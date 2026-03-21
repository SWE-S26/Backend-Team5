import Following from '../../shared/models/models.following';
import Track from '../../shared/models/models.track';
import { IUser } from '../../shared/models/models.user';
import { ProfileMapper } from './dtos/profile.mapper';
import { ProfileRepository } from './profile.repository';
import { ProfileResponseDTOType } from './dtos/profile.response';
import {
  UpdateProfileRequestBodyDTOType,
  UpdatePrivacySettingsDTOType,
} from './dtos/profile.request.body';
import Settings, { ISettings } from '../../shared/models/models.settings';

const defaultPrivacySettings: UpdatePrivacySettingsDTOType = {
  accountIsprivate: false,
  allowMessagesAnyone: true,
  showActivityDiscovery: true,
  showFirstTopFan: true,
  showTrackTopFans: true,
};

export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async findById(id: string): Promise<ProfileResponseDTOType | null> {
    const user: IUser | null = await this.repository.findById(id);
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

  async update(
    id: string,
    data: Partial<UpdateProfileRequestBodyDTOType>,
  ): Promise<ProfileResponseDTOType | null> {
    const updatedUser = await this.repository.update(id, data);
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

  async getPrivacySettings(
    id: string,
  ): Promise<UpdatePrivacySettingsDTOType | null> {
    const settings: ISettings['privacy'] | null =
      await this.repository.getPrivacySettings(id);
    if (!settings) return null;
    return { ...defaultPrivacySettings, ...settings };
  }

  async updatePrivacySettings(
    id: string,
    data: Partial<UpdatePrivacySettingsDTOType>,
  ): Promise<UpdatePrivacySettingsDTOType | null> {
    const updated = await this.repository.updatePrivacySettings(id, data);
    if (!updated) return null;
    return updated;
  }
}
