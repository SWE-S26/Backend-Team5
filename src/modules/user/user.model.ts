// user.model.ts
import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
	email: string;
	password: string;
	name: string;
	role: "user" | "admin";
	createdAt: Date;
	updatedAt: Date;
}

const userSchema = new Schema<IUser>(
	{
		email: { type: String, required: true, unique: true, lowercase: true },
		password: { type: String, required: true },
		name: { type: String, required: true },
		role: { type: String, enum: ["user", "admin"], default: "user" },
	},
	{ timestamps: true },
);

export const UserModel = model<IUser>("User", userSchema);
