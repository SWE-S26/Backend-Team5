import { AdminRepository } from './admin.repository';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../shared/errors/responseErrors';
import { AdminMapper } from './dtos/admin.mapper';
import { IUser } from '../../shared/models/models.user';
import { AuthService } from '../auth/auth.service';

type ListUsersOptions = {
  requesterRole?: string;
  offset: number;
  limit: number;
  role?: IUser['role'];
  suspended?: boolean;
  query?: string;
};

type ListMediaOptions = {
  requesterRole?: string;
  offset: number;
  limit: number;
  query?: string;
};

type CreateReportOptions = {
  reporterId?: string;
  violatorId: string;
  violatorType: 'user' | 'track';
  reason: string;
};

type ArtistAnalyticsOptions = {
  userId?: string;
};

export class AdminService {
  constructor(
    private readonly repository: AdminRepository,
    private readonly authService: AuthService = new AuthService(),
  ) {}

  async findAll(options: ListUsersOptions) {
    if (options.requesterRole !== 'Admin') {
      throw ForbiddenError('Only admins can access this resource');
    }

    const offset = Math.max(1, options.offset || 1);
    const limit = Math.max(1, options.limit || 20);

    const { users, total } = await this.repository.findAll({
      offset,
      limit,
      role: options.role,
      suspended: options.suspended,
      query: options.query,
    });

    return AdminMapper.toListResponse(users, total, offset, limit);
  }

  async listMedia(options: ListMediaOptions) {
    if (options.requesterRole !== 'Admin') {
      throw ForbiddenError('Only admins can access this resource');
    }

    const offset = Math.max(1, options.offset || 1);
    const limit = Math.max(1, options.limit || 20);

    const { items, total } = await this.repository.findAllMedia({
      offset,
      limit,
      query: options.query,
    });

    return AdminMapper.toMediaListResponse(items, total, offset, limit);
  }

  async suspend(userId: string, reason: string, requesterRole?: string) {
    if (requesterRole !== 'Admin') {
      throw ForbiddenError('Only admins can access this resource');
    }

    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw NotFoundError('user not found');
    }

    if (user.ban) {
      throw BadRequestError('User is already suspended');
    }

    const result = await this.repository.banUser(userId, reason);

    if (!result) {
      throw NotFoundError('user not found');
    }

    const adminRow = await this.repository.findAdminUserRowById(userId);

    return AdminMapper.toResponse(adminRow!);
  }

  async unsuspend(userId: string, requesterRole?: string) {
    if (requesterRole !== 'Admin') {
      throw ForbiddenError('Only admins can access this resource');
    }

    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw NotFoundError('user not found');
    }

    if (!user.ban) {
      throw BadRequestError('User is not suspended');
    }

    const result = await this.repository.unbanUser(userId);

    if (!result) {
      throw NotFoundError('user not found');
    }

    const adminRow = await this.repository.findAdminUserRowById(userId);

    return AdminMapper.toResponse(adminRow!);
  }

  async deleteUser(userId: string, requesterRole?: string) {
    if (requesterRole !== 'Admin') {
      throw ForbiddenError('Only admins can access this resource');
    }

    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw NotFoundError('user not found');
    }

    if (user.role === 'Admin') {
      throw ForbiddenError('Admin accounts cannot be deleted');
    }

    await this.authService.deleteUserWithCleanup(userId);

    return {
      message: 'User account permanently deleted.',
    };
  }

  async banTrack(trackId: string, reason: string, requesterRole?: string) {
    if (requesterRole !== 'Admin') {
      throw ForbiddenError('Only admins can access this resource');
    }

    const track = await this.repository.findTrackById(trackId);

    if (!track) {
      throw NotFoundError('track not found');
    }

    if (track.hidden) {
      throw BadRequestError('Track is already banned');
    }

    await this.repository.banTrack(trackId, reason);

    const row = await this.repository.findAdminMediaTrackRowById(trackId);

    if (!row) {
      throw NotFoundError('track not found');
    }

    return AdminMapper.toMediaResponse(row);
  }

  async unbanTrack(trackId: string, requesterRole?: string) {
    if (requesterRole !== 'Admin') {
      throw ForbiddenError('Only admins can access this resource');
    }

    const track = await this.repository.findTrackById(trackId);

    if (!track) {
      throw NotFoundError('track not found');
    }

    if (!track.hidden) {
      throw BadRequestError('Track is not banned');
    }

    await this.repository.unbanTrack(trackId);

    const row = await this.repository.findAdminMediaTrackRowById(trackId);

    if (!row) {
      throw NotFoundError('track not found');
    }

    return AdminMapper.toMediaResponse(row);
  }

  async deleteTrack(trackId: string, requesterRole?: string) {
    if (requesterRole !== 'Admin') {
      throw ForbiddenError('Only admins can access this resource');
    }

    const track = await this.repository.findTrackById(trackId);

    if (!track) {
      throw NotFoundError('track not found');
    }

    await this.repository.deleteTrackById(trackId);

    return {
      message: 'Track permanently deleted.',
    };
  }

  async createReport(options: CreateReportOptions) {
    if (!options.reporterId) {
      UnauthorizedError('Unauthorized Access');
    }

    const reporter = await this.repository.findUserById(options.reporterId!);

    if (!reporter) {
      NotFoundError('reporter not found');
    }

    if (options.violatorType === 'user') {
      const violatorUser = await this.repository.findUserById(
        options.violatorId,
      );
      if (!violatorUser) {
        NotFoundError('violator user not found');
      }
    }

    if (options.violatorType === 'track') {
      const violatorTrack = await this.repository.findTrackById(
        options.violatorId,
      );
      if (!violatorTrack) {
        NotFoundError('violator track not found');
      }
    }

    const report = await this.repository.createReport({
      reporterId: options.reporterId!,
      violatorId: options.violatorId,
      violatorType: options.violatorType,
      reason: options.reason,
    });

    return AdminMapper.toReportResponse(report);
  }

  async getAnalyticsOverview(requesterRole?: string) {
    if (requesterRole !== 'Admin') {
      throw ForbiddenError('Only admins can access this resource');
    }

    const result = await this.repository.getAnalyticsOverview();
    return AdminMapper.toAnalyticsOverviewResponse(result);
  }

  async getAnalyticsStorage(requesterRole?: string) {
    if (requesterRole !== 'Admin') {
      throw ForbiddenError('Only admins can access this resource');
    }

    const result = await this.repository.getAnalyticsStorage();
    return AdminMapper.toAnalyticsStorageResponse(result);
  }

  async getArtistAnalytics(options: ArtistAnalyticsOptions) {
    if (!options.userId) {
      UnauthorizedError('Unauthorized Access');
    }

    const result = await this.repository.getArtistAnalytics(options.userId!);
    return AdminMapper.toArtistAnalyticsResponse(result);
  }

  async findById(id: string): Promise<any | null> {
    return this.repository.findById(id);
  }

  async create(data: any): Promise<any> {
    return this.repository.create(data);
  }

  async update(id: string, data: any): Promise<any | null> {
    return this.repository.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    return this.repository.delete(id);
  }
}
