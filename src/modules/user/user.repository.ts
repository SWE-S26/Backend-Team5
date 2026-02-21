// user.repository.ts
import { UserModel, IUser } from "./user.model";

export class UserRepository {
	async create(user: Partial<IUser>): Promise<IUser> {
		return UserModel.create(user);
	}

	async findByEmail(email: string): Promise<IUser | null> {
		return UserModel.findOne({ email });
	}

	async findById(id: string): Promise<IUser | null> {
		return UserModel.findById(id);
	}

	async findAll(
		filter: Partial<IUser>,
		page = 1,
		limit = 10,
	): Promise<IUser[]> {
		return UserModel.find(filter as any)
			.skip((page - 1) * limit)
			.limit(limit);
	}

	async updateById(id: string, update: Partial<IUser>): Promise<IUser | null> {
		return UserModel.findByIdAndUpdate(id, update, { new: true });
	}
}
