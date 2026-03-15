import User, { IUser } from '../../shared/models/models.user';

export class AuthRepository {
  async findByEmail(email: string): Promise<IUser | null> {
    const user = await User.findOne<IUser>({
      email: email,
    }).select('+password');

    return user;
  }

  async findAll(): Promise<IUser[]> {
    // TODO: query your data source
    return [];
  }

  async findById(id: string): Promise<IUser | null> {
    // TODO: query your data source
    return null;
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

  async update(id: string, data: any): Promise<IUser | null> {
    // TODO: update in your data source
    return null;
  }

  async delete(id: string): Promise<boolean> {
    // TODO: delete from your data source
    return false;
  }
}
