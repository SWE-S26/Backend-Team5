// user.mapper.ts
import { IUser } from "../user.model";
import { UserResponseDTO, GetUserByIdResponseDTO } from "./user.response";

export const mapUserToDTO = (user: IUser) =>
	UserResponseDTO.parse({
		id: user._id.toString(),
		email: user.email,
		name: user.name,
		role: user.role,
	});

export const mapUserToDetailedDTO = (user: IUser) =>
	GetUserByIdResponseDTO.parse({
		id: user._id.toString(),
		email: user.email,
		name: user.name,
	});
