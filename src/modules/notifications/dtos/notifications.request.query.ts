import extendedZod from '../../../shared/docs/dtoDocumenter';

const toOptionalBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return undefined;
};

export const ListNotificationsQueryDTO = extendedZod.object({
  offset: extendedZod.coerce.number().int().min(1).default(1),
  limit: extendedZod.coerce.number().int().min(1).max(50).default(20),
  read: extendedZod
    .preprocess(toOptionalBoolean, extendedZod.boolean().optional())
    .optional(),
});
