import { AuthRepository } from './auth.repository';
import { UserRepository } from '../user/user.repository';
import { IUser } from '../user/user.model';

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  async doesEmailExists(email: string): Promise<boolean> {
    // dont forget await
    const result = await this.userRepository.findByEmail(email);
    if (result === null) return false;
    else return true;
  }

  // async findById(id: string): Promise<any | null> {
  //   return this.repository.findById(id);
  // }

  // async create(data: any): Promise<any> {
  //   return this.repository.create(data);
  // }

  // async update(id: string, data: any): Promise<any | null> {
  //   return this.repository.update(id, data);
  // }

  // async delete(id: string): Promise<boolean> {
  //   return this.repository.delete(id);
  // }
}
