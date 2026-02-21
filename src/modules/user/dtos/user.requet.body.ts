// user.request.body.ts
import extendedZod from "../../../shared/docs/dtoDocumenter";

export const CreateUserRequestBodyDTO = extendedZod
	.object({
		email: extendedZod.string().email(),
		password: extendedZod.string().min(6),
		name: extendedZod.string().min(2),
	})
	.openapi("CreateUserRequest", {
		example: {
			email: "john.doe@example.com",
			password: "secret123",
			name: "John Doe",
		},
	});

export const LoginRequestBodyDTO = extendedZod.object({
	email: extendedZod.string().email(),
	password: extendedZod.string().min(6),
});

export const UpdateUserRequestBodyDTO = extendedZod.object({
	name: extendedZod.string().min(2).optional(),
	email: extendedZod.string().email().optional(),
});