import { Request, Response } from "express";
import { UserRegistrationInput, UserUpdateInput } from "../models/user";
import { userService } from "../services/userService";

export const registerUser = async (
  req: Request<Record<string, never>, unknown, UserRegistrationInput>,
  res: Response,
) => {
  const user = await userService.registerUser(req.body);
  res.status(201).json({ success: true, data: user });
};

export const getUserById = async (req: Request<{ id: string }>, res: Response) => {
  res.status(200).json({ success: true, data: await userService.getUser(req.params.id) });
};

export const updateUser = async (
  req: Request<{ id: string }, unknown, UserUpdateInput>,
  res: Response,
) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json({ success: true, data: user });
};

export const deleteUser = async (req: Request<{ id: string }>, res: Response) => {
  await userService.deleteUser(req.params.id);
  res.status(204).send();
};

export const getCombinedUserProfile = async (req: Request<{ id: string }>, res: Response) => {
  const dashboard = await userService.getUserDashboard(req.params.id);
  res.status(200).json({ success: true, data: dashboard });
};