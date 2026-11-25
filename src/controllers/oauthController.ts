import { Request, Response } from "express";
import { RevokeRequest, TokenRequest } from "../models/oauth";
import { oauthService, parseClientCredentials } from "../services/oauthService";

const noStore = (res: Response) => res.set({ "Cache-Control": "no-store", Pragma: "no-cache" });

export const issueToken = async (req: Request<Record<string, never>, unknown, TokenRequest>, res: Response) => {
  const body = req.body ?? {};
  const result = await oauthService.token(body, parseClientCredentials(req.header("Authorization"), body));
  noStore(res).status(200).json(result);
};

export const revokeToken = async (req: Request<Record<string, never>, unknown, RevokeRequest>, res: Response) => {
  const body = req.body ?? {};
  await oauthService.revoke(body, parseClientCredentials(req.header("Authorization"), body));
  noStore(res).status(200).send();
};
