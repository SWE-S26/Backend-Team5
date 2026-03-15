import bcrypt from 'bcrypt';
import {
  NotFoundError,
  ResourceAlreadyExists,
} from '../../shared/errors/responseErrors';
import { AuthRepository } from './auth.repository';
import JWTService from '../../shared/abstractions/jwt';

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

export class AuthService {
  private readonly jwtService: JWTService;
  private readonly authRepository: AuthRepository;

  constructor() {
    this.jwtService = new JWTService();
    this.authRepository = new AuthRepository();
  }

  private async hashPassowrd(password: string) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  }

  async doesEmailExists(email: string): Promise<Boolean> {
    const result = await this.authRepository.findByEmail(email);
    if (!result) {
      return false;
    } else {
      return true;
    }
  }

  async registerNewUser(newUserDTO: newUserDTO): Promise<Boolean> {
    const existingUser = await this.authRepository.findByEmail(
      newUserDTO.email,
    );

    if (existingUser) {
      throw ResourceAlreadyExists('Email Already Exists');
    }

    try {
      const hashedPass = await this.hashPassowrd(newUserDTO.password);
      await this.authRepository.create(
        newUserDTO.email,
        hashedPass,
        newUserDTO.displayName,
        newUserDTO.dateOfBirth,
        newUserDTO.gender,
      );

      return true;
    } catch (error) {
      throw new Error('Failed to register new user');
    }
  }

  async logInUser(logInDTO: logInDTO): Promise<String> {
    const searchUser = await this.authRepository.findByEmail(logInDTO.email);

    if (!searchUser) {
      throw NotFoundError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(
      logInDTO.password,
      searchUser.password as string,
    );

    if (!isMatch) {
      throw NotFoundError('Invalid email or password');
    }

    return this.jwtService.createJWT(
      searchUser._id as string,
      searchUser.role,
      searchUser.subscription as any,
    );
  }
}
