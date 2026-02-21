// user.request.dto.ts
import extendedZod from "../../../shared/docs/dtoDocumenter";
import {
	CreateUserRequestBodyDTO,
	LoginRequestBodyDTO,
	UpdateUserRequestBodyDTO,
} from "./user.requet.body";

import { UserIdParamDTO } from "./user.request.params";
import { ListUsersQueryDTO } from "./user.request.query";

export const CreateUserRequestDTO = extendedZod.object({
	body: CreateUserRequestBodyDTO,
});

export const LoginRequestDTO = extendedZod.object({
	body: LoginRequestBodyDTO,
});

export const GetUserByIdRequestDTO = extendedZod.object({
	params: UserIdParamDTO,
});

export const UpdateUserRequestDTO = extendedZod.object({
	params: UserIdParamDTO,
	body: UpdateUserRequestBodyDTO,
});

export const ListUsersRequestDTO = extendedZod.object({
	query: ListUsersQueryDTO,
});
