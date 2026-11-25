import { Role } from "@prisma/client";
import { AccessTokenClaims } from "../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      auth?: AccessTokenClaims;
      user?: {
        id: number;
        role: Role;
      };
    }
  }
}

export {};
