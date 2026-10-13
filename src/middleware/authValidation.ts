import { RequestHandler } from "express";
import { LoginInput } from "../models/auth";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const validateLogin: RequestHandler = (req, res, next) => {
  const body = req.body as Partial<LoginInput>;
  if (!isNonEmptyString(body.email) || !isNonEmptyString(body.password)) {
    res.status(400).json({ success: false, message: "Email and password are required." });
    return;
  }
  next();
};