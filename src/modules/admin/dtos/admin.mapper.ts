import { Types } from 'mongoose';
import {
  AdminUserListResponseDTO,
  AdminUserSnippetResponseDTO,
} from './admin.response';

export type AdminUserListRow = {
  _id: Types.ObjectId | string;
  displayName: string;
  email: string;
  role: 'Listener' | 'Artist' | 'Pro' | 'Admin';
  ban: boolean;
  createdAt: Date;
  uploadedTracksCount: number;
  followersCount: number;
};

export class AdminMapper {
  static toResponse(entity: AdminUserListRow) {
    return AdminUserSnippetResponseDTO.parse({
      userId: entity._id.toString(),
      displayName: entity.displayName,
      email: entity.email,
      role: entity.role,
      suspended: entity.ban,
      createdAt: entity.createdAt.toISOString(),
      uploadedTracksCount: entity.uploadedTracksCount,
      followersCount: entity.followersCount,
    });
  }

  static toListResponse(
    entities: AdminUserListRow[],
    total: number,
    offset: number,
    limit: number,
  ) {
    return AdminUserListResponseDTO.parse({
      total,
      offset,
      limit,
      users: entities.map((entity) => this.toResponse(entity)),
    });
  }

  static toEntity(dto: unknown): unknown {
    return dto;
  }
}
