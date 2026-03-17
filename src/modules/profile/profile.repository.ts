import User, { IUser } from '../../shared/models/models.user';
import { UpdateProfileRequestBodyDTOType } from './dtos/profile.request.body';

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
}
