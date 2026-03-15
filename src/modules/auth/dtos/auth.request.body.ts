import extendedZod from '../../../shared/docs/dtoDocumenter';

// ! THIS IS AN EXAMPLE DTO
export const CreateAuthRequestBodyDTO = extendedZod
  .object({
    email: extendedZod.email(),
    password: extendedZod.string().min(6),
    name: extendedZod.string().min(2),
  })
  .openapi('CreateAuthRequest', {
    example: {
      email: 'john.doe@example.com',
      password: 'secret123',
      name: 'John Doe',
    },
  });

export const checkEmailRequestBodyDTO = extendedZod
  .object({
    email: extendedZod.email(),
  })
  .openapi('checkEmailAuthRequest', {
    example: {
      email: 'john.doe@example.com',
    },
  });

export const SignUpRequestBodyDTO = extendedZod.object({
  email: extendedZod.email(),
  password: extendedZod
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(
      /[^A-za-z0-9]/,
      'Password must contain at least one special character',
    ),
  displayName: extendedZod.string().transform((value) => value.trim()), // remove leading and trailing spaces

  dateOfBirth: extendedZod.preprocess(
    (value) => {
      if (typeof value === 'string' || value instanceof String)
        return new Date(value as string);
      return value;
    },
    extendedZod
      .date()
      .min(new Date('1950-01-01'), '')
      .refine((dob) => {
        const diff = new Date().getTime() - dob.getTime();
        // diff in milliseconds
        const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
        return age >= 13;
      }, "Users' age doesn't meet BeatZa's minimum age requirements"),
  ),

  gender: extendedZod.enum(['Male', 'Female']),
});

export const LoginInRequestBodyDTO = extendedZod.object({
  email: extendedZod.email(),
  password: extendedZod.string(),
});
