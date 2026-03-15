import extendedZod from '../../../shared/docs/dtoDocumenter';
import { AuthIdParamDTO } from './auth.request.params';
import { ListAuthsQueryDto } from './auth.request.query';
import {
  checkEmailRequestBodyDTO,
  CreateAuthRequestBodyDTO,
  LoginInRequestBodyDTO,
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
