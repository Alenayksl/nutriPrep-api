import { Router } from "express";
import { issueToken, revokeToken } from "../controllers/oauthController";

const router = Router();

router.post("/token", issueToken);
router.post("/revoke", revokeToken);

export default router;
