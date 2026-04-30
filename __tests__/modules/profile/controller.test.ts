import { ProfileController } from '../../../src/modules/profile/profile.controller';
import { ProfileService } from '../../../src/modules/profile/profile.service';
import { Request, Response } from 'express';
import { parseRequest } from '../../../src/shared/dtos/requestParser';

jest.mock('../../../src/shared/dtos/requestParser');

describe('ProfileController - FULL TEST', () => {
  let controller: ProfileController;
  let service: jest.Mocked<ProfileService>;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    service = {
      getProfileById: jest.fn(),
      updateProfile: jest.fn(),
      updateProfileImages: jest.fn(),
      getPrivacySettings: jest.fn(),
      updatePrivacySettings: jest.fn(),
      getNotificationsSettings: jest.fn(),
      updateNotificationsSettings: jest.fn(),
      getAccountSettings: jest.fn(),
      updateAccountSettings: jest.fn(),
      getContentSettings: jest.fn(),
      updateContentSettings: jest.fn(),
      getProfileByProfileLink: jest.fn(),
      isProfileLinkTaken: jest.fn(),
    } as any;

    controller = new ProfileController(service);

    req = {
      userInfo: { _id: 'user1' },
      params: {},
      body: {},
      query: {},
      files: {},
    } as unknown as Request;

    res = {
      json: jest.fn(),
    };

    jest.clearAllMocks();
  });

  const mockValid = (data: any) => {
    (parseRequest as jest.Mock).mockReturnValue({
      success: true,
      data,
    });
  };

  const mockInvalid = (error = new Error('invalid')) => {
    (parseRequest as jest.Mock).mockReturnValue({
      success: false,
      error,
    });
  };

  // =========================
  // getProfileById
  // =========================
  it('getProfileById - success', async () => {
    req.params = { id: 'user2' };
    mockValid({ params: { id: 'user2' } });

    service.getProfileById.mockResolvedValue({ id: 'user2' } as any);

    await controller.getProfileById(req as Request, res as Response);

    expect(service.getProfileById).toHaveBeenCalledWith('user2', 'user1');
    expect(res.json).toHaveBeenCalledWith({ id: 'user2' });
  });

  it('getProfileById - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.getProfileById(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  // =========================
  // updateProfile
  // =========================
  it('updateProfile - success', async () => {
    mockValid({ body: { profileLink: 'ahmed' } });

    service.updateProfile.mockResolvedValue({ profileLink: 'ahmed' } as any);

    await controller.updateProfile(req as Request, res as Response);

    expect(service.updateProfile).toHaveBeenCalledWith('user1', {
      profileLink: 'ahmed',
    });

    expect(res.json).toHaveBeenCalledWith({ profileLink: 'ahmed' });
  });

  it('updateProfile - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.updateProfile(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  // =========================
  // updateProfileImages
  // =========================
  it('updateProfileImages - success', async () => {
    req.files = {
      profileImg: [{ buffer: Buffer.from('img') }] as any,
    };

    mockValid({ body: { removeProfileImg: true } });

    service.updateProfileImages.mockResolvedValue({ id: 'user1' } as any);

    await controller.updateProfileImages(req as Request, res as Response);

    expect(service.updateProfileImages).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ id: 'user1' });
  });

  it('updateProfileImages - not found throws', async () => {
    mockValid({ body: {} });

    service.updateProfileImages.mockResolvedValue(null);

    await expect(
      controller.updateProfileImages(req as Request, res as Response),
    ).rejects.toThrow('User not found');
  });

  it('updateProfileImages - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.updateProfileImages(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  // =========================
  // Privacy Settings
  // =========================
  it('getPrivacySettings', async () => {
    service.getPrivacySettings.mockResolvedValue({ isPrivate: true } as any);

    await controller.getPrivacySettings(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ isPrivate: true });
  });

  it('updatePrivacySettings', async () => {
    mockValid({ body: { isPrivate: false } });

    service.updatePrivacySettings.mockResolvedValue({
      isPrivate: false,
    } as any);

    await controller.updatePrivacySettings(req as Request, res as Response);

    expect(service.updatePrivacySettings).toHaveBeenCalledWith('user1', {
      isPrivate: false,
    });

    expect(res.json).toHaveBeenCalledWith({ isPrivate: false });
  });

  it('updatePrivacySettings - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.updatePrivacySettings(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });

  // =========================
  // Notifications Settings
  // =========================
  it('getNotificationsSettings', async () => {
    service.getNotificationsSettings.mockResolvedValue({
      email: true,
    } as any);

    await controller.getNotificationsSettings(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ email: true });
  });

  it('updateNotificationsSettings', async () => {
    mockValid({ body: { email: false } });

    service.updateNotificationsSettings.mockResolvedValue({
      email: false,
    } as any);

    await controller.updateNotificationsSettings(
      req as Request,
      res as Response,
    );

    expect(res.json).toHaveBeenCalledWith({ email: false });
  });

  // =========================
  // Account Settings
  // =========================
  it('getAccountSettings', async () => {
    service.getAccountSettings.mockResolvedValue({ theme: 'dark' } as any);

    await controller.getAccountSettings(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ theme: 'dark' });
  });

  it('updateAccountSettings', async () => {
    mockValid({ body: { theme: 'light' } });

    service.updateAccountSettings.mockResolvedValue({
      theme: 'light',
    } as any);

    await controller.updateAccountSettings(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ theme: 'light' });
  });

  // =========================
  // Content Settings
  // =========================
  it('getContentSettings', async () => {
    service.getContentSettings.mockResolvedValue({ ads: true } as any);

    await controller.getContentSettings(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ ads: true });
  });

  it('updateContentSettings', async () => {
    mockValid({ body: { ads: false } });

    service.updateContentSettings.mockResolvedValue({
      ads: false,
    } as any);

    await controller.updateContentSettings(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ ads: false });
  });

  // =========================
  // Profile by Link
  // =========================
  it('getProfileByProfileLink', async () => {
    mockValid({ params: { profileLink: 'ahmed' } });

    service.getProfileByProfileLink.mockResolvedValue({
      username: 'ahmed',
    } as any);

    await controller.getProfileByProfileLink(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ username: 'ahmed' });
  });

  // =========================
  // Check profile link
  // =========================
  it('isProfileLinkTaken', async () => {
    mockValid({ query: { profileLink: 'ahmed' } });

    service.isProfileLinkTaken.mockResolvedValue({ taken: true } as any);

    await controller.isProfileLinkTaken(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ taken: true });
  });

  it('isProfileLinkTaken - invalid request throws', async () => {
    mockInvalid(new Error('bad request'));

    await expect(
      controller.isProfileLinkTaken(req as Request, res as Response),
    ).rejects.toThrow('bad request');
  });
});
