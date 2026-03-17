import extendedZod from '../../../shared/docs/dtoDocumenter';
export const CreateTracksRequestBodyDTO = extendedZod
  .object({
    email: extendedZod.string().email(),
    password: extendedZod.string().min(6),
    name: extendedZod.string().min(2),
  })
  .openapi('CreateTracksRequest', {
    example: {
      email: 'john.doe@example.com',
      password: 'secret123',
      name: 'John Doe',
    },
  });

export const CreateTrackDTO = extendedZod.object({
  trackTitle: extendedZod.string(),
  permaLink: extendedZod
    .string()
    .regex(
      /^[a-z0-9_-]+$/,
      'Use only lowercase letters, numbers, underscores, or hyphens.',
    )
    .regex(/[a-z0-9_-]/, 'Permalink cannot be only digits.'),
  mainArtists: extendedZod
    .array(extendedZod.string().min(1, 'Cannot Be Empty'))
    .min(1, 'At least one artist is required'),
  genre: extendedZod
    .string()
    .optional()
    .transform((value) => value?.trim()),
  tags: extendedZod
    .array(extendedZod.string().min(1, 'Cannot Be Empty'))
    .min(1, 'At least tag  is required')
    .optional(),
  description: extendedZod
    .string()
    .min(1, 'Cannot Be Empty')
    .transform((value) => value?.trim())
    .optional(),
  isPrivate: extendedZod.boolean().default(false),
  enableDirectDownload: extendedZod.boolean().default(false),
  offlineListening: extendedZod.boolean().default(true),
  includeInRssFeed: extendedZod.boolean().default(true),
  displayedEmbedCode: extendedZod.boolean().default(true),
  enableAppPlayback: extendedZod.boolean().default(true),
  licensingType: extendedZod.object({
    type: extendedZod
      .enum(['allRightsReserved', 'creativeCommons'])
      .default('allRightsReserved'),
    attribution: extendedZod.boolean().default(false),
    nonCommercial: extendedZod.boolean().default(false),
    noDerivativeWorks: extendedZod.boolean().default(false),
    shareAlike: extendedZod.boolean().default(false),
  }),
  attribution: extendedZod.boolean().default(false),
  nonCommercial: extendedZod.boolean().default(false),
  noDerivativeWorks: extendedZod.boolean().default(false),
  shareAlike: extendedZod.boolean().default(false),
  audioClipStart: extendedZod
    .string()
    .regex(/^\d{1,2}:\d{2}$/, 'Start timestamp must be in mm:ss format')
    .optional(),
  audioClipEnd: extendedZod
    .string()
    .regex(/^\d{1,2}:\d{2}$/, 'Start timestamp must be in mm:ss format')
    .optional(),
  buyLink: extendedZod.string().optional(),
  recordLabel: extendedZod.string().optional(),
  releaseDate: extendedZod
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format, must be ISO 8601',
    }),
  publisher: extendedZod.string().optional(),
  ISRC: extendedZod
    .string()
    // CC-XXX-YY-NNNNN
    // CC - Country code
    // XXX - Registrant code
    // YY - Year of reference
    // NNNNN - Designation code
    .regex(
      /^[A-Z]{2}[A-Z0-9]{3}\d{2}\d{5}/,
      'An ISRC (International Standard Recording Code) is a unique identifier that is assigned to a track. Use the same ISRC for a given track wherever you distribute it.',
    )
    .optional(),
  hasExplictContent: extendedZod.boolean().default(false),
  pLine: extendedZod.string().optional(),
});
