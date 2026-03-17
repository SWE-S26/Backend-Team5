import { ProfileRepository } from './profile.repository';

export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async findById(id: string): Promise<any | null> {
    return this.repository.findById(id);
  }

  async update(id: string, data: any): Promise<any | null> {
    return this.repository.update(id, data);
  }
}
