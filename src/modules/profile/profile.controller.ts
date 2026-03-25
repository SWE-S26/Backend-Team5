import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { NotFoundError } from '../../shared/errors/responseErrors';
import { ProfileService } from './profile.service';
import {
  ProfileIdParamDTO,
  ProfileLinkParamDTO,
} from './dtos/profile.request.params';

import { CheckProfileLinkParamDTO } from './dtos/profile.request.query';
import {
  UpdateProfileRequestDTO,
  UpdatePrivacySettingsRequestDTO,
  UpdateProfileImagesRequestDTO,
  UpdateNotificationsSettingsRequestDTO,
  UpdateAccountSettingsRequestDTO,
  UpdateContentSettingsRequestDTO,
} from './dtos/profile.request';

export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  async getProfileById(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(ProfileIdParamDTO, req);
    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const userId = validatedRequest.data!.params.id;
    const profile = await this.service.getProfileById(userId);

    if (!profile) throw NotFoundError('User not found');

    res.json(profile);
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;
    const validatedRequest = parseRequest(UpdateProfileRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const updated = await this.service.updateProfile(
      userId,
      validatedRequest.data.body,
    );

    if (!updated) throw NotFoundError('User not found');

    res.json(updated);
  }

  async updateProfileImages(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;

    const files = req.files as {
      profileImg?: Express.Multer.File[];
      bannerImg?: Express.Multer.File[];
    };

    const validatedRequest = parseRequest(UpdateProfileImagesRequestDTO, req);

    if (!validatedRequest.success) throw validatedRequest.error;

    const flags = validatedRequest.data.body;

    const updated = await this.service.updateProfileImages(
      userId,
      flags,
      files,
    );

    if (!updated) {
      throw NotFoundError('User not found');
    }

    res.json(updated);
  }

  async getPrivacySettings(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;

    const settings = await this.service.getPrivacySettings(userId);
    if (!settings) throw NotFoundError('User settings not found');

    res.json(settings);
  }

  async updatePrivacySettings(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;
    const validatedRequest = parseRequest(UpdatePrivacySettingsRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const updated = await this.service.updatePrivacySettings(
      userId,
      validatedRequest.data.body,
    );
    if (!updated) throw NotFoundError('User settings not found');

    res.json(updated);
  }
  async getNotificationsSettings(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;

    const settings = await this.service.getNotificationsSettings(userId);
    if (!settings) throw NotFoundError('User settings not found');

    res.json(settings);
  }

  async updateNotificationsSettings(
    req: Request,
    res: Response,
  ): Promise<void> {
    const userId = req.userInfo!._id;
    const validatedRequest = parseRequest(
      UpdateNotificationsSettingsRequestDTO,
      req,
    );

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const updated = await this.service.updateNotificationsSettings(
      userId,
      validatedRequest.data.body,
    );
    if (!updated) throw NotFoundError('User settings not found');

    res.json(updated);
  }

  async getAccountSettings(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;

    const settings = await this.service.getAccountSettings(userId);
    if (!settings) throw NotFoundError('User settings not found');

    res.json(settings);
  }

  async updateAccountSettings(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;
    const validatedRequest = parseRequest(UpdateAccountSettingsRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const updated = await this.service.updateAccountSettings(
      userId,
      validatedRequest.data.body,
    );
    if (!updated) throw NotFoundError('User settings not found');

    res.json(updated);
  }

  async getContentSettings(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;

    const settings = await this.service.getContentSettings(userId);
    if (!settings) throw NotFoundError('User settings not found');

    res.json(settings);
  }

  async updateContentSettings(req: Request, res: Response): Promise<void> {
    const userId = req.userInfo!._id;
    const validatedRequest = parseRequest(UpdateContentSettingsRequestDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const updated = await this.service.updateContentSettings(
      userId,
      validatedRequest.data.body,
    );
    if (!updated) throw NotFoundError('User settings not found');

    res.json(updated);
  }

  async getProfileByProfileLink(req: Request, res: Response): Promise<void> {
    const validatedRequest = parseRequest(ProfileLinkParamDTO, req);

    if (!validatedRequest.success) {
      throw validatedRequest.error;
    }

    const profileLink = validatedRequest.data!.params.profileLink;
    const profile = await this.service.getProfileByProfileLink(profileLink);

    if (!profile) throw NotFoundError('User not found');

    res.json(profile);
  }

  async isProfileLinkTaken(req: Request, res: Response): Promise<void> {
    const validated = parseRequest(CheckProfileLinkParamDTO, req);
    if (!validated.success) throw validated.error;

    const { profileLink } = validated.data.query;
    const result = await this.service.isProfileLinkTaken(profileLink);

    res.json(result);
  }
}
