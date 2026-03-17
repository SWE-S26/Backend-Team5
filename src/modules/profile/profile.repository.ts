import User, { IUser } from '../../shared/models/models.user';

export class ProfileRepository {
  async findById(id: string): Promise<IUser | null> {
    return await User.findById(id).lean();
  }

  async update(id: string, data: any): Promise<IUser | null> {
    return await User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
  }
}
