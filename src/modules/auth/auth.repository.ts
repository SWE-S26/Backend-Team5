import User, { IUser } from '../../shared/models/models.user';

export class AuthRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    const user = await User.findOne<IUser>({
      email: email,
    }).select('+password');

    return user;
  }

  async findById(id: string): Promise<IUser | null> {
    const user = await User.findById<IUser>(id);
    return user;
  }

  async create(
    email: string,
    password: string,
    displayName: string,
    dateOfBirth: Date,
    gender: 'Male' | 'Female',
  ): Promise<IUser> {
    const user = await User.create({
      email,
      password,
      displayName,
      dateOfBirth,
      gender,
      role: 'Listener/Artist',
      profileLink:
        displayName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
    });

    return user as IUser;
  }

  async verifyEmail(id: string): Promise<IUser | null> {
    const user = await User.findByIdAndUpdate(
      id,
      { isVerified: true },
      { new: true },
    );

    return user;
  }

  async changePassword(id: string, newPassword: string): Promise<IUser | null> {
    const user = await User.findByIdAndUpdate(
      id,
      { password: newPassword },
      { new: true },
    ).select('+password');

    return user;
  }
}
