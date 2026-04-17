import z from 'zod';
import extendedZod from '../../../shared/docs/dtoDocumenter';

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

export const ForgotPasswordRequestBodyDTO = extendedZod
  .object({
    email: extendedZod.email(),
  })
  .openapi('forgotPasswordRequest', {
    example: {
      email: 'john.doe@example.com',
    },
  });

export const ResetPasswordRequestBodyDTO = extendedZod
  .object({
    token: extendedZod.string(),
    newPassword: extendedZod
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^A-za-z0-9]/,
        'Password must contain at least one special character',
      ),
  })
  .openapi('resetPasswordRequest', {
    example: {
      token:
        'eyJhbGciO.eyNTYiLCJpYXQiOjE2ODg3NjQ4MDAsImV4cCI6MTY4ODc3ODQwMH0.amno345pqr678stu901vwx234yz567',
      newPassword: 'NewPassword123!',
    },
  });

export const GoogleCompleteSignUpRequestBodyDTO = extendedZod
  .object({
    // passed back as a short-lived "incomplete" JWT from the callback step
    incompleteToken: extendedZod.string(),

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
          const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
          return age >= 13;
        }, "Users' age doesn't meet BeatZa's minimum age requirements"),
    ),

    gender: extendedZod.enum(['Male', 'Female']),
  })
  .openapi('GoogleCompleteSignUpRequest', {
    example: {
      incompleteToken:
        'eyJhbGciO.eyNTYiLCJpYXQiOjE2ODg3NjQ4MDAsImV4cCI6MTY4ODc3ODQwMH0.amno345pqr678stu901vwx234yz567',
      dateOfBirth: '1990-05-15',
      gender: 'Male',
    },
  });

export const GoogleVerifyCodeRequestBodyDTO = extendedZod
  .object({
    pendingToken: extendedZod.string(
      'Missing pending token from Google sign-in process',
    ),
    code: extendedZod.string('Missing verification code sent to email'),
  })
  .openapi('GoogleVerifyCodeRequest', {
    example: {
      pendingToken:
        'eyJhbGciO.eyNTYiLCJpYXQiOjE2ODg3NjQ4MDAsImV4cCI6MTY4ODc3ODQwMH0.amno345pqr678stu901vwx234yz567',
      code: '123456',
    },
  });

export const GoogleResendVerificationCodeRequestBodyDTO = extendedZod
  .object({
    pendingToken: extendedZod.string(
      'Missing pending token from Google sign-in process',
    ),
  })
  .openapi('GoogleResendVerificationCodeRequest', {
    example: {
      pendingToken:
        'eyJhbGciO.eyNTYiLCJpYXQiOjE2ODg3NjQ4MDAsImV4cCI6MTY4ODc3ODQwMH0.amno345pqr678stu901vwx234yz567',
    },
  });

export const DesktopPollingRequestBodyDTO = extendedZod
  .object({
    qrCode: extendedZod.string('Missing QR code'),
  })
  .openapi('DesktopPollingRequest', {
    example: {
      qrCode:
        'eyJhbGciO.eyNTYiLCJpYXQiOjE2ODg3NjQ4MDAsImV4cCI6MTY4ODc3ODQwMH0.amno345pqr678stu901vwx234yz567',
    },
  });

export const MobileApproveLoginRequestBodyDTO =
  DesktopPollingRequestBodyDTO.extend(
    DesktopPollingRequestBodyDTO.shape,
  ).openapi('MobileApproveLoginRequest', {
    example: {
      qrCode:
        'eyJhbGciO.eyNTYiLCJpYXQiOjE2ODg3NjQ4MDAsImV4cCI6MTY4ODc3ODQwMH0.amno345pqr678stu901vwx234yz567',
    },
  });

export type SignUpRequestBody = z.infer<typeof SignUpRequestBodyDTO>;
export type LoginRequestBody = z.infer<typeof LoginInRequestBodyDTO>;
export type ForgotPasswordRequestBody = z.infer<
  typeof ForgotPasswordRequestBodyDTO
>;
export type GoogleCompleteSignUpBody = z.infer<
  typeof GoogleCompleteSignUpRequestBodyDTO
>;
