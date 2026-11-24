import { Router } from "express";
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";
import * as PatientController from "./patient.controller";

const router = Router();

router.use(Auth(Role.ADMIN));

router.get("/filter-options", PatientController.patientFilterOptions);

router.get("/", PatientController.listPatients);
router.patch("/:id", PatientController.updatePatient);
router.delete("/:id", PatientController.deletePatient);

export const PatientRoutes = router;
