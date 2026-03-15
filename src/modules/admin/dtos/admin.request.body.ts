import extendedZod from '../../../shared/docs/dtoDocumenter';

export const SuspendRequestBodyDTO = extendedZod
  .object({
    reason: extendedZod.string().max(500).optional(),
  })
  .openapi('SuspendRequest', {
    example: {
      reason: 'Violation of community guidelines.',
    },
  });

export const CreateReportRequestBodyDTO = extendedZod
  .object({
    violatorId: extendedZod.string(),
    violatorType: extendedZod.enum(['user', 'track', 'comment']),
    complaintType: extendedZod.enum([
      'spam',
      'harassment',
      'copyright',
      'inappropriate_content',
      'other',
    ]),
    body: extendedZod.string().max(1000).optional(),
  })
  .openapi('CreateReportRequest', {
    example: {
      violatorId: 'usr_002',
      violatorType: 'track',
      complaintType: 'spam',
      body: 'This track contains copyrighted material.',
    },
  });

export const UpdateReportStatusRequestBodyDTO = extendedZod
  .object({
    status: extendedZod.enum(['resolved', 'dismissed']),
    adminNote: extendedZod.string().max(1000).optional(),
  })
  .openapi('UpdateReportStatusRequest', {
    example: {
      status: 'resolved',
      adminNote: 'Content was removed after review.',
    },
  });

export const AdminActionReasonRequestBodyDTO = extendedZod
  .object({
    reason: extendedZod.string().max(500).optional(),
  })
  .openapi('AdminActionReasonRequest', {
    example: {
      reason: 'Content violates community guidelines.',
    },
  });
