import { Router } from "express";
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";
import * as UserController from "./user.controller";

const router = Router();

router.get("/", Auth(Role.ADMIN), UserController.getProfile);

export const UserRoutes = router;
