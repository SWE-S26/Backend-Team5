import { UserRepository } from '../user/user.repository';
import bcrypt from 'bcrypt';
import { ResourceAlreadyExists } from '../../shared/errors/responseErrors';

type newUserDTO = {
  email: string;
  password: string;
  displayName: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female';
};

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  private async hashPassowrd(password: string) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  }

  async doesEmailExists(email: string): Promise<Boolean> {
    // dont forget await
    const result = await this.userRepository.findByEmail(email);
    if (result === null) return false;
    else return true;
  }

  async registerNewUser(newUserDTO: newUserDTO): Promise<Boolean> {
    const existingUser = await this.userRepository.findByEmail(
      newUserDTO.email,
    );

    if (existingUser) {
      throw ResourceAlreadyExists('Email Already Exists');
    }

    const hashedPass = await this.hashPassowrd(newUserDTO.password);
    await this.userRepository.create({
      ...newUserDTO,
      password: hashedPass,
    });

    return true;
  }

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
