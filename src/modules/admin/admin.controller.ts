import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { AdminService } from './admin.service';
import {
  BanTrackRequestDTO,
  CreateAdminReportRequestDTO,
  DeleteAdminTrackRequestDTO,
  DeleteAdminUserRequestDTO,
  GetAdminAnalyticsOverviewRequestDTO,
  GetAdminAnalyticsStorageRequestDTO,
  GetArtistAnalyticsRequestDTO,
  GetAdminMediaRequestDTO,
  GetAdminUsersRequestDTO,
  SuspendUserRequestDTO,
  UnbanTrackRequestDTO,
  UnsuspendUserRequestDTO,
} from './dtos/admin.request';

export class AdminController {
  constructor(private readonly service: AdminService) {}

  async findAll(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetAdminUsersRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const result = await this.service.findAll({
      requesterRole: req.userInfo?.role,
      ...parsed.data.query,
    });

    res.json(result);
  }

  async listMedia(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetAdminMediaRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const result = await this.service.listMedia({
      requesterRole: req.userInfo?.role,
      ...parsed.data.query,
    });

    res.json(result);
  }

  async suspendUser(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(SuspendUserRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const { userId } = parsed.data.params;
    const { reason } = parsed.data.body;

    const result = await this.service.suspend(
      userId,
      reason,
      req.userInfo?.role,
    );

    res.status(200).json(result);
  }

  async unsuspendUser(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(UnsuspendUserRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const { userId } = parsed.data.params;

    const result = await this.service.unsuspend(userId, req.userInfo?.role);

    res.status(200).json(result);
  }

  async deleteUser(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(DeleteAdminUserRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const { userId } = parsed.data.params;

    const result = await this.service.deleteUser(userId, req.userInfo?.role);

    res.status(200).json(result);
  }

  async banTrack(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(BanTrackRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const { trackId } = parsed.data.params;
    const reason = parsed.data.body?.reason ?? '';

    const result = await this.service.banTrack(
      trackId,
      reason,
      req.userInfo?.role,
    );

    res.status(200).json(result);
  }

  async unbanTrack(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(UnbanTrackRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const { trackId } = parsed.data.params;

    const result = await this.service.unbanTrack(trackId, req.userInfo?.role);

    res.status(200).json(result);
  }

  async deleteTrack(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(DeleteAdminTrackRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const { trackId } = parsed.data.params;

    const result = await this.service.deleteTrack(trackId, req.userInfo?.role);

    res.status(200).json(result);
  }

  async createReport(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(CreateAdminReportRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const { violatorId, violatorType, reason } = parsed.data.body;

    const result = await this.service.createReport({
      reporterId: req.userInfo?._id,
      violatorId,
      violatorType,
      reason,
    });

    res.status(201).json(result);
  }

  async analyticsOverview(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetAdminAnalyticsOverviewRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const result = await this.service.getAnalyticsOverview(req.userInfo?.role);

    res.json(result);
  }

  async analyticsStorage(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetAdminAnalyticsStorageRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const result = await this.service.getAnalyticsStorage(req.userInfo?.role);

    res.json(result);
  }

  async artistAnalytics(req: Request, res: Response): Promise<void> {
    const parsed = parseRequest(GetArtistAnalyticsRequestDTO, req);

    if (!parsed.success) {
      throw parsed.error;
    }

    const result = await this.service.getArtistAnalytics({
      userId: req.userInfo?._id,
    });

    res.json(result);
  }

  async findOne(req: Request, res: Response): Promise<void> {
    //TODO: parse query params if needed
    res.json({});
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
