import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { AuthService } from './auth.service';
import {
  checkEmailRequestBodyDTO,
  SignUpRequestBodyDTO,
  LoginInRequestBodyDTO,
} from './dtos/auth.request.body';
import { access } from 'node:fs';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  private isCross(req: Request): boolean {
    const userAgent = req.headers['user-agent'] || '';
    // check if user Agent contains these
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    );
  }

  async checkEmail(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(checkEmailRequestBodyDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }
    const data = validatedRequest.data;
    const { email } = data.body;
    // dont forget await this is async
    const exists = await this.service.doesEmailExists(email);
    res.json({
      code: 200,
      message: 'Email Checked Sucessfully',
      data: {
        exists: exists,
      },
    });
  }

  async registerUser(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(SignUpRequestBodyDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userParams = validatedRequest.data.body;
    const isNewUserCreated = await this.service.registerNewUser(userParams);
    if (isNewUserCreated) {
      res.json({
        code: 200,
        message: 'User Signed Up Sucessfully',
        data: null,
      });
    }
  }

  async logInUser(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(LoginInRequestBodyDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const logInParams = validatedRequest.data.body;

    const jwtLogInToken = await this.service.logInUser(logInParams);

    if (this.isCross(req)) {
      res.json({
        code: 200,
        message: 'User Logged In Sucessfully',
        data: {
          acessToken: jwtLogInToken,
        },
      });
    } else {
      res.cookie('accessToken', jwtLogInToken, {
        httpOnly: true,
        secure: false, // save cookies only on https if true- in production
        sameSite: 'strict', // CSRF protection : another website access the token if not implied
        maxAge: 1000 * 60 * 60 * 1,
      });

      res.json({
        code: 200,
        message: 'User Logged In Successfully',
      });
    }
  }

  async replace(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }

  async update(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }

  async remove(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
  }
}
