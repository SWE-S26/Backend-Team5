import { Request, Response } from 'express';
import { parseRequest } from '../../shared/dtos/requestParser';
import { AdminService } from './admin.service';
import {
  DeleteAdminUserRequestDTO,
  GetAdminUsersRequestDTO,
  SuspendUserRequestDTO,
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
