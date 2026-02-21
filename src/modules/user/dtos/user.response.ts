// user.response.ts
import extendedZod from "../../../shared/docs/dtoDocumenter";

export const UserResponseDTO = extendedZod
	.object({
		id: extendedZod.string(),
		email: extendedZod.string(),
		name: extendedZod.string(),
		role: extendedZod.enum(["user", "admin"]),
	})
	.openapi("UserResponse", {
		example: {
			id: "697b7c75001e8cb1d4c0bb67",
			email: "user@example.com",
			name: "cow",
			role: "user",
		},
	});

export const LoginResponseDTO = extendedZod
	.object({
		token: extendedZod.string(),
		user: UserResponseDTO,
	})
	.openapi("LoginResponse", {
		example: {
			token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
			user: {
				id: "697b7c75001e8cb1d4c0bb67",
				email: "user@example.com",
				name: "cow",
				role: "user",
			},
		},
	});

export const GetUserByIdResponseDTO = extendedZod
	.object({
		id: extendedZod.string(),
		email: extendedZod.string(),
		name: extendedZod.string(),
	})
	.openapi("GetUserByIdResponse");
