import { Router } from "express";
import { Role } from "@prisma/client";
import Auth from "../../middleware/auth";
import * as DoctorController from "./doctor.controller";

const router = Router();

// The whole portal is admin-only.
router.use(Auth(Role.ADMIN));

// Static paths first so "filter-options" is never read as an :id.
router.get("/filter-options", DoctorController.doctorFilterOptions);

router.get("/", DoctorController.listDoctors);
router.post("/", DoctorController.createDoctor);
router.get("/:id", DoctorController.getDoctor);
router.patch("/:id", DoctorController.updateDoctor);

router.get("/:id/patients", DoctorController.listDoctorPatients);
router.post("/:id/patients", DoctorController.addDoctorPatient);
router.delete("/:id/patients/:patientId", DoctorController.deleteDoctorPatient);

export const DoctorRoutes = router;
