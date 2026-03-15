import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { AuthService } from './auth.service';
import {
  checkEmailRequestBodyDTO,
  SignUpRequestBodyDTO,
} from './dtos/auth.request.body';

export class AuthController {
  constructor(private readonly service: AuthService) {}

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

  async create(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
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
