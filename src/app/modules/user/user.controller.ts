import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { UserService } from "./user.service";

// The Auth middleware puts the verified token's user id on req.headers.id.
export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getProfile(req.headers.id as string);
  sendResponse(res, { statusCode: httpStatus.OK, status: true, message: "User profile found", data: result });
});
