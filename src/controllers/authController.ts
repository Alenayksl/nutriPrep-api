import { Request, Response } from "express";
import { requireActor } from "../middleware/authorization";
import { LoginInput } from "../models/auth";
import { authService } from "../services/authService";

export const login = async (req: Request<Record<string, never>, unknown, LoginInput>, res: Response) => {
  const result = await authService.login(req.body);
  res.status(200).json({ success: true, data: result });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(requireActor(req.user));
  res.status(200).json({ success: true, data: user });
};
