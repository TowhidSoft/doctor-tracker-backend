import { Router } from "express";

import { AuthRoutes } from "../modules/auth/auth.routes";
import { UserRoutes } from "../modules/user/user.routes";
import { DoctorRoutes } from "../modules/doctor/doctor.route";
import { PatientRoutes } from "../modules/patient/patient.route";
import { AnalyticsRoutes } from "../modules/analytics/analytics.route";

const router = Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/user", route: UserRoutes },
  { path: "/doctors", route: DoctorRoutes },
  { path: "/patients", route: PatientRoutes },
  { path: "/analytics", route: AnalyticsRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
