import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { ProfileService } from './profile.service';
import { ProfileIdParamDTO } from './dtos/profile.request.params';
import {
  UpdateProfileRequestDTO,
  UpdatePrivacySettingsRequestDTO,
  UpdateProfileImagesRequestDTO,
} from './dtos/profile.request';

export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const validatedRequest = parseRequest(ProfileIdParamDTO, req);
      if (!validatedRequest.success) {
        throw validatedRequest.error;
      }

      const userId = validatedRequest.data!.params.id;
      const profile = await this.service.getProfile(userId);

      if (!profile) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json(profile);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userInfo!._id;
      const validatedRequest = parseRequest(UpdateProfileRequestDTO, req);

      if (!validatedRequest.success) {
        throw validatedRequest.error;
      }

      const updated = await this.service.updateProfile(
        userId,
        validatedRequest.data.body,
      );

      if (!updated) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  }

  async updateProfileImages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userInfo!._id;

      const files = req.files as {
        profileImg?: Express.Multer.File[];
        bannerImg?: Express.Multer.File[];
      };

      const validatedRequest = parseRequest(UpdateProfileImagesRequestDTO, req);

      if (!validatedRequest.success) {
        throw validatedRequest.error;
      }
      const flags = validatedRequest.data.body;

      const updated = await this.service.updateProfileImages(
        userId,
        flags,
        files,
      );

      if (!updated) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  }

  async getPrivacySettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userInfo!._id;
      const settings = await this.service.getPrivacySettings(userId);
      if (!settings) {
        res.status(404).json({ message: 'User settings not found' });
        return;
      }
      res.json(settings);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  }

  async updatePrivacySettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userInfo!._id;
      const validatedRequest = parseRequest(
        UpdatePrivacySettingsRequestDTO,
        req,
      );

      if (!validatedRequest.success) {
        throw validatedRequest.error;
      }

      const updated = await this.service.updatePrivacySettings(
        userId,
        validatedRequest.data.body,
      );
      if (!updated) {
        res.status(404).json({ message: 'User settings not found' });
        return;
      }
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  }
}
