import { Request, Response, Router } from "express";
import { Role } from "@prisma/client";
import httpStatus from "http-status";
import { z } from "zod";
import Auth from "../../middleware/auth";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AnalyticsService } from "./analytics.service";

const overviewQuery = z.object({
  days: z.coerce
    .number()
    .refine((n) => [7, 30, 90].includes(n), "days must be 7, 30 or 90")
    .default(30),
});

const router = Router();

router.get(
  "/overview",
  Auth(Role.ADMIN),
  catchAsync(async (req: Request, res: Response) => {
    const { days } = overviewQuery.parse(req.query);
    const data = await AnalyticsService.overview(days);
    sendResponse(res, { statusCode: httpStatus.OK, status: true, message: "Analytics retrieved successfully", data });
  }),
);

export const AnalyticsRoutes = router;
