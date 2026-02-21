// user.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "./user.repository";
import "dotenv/config";
import { mapUserToDTO, mapUserToDetailedDTO } from "./dtos/user.mapper";
import {
	NotFoundError,
	BadRequestError,
} from "../../shared/errors/responseErrors";

export class UserService {
	constructor(private repo = new UserRepository()) {}

	async register(email: string, password: string, name: string) {
		const existing = await this.repo.findByEmail(email);
		if (existing) throw BadRequestError("Email already exists");

		const hashed = await bcrypt.hash(password, 10);
		const user = await this.repo.create({ email, password: hashed, name });
		return mapUserToDTO(user);
	}

	async login(email: string, password: string) {
		const user = await this.repo.findByEmail(email);
		if (!user) throw NotFoundError("User not found");

		const valid = await bcrypt.compare(password, user.password);
		if (!valid) throw NotFoundError("User not found");

		const token = jwt.sign(
			{ id: user._id, role: user.role },
			process.env.JWT_SECRET as string,
			{
				expiresIn: "7d",
			},
		);

		return { token, user: mapUserToDTO(user) };
	}

	async getProfile(userId: string) {
		const user = await this.repo.findById(userId);
		if (!user) throw NotFoundError("User not found");
		return mapUserToDTO(user);
	}

	async getById(userId: string) {
		const user = await this.repo.findById(userId);
		if (!user) throw NotFoundError("User not found");
		return mapUserToDetailedDTO(user);
	}

	async listUsers(role?: "user" | "admin", page = 1, limit = 10) {
		const filter = role ? { role } : {};
		const users = await this.repo.findAll(filter, page, limit);
		// note here this is an array
		return users.map(mapUserToDTO);
	}

	async updateUser(id: string, data: { email?: string; name?: string }) {
		const user = await this.repo.updateById(id, data);
		if (!user) throw NotFoundError("User not found");
		return mapUserToDTO(user);
	}
}
