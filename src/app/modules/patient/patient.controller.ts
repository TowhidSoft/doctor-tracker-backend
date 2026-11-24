import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { objectId } from "../../../helpers/query";
import { PatientService } from "./patient.service";
import { PatientValidation } from "./patient.validation";

export const listPatients = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await PatientService.list(PatientValidation.listQuery.parse(req.query));
  sendResponse(res, { statusCode: httpStatus.OK, status: true, message: "Patients retrieved successfully", meta, data });
});

export const patientFilterOptions = catchAsync(async (_req: Request, res: Response) => {
  const data = await PatientService.filterOptions();
  sendResponse(res, { statusCode: httpStatus.OK, status: true, message: "Filter options retrieved successfully", data });
});

export const updatePatient = catchAsync(async (req: Request, res: Response) => {
  const data = await PatientService.update(objectId.parse(req.params.id), PatientValidation.updatePatient.parse(req.body));
  sendResponse(res, { statusCode: httpStatus.OK, status: true, message: "Patient updated successfully", data });
});

export const deletePatient = catchAsync(async (req: Request, res: Response) => {
  const data = await PatientService.remove(objectId.parse(req.params.id));
  sendResponse(res, { statusCode: httpStatus.OK, status: true, message: "Patient deleted successfully", data });
});
