import { AdminRepository } from './admin.repository';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
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
