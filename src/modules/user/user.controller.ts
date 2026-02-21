// user.controller.ts
import { Request, Response } from "express";
import { UserService } from "./user.service";
import { parseRequest } from "../../shared/dtos/requestParser";
import {
	CreateUserRequestDTO,
	GetUserByIdRequestDTO,
	LoginRequestDTO,
	ListUsersRequestDTO,
	UpdateUserRequestDTO,
} from "./dtos/user.request";

const service = new UserService();

export class UserController {
	async register(req: Request) {
		const { success, data, error } = parseRequest(CreateUserRequestDTO, req);
		if (!success) throw error;

		const { email, password, name } = data!.body;
		return await service.register(email, password, name);
	}

	async login(req: Request, res: Response) {
		const { success, data, error } = parseRequest(LoginRequestDTO, req);
		if (!success) throw error;

		const { email, password } = data!.body;

		const login = await service.login(email, password);

		res.json(login);
	}

	async getById(req: Request) {
		const { success, data, error } = parseRequest(GetUserByIdRequestDTO, req);
		if (!success) throw error;
		const id = data!.params.id;
		return await service.getById(id);
	}

	async list(req: Request, res: Response) {
		const { success, data, error } = parseRequest(ListUsersRequestDTO, req);
		if (!success) throw error;

		const { page, limit, role } = data!.query;
		const users = await service.listUsers(
			role,
			Number(page) || 1,
			Number(limit) || 10,
		);

		res.json(users);
	}

	async update(req: Request, res: Response) {
		const { success, data, error } = parseRequest(UpdateUserRequestDTO, req);
		if (!success) throw error;

		const user = await service.updateUser(data!.params.id, data!.body);

		res.json(user);
	}
}
