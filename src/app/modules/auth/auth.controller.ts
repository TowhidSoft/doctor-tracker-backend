import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { AuthServices } from "./auth.service";
import { AuthValidation } from "./auth.validation";

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.login(AuthValidation.loginSchema.parse(req.body));
  sendResponse(res, { statusCode: httpStatus.OK, status: true, message: "Login successful", data: result });
});
