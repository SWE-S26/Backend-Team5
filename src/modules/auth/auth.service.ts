import { UserRepository } from '../user/user.repository';
import bcrypt from 'bcrypt';
import {
  ResourceAlreadyExists,
  UnauthorizedError,
} from '../../shared/errors/responseErrors';
import { IUser } from '../user/user.model';
import jwt from 'jsonwebtoken';
import { initializeConfig } from '../../config/initializeConfig';

type newUserDTO = {
  email: string;
  password: string;
  displayName: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female';
};

type logInDTO = {
  email: string;
  password: string;
};

const JWT_EXPIRES_IN = '1h';
const JWT_SECRET = process.env.JWT_SECRET;

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  private async hashPassowrd(password: string) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  }

  private createJWT(user: IUser): string {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET!, { expiresIn: JWT_EXPIRES_IN });

    return token;
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

  async logInUser(logInDTO: logInDTO): Promise<String> {
    const searchUser = await this.userRepository.findByEmail(logInDTO.email);

    if (!searchUser) {
      throw UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(
      logInDTO.password,
      searchUser.password,
    );
    if (!isMatch) {
      throw UnauthorizedError('Invalid email or password');
    }

    return this.createJWT(searchUser);
  }

  // async update(id: string, data: any): Promise<any | null> {
  //   return this.repository.update(id, data);
  // }

  // async delete(id: string): Promise<boolean> {
  //   return this.repository.delete(id);
  // }
}
