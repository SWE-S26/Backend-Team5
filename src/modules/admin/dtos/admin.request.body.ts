import extendedZod from '../../../shared/docs/dtoDocumenter';

export const SuspendRequestBodyDTO = extendedZod
  .object({
    reason: extendedZod
      .string()
      .min(1, 'a Reason must be provided')
      .max(500)
      .trim(),
  })
  .openapi('SuspendRequest', {
    example: {
      reason: 'Violation of community guidelines.',
    },
  });

export const CreateReportRequestBodyDTO = extendedZod
  .object({
    violatorId: extendedZod.mongoId(),
    violatorType: extendedZod.enum(['user', 'track']),
    reason: extendedZod.string().min(1).max(2000).trim(),
  })
  .openapi('CreateReportRequest', {
    example: {
      violatorId: '507f1f77bcf86cd799439012',
      violatorType: 'track',
      reason: 'This track contains abusive content.',
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
    reason: extendedZod
      .string()
      .min(1, 'A reason must be provided')
      .max(500)
      .trim(),
  })
  .openapi('AdminActionReasonRequest', {
    example: {
      reason: 'Content violates community guidelines.',
    },
  });
