import { Types } from 'mongoose';
import {
  AdminMediaListResponseDTO,
  AdminMediaSnippetResponseDTO,
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

export type AdminMediaListRow = {
  title: string;
  artistName: string;
  type: 'track';
  numberOfPlays: number;
  numberOfLikes: number;
  ban: boolean;
  createdAt: Date | string;
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

  static toMediaResponse(entity: AdminMediaListRow) {
    return AdminMediaSnippetResponseDTO.parse({
      title: entity.title,
      artistName: entity.artistName,
      type: entity.type,
      numberOfPlays: entity.numberOfPlays,
      numberOfLikes: entity.numberOfLikes,
      banned: entity.ban,
      createdAt: new Date(entity.createdAt).toISOString(),
    });
  }

  static toMediaListResponse(
    entities: AdminMediaListRow[],
    total: number,
    offset: number,
    limit: number,
  ) {
    return AdminMediaListResponseDTO.parse({
      total,
      offset,
      limit,
      items: entities.map((entity) => this.toMediaResponse(entity)),
    });
  }

  static toEntity(dto: unknown): unknown {
    return dto;
  }
}
