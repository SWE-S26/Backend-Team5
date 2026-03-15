// user.model.ts
import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  displayName: string;
  role: 'user' | 'admin';
  gender: 'Male' | 'Female';
  dateOfBirth: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    displayName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    gender: { type: String, enum: ['Male', 'Female'] },
  },
  { timestamps: true },
);

export const UserModel = model<IUser>('User', userSchema);
