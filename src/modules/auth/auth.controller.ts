import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { AuthService } from './auth.service';
import {
  CheckEmailRequestDTO,
  LogInRequestDTO,
  SignUpRequestDTO,
} from './dtos/auth.request';

export class AuthController {
  private isProduction: boolean;
  private readonly service: AuthService;

  constructor() {
    this.isProduction = process.env.NODE_ENV == 'PROD';
    this.service = new AuthService();
  }

  private isCross(req: Request): boolean {
    const userAgent = req.headers['user-agent'] || '';
    // check if user Agent contains these
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    );
  }

  async checkEmailExists(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(CheckEmailRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const data = validatedRequest.data;
    const { email } = data.body;

    const exists = await this.service.doesEmailExists(email);

    res.json({
      message: 'Email Checked Sucessfully',
      data: {
        exists: exists,
      },
    });
  }

  async registerUser(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(SignUpRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userParams = validatedRequest.data.body;
    const isNewUserCreated = await this.service.registerNewUser(userParams);

    if (isNewUserCreated) {
      res.status(201).json({
        message: 'User Signed Up Sucessfully',
      });
    } else {
      throw new Error('User Registration Failed');
    }
  }

  async logInUser(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(LogInRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const logInParams = validatedRequest.data.body;

    const jwtLogInToken = await this.service.logInUser(logInParams);

    if (this.isCross(req)) {
      res.json({
        message: 'User Logged In Sucessfully',
        data: {
          acessToken: jwtLogInToken,
        },
      });
    } else {
      res.cookie('accessToken', jwtLogInToken, {
        httpOnly: true,
        secure: this.isProduction ? true : false,
        sameSite: 'strict', // CSRF protection : another website access the token if not implied
        maxAge: 1000 * 60 * 60 * 1,
      });

      res.json({
        message: 'User Logged In Successfully',
      });
    }
  }
}
