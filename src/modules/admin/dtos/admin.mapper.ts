import { Types } from 'mongoose';
import {
  AdminMediaListResponseDTO,
  AdminMediaSnippetResponseDTO,
  ReportResponseDTO,
  AdminUserListResponseDTO,
  AdminUserSnippetResponseDTO,
  AdminAnalyticsOverviewResponseDTO,
  AdminAnalyticsStorageResponseDTO,
  ArtistAnalyticsResponseDTO,
} from './admin.response';

export type AdminUserListRow = {
  _id: Types.ObjectId | string;
  displayName: string;
  email: string;
  role: 'Listener' | 'Pro' | 'Admin';
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

export type AdminReportRow = {
  _id: Types.ObjectId | string;
  reporterId: Types.ObjectId | string;
  violatorId: Types.ObjectId | string;
  violatorType: 'user' | 'track';
  reason: string;
  status: 'pending' | 'done';
  createdAt: Date;
};

export type AdminAnalyticsOverviewRow = {
  totalUsers: number;
  proUsers: number;
  listenerUsers: number;
  totalTracks: number;
  totalPlays: number;
};

export type AdminAnalyticsStorageRow = {
  usedBytes: number;
};

export type AdminArtistAnalyticsRow = {
  totalPlays: number;
  totalReposts: number;
  totalDownloads: number;
  totalLikes: number;
  totalComments: number;
  totalplayrate: number;
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

  static toReportResponse(entity: AdminReportRow) {
    return ReportResponseDTO.parse({
      reportId: entity._id.toString(),
      reportedId: entity.reporterId.toString(),
      violatorId: entity.violatorId.toString(),
      violatorType: entity.violatorType,
      reason: entity.reason,
      status: entity.status,
      createdAt: entity.createdAt.toISOString(),
    });
  }

  static toAnalyticsOverviewResponse(entity: AdminAnalyticsOverviewRow) {
    return AdminAnalyticsOverviewResponseDTO.parse({
      totalUsers: entity.totalUsers,
      proToListenersRatio:
        entity.listenerUsers === 0 ? 0 : entity.proUsers / entity.listenerUsers,
      totalTracks: entity.totalTracks,
      totalPlays: entity.totalPlays,
    });
  }

  static toAnalyticsStorageResponse(entity: AdminAnalyticsStorageRow) {
    return AdminAnalyticsStorageResponseDTO.parse({
      usedBytes: entity.usedBytes,
    });
  }

  static toArtistAnalyticsResponse(entity: AdminArtistAnalyticsRow) {
    return ArtistAnalyticsResponseDTO.parse({
      totalPlays: entity.totalPlays,
      totalReposts: entity.totalReposts,
      totalDownloads: entity.totalDownloads,
      totalLikes: entity.totalLikes,
      totalComments: entity.totalComments,
      totalplayrate: entity.totalplayrate,
    });
  }

  static toEntity(dto: unknown): unknown {
    return dto;
  }
}
