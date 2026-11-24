import { Router } from "express";
import { refreshAccessToken } from "../../../helpers/utility/refreshToken";
import * as AuthController from "./auth.controller";

const router = Router();

// Admin-only portal: there is no public registration endpoint.
router.post("/login", AuthController.login);
router.post("/refreshToken", refreshAccessToken);

export const AuthRoutes = router;
