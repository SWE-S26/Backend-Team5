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

const toOptionalSearchQuery = (value: unknown): string | undefined => {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

export const AdminRoleQueryDto = extendedZod.object({
  role: extendedZod.enum(['Listener', 'Artist', 'Pro', 'Admin']).optional(),
});

export const ListAdminUsersQueryDto = extendedZod.object({
  offset: extendedZod.coerce.number().int().min(1).default(1),
  limit: extendedZod.coerce.number().int().min(1).max(100).default(20),
  role: AdminRoleQueryDto.shape.role,
  suspended: extendedZod
    .preprocess(toOptionalBoolean, extendedZod.boolean().optional())
    .optional(),
  query: extendedZod
    .preprocess(toOptionalSearchQuery, extendedZod.string().min(1).optional())
    .optional(),
});

export const ListAdminsQueryDto = ListAdminUsersQueryDto;
