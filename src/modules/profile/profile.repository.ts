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
    const updatedData: any = { ...data };

    if (data.linksToRemove) {
      updatedData.links = { $pull: { _id: { $in: data.linksToRemove } } };
    }

    if (data.bannerLinksToRemove) {
      updatedData.bannerLinks = {
        $pull: { _id: { $in: data.bannerLinksToRemove } },
      };
    }

    return await User.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    }).lean();
  }
}
