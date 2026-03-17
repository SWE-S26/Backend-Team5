import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { ProfileService } from './profile.service';
import { ProfileIdParamDTO } from './dtos/profile.request.params';
import { UpdateProfileRequestBodyDTO } from './dtos/profile.request.body';

export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  async findOne(req: Request, res: Response): Promise<void> {
    try {
      const validatedRequest = parseRequest(ProfileIdParamDTO, req);
      if (!validatedRequest.success) {
        throw validatedRequest.error;
      }
      const userId = validatedRequest.data!.id;
      const profile = await this.service.findById(userId);

      if (!profile) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json(profile);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userInfo!._id;
      const validatedRequest = parseRequest(UpdateProfileRequestBodyDTO, req);
      if (!validatedRequest.success) {
        throw validatedRequest.error;
      }
      const updatedProfile = await this.service.update(
        userId,
        validatedRequest.data,
      );
      if (!updatedProfile) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json(updatedProfile);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  }
}
