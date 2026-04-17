import extendedZod from '../../../shared/docs/dtoDocumenter';
import {
  GoogleCallbackQueryDto,
  loginCrossQueryDto,
  VerifyEmailQueryDto,
} from './auth.request.query';
import {
  checkEmailRequestBodyDTO,
  DesktopPollingRequestBodyDTO,
  ForgotPasswordRequestBodyDTO,
  GoogleCompleteSignUpRequestBodyDTO,
  GoogleResendVerificationCodeRequestBodyDTO,
  GoogleVerifyCodeRequestBodyDTO,
  LoginInRequestBodyDTO,
  MobileApproveLoginRequestBodyDTO,
  ResetPasswordRequestBodyDTO,
  SignUpRequestBodyDTO,
} from './auth.request.body';

export const SignUpRequestDTO = extendedZod.object({
  body: SignUpRequestBodyDTO,
});

export const LogInRequestDTO = extendedZod.object({
  query: loginCrossQueryDto,
  body: LoginInRequestBodyDTO,
});

export const CheckEmailRequestDTO = extendedZod.object({
  body: checkEmailRequestBodyDTO,
});

export const VerifyEmailRequestDTO = extendedZod.object({
  query: VerifyEmailQueryDto,
});

export const ForgotPasswordRequestDTO = extendedZod.object({
  body: ForgotPasswordRequestBodyDTO,
});

export const ResetPasswordRequestDTO = extendedZod.object({
  body: ResetPasswordRequestBodyDTO,
});

export const GoogleCallbackRequestDTO = extendedZod.object({
  query: GoogleCallbackQueryDto,
});

export const GoogleCompleteSignUpRequestDTO = extendedZod.object({
  query: loginCrossQueryDto,
  body: GoogleCompleteSignUpRequestBodyDTO,
});

export const GoogleVerifyCodeRequestDTO = extendedZod.object({
  query: loginCrossQueryDto,
  body: GoogleVerifyCodeRequestBodyDTO,
});

export const GoogleResendVerificationCodeRequestDTO = extendedZod.object({
  body: GoogleResendVerificationCodeRequestBodyDTO,
});

export const DesktopPollingRequestDTO = extendedZod.object({
  body: DesktopPollingRequestBodyDTO,
});

export const MobileLoginApprovalRequestDTO = extendedZod.object({
  body: MobileApproveLoginRequestBodyDTO,
});
