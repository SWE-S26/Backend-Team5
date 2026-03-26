import User, { IUser } from '../../shared/models/models.user';
import Comment from '../../shared/models/models.comment';
import Track from '../../shared/models/models.track';
import Playlist from '../../shared/models/models.playlist';
import SearchHistory from '../../shared/models/models.search-history';
import Following from '../../shared/models/models.following';
import Notification from '../../shared/models/models.notification';
import Report from '../../shared/models/models.report';

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
      role: 'Listener',
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

  async linkGoogleId(userId: string, googleId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { googleId });
  }

  async createWithGoogle(data: {
    googleId: string;
    email: string;
    displayName: string;
    dateOfBirth: Date;
    gender: 'Male' | 'Female';
  }): Promise<IUser> {
    const user = await User.create({
      ...data,
      role: 'Listener',
      isVerified: true,
      profileLink:
        data.displayName.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
    });

    return user as IUser;
  }

  async createWithCredentials(data: {
    email: string;
    password: string;
    displayName: string;
    dateOfBirth: Date;
    gender: 'Male' | 'Female';
  }): Promise<IUser> {
    return User.create(data);
  }

  async deleteUser(id: string): Promise<void> {
    await User.findOneAndDelete({ _id: id });
  }
}
