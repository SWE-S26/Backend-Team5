import extendedZod from '../../../shared/docs/dtoDocumenter';
import { AuthIdParamDTO } from './auth.request.params';
import {
  GoogleCallbackQueryDto,
  ListAuthsQueryDto,
  VerifyEmailQueryDto,
} from './auth.request.query';
import {
  checkEmailRequestBodyDTO,
  CreateAuthRequestBodyDTO,
  ForgotPasswordRequestBodyDTO,
  GoogleCompleteSignUpRequestBodyDTO,
  LoginInRequestBodyDTO,
  ResetPasswordRequestBodyDTO,
  SignUpRequestBodyDTO,
} from './auth.request.body';

// ! THIS IS AN EXAMPLE DTO
export const CreateAuthRequestDTO = extendedZod.object({
  params: AuthIdParamDTO,
  query: ListAuthsQueryDto,
  body: CreateAuthRequestBodyDTO,
});

export const SignUpRequestDTO = extendedZod.object({
  body: SignUpRequestBodyDTO,
});

export const LogInRequestDTO = extendedZod.object({
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
  body: GoogleCompleteSignUpRequestBodyDTO,
});
