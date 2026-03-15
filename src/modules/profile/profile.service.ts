import { ProfileRepository } from './profile.repository';

export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async findAll(): Promise<any[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<any | null> {
    return this.repository.findById(id);
  }

  async create(data: any): Promise<any> {
    return this.repository.create(data);
  }

  async update(id: string, data: any): Promise<any | null> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
