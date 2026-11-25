import { Role } from "@prisma/client";

export interface UserRegistrationInput {
  username: string;
  email: string;
  password: string;
}

export interface UserUpdateInput {
  username?: string;
  email?: string;
  password?: string;
}

export interface PublicUser {
  id: number;
  username: string | null;
  email: string;
  role: Role;
  isMealPlanPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}