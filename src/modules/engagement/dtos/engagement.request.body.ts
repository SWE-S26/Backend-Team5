import extendedZod from '../../../shared/docs/dtoDocumenter';

export const CreateCommentRequestBodyDTO = extendedZod
  .object({
    content: extendedZod
      .string()
      .trim()
      .min(1, "content can't be empty")
      .max(500),
    timestamp: extendedZod.number().int().min(0),
    parentCommentId: extendedZod.string().optional(),
  })
  .openapi('CreateCommentRequest', {
    example: {
      content: 'Great track!',
      timestamp: 42,
    },
  });

export const RepostRequestBodyDTO = extendedZod
  .object({
    caption: extendedZod.string().max(280).optional(),
  })
  .openapi('RepostRequest', {
    example: {
      caption: 'Love this track!',
    },
  });

export const UpdateRepostCaptionBodyDTO = extendedZod
  .object({
    caption: extendedZod.string().max(280),
  })
  .openapi('UpdateRepostCaptionRequest', {
    example: {
      caption: 'Updated caption text!',
    },
  });
