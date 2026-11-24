import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { objectId } from "../../../helpers/query";
import { PatientService } from "../patient/patient.service";
import { PatientValidation } from "../patient/patient.validation";
import { DoctorService } from "./doctor.service";
import { DoctorValidation } from "./doctor.validation";

export const listDoctors = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await DoctorService.list(DoctorValidation.listQuery.parse(req.query));
  sendResponse(res, { statusCode: httpStatus.OK, status: true, message: "Doctors retrieved successfully", meta, data });
});

export const doctorFilterOptions = catchAsync(async (_req: Request, res: Response) => {
  const data = await DoctorService.filterOptions();
  sendResponse(res, { statusCode: httpStatus.OK, status: true, message: "Filter options retrieved successfully", data });
});

export const getDoctor = catchAsync(async (req: Request, res: Response) => {
  const data = await DoctorService.getById(objectId.parse(req.params.id));
  sendResponse(res, { statusCode: httpStatus.OK, status: true, message: "Doctor retrieved successfully", data });
});

export const createDoctor = catchAsync(async (req: Request, res: Response) => {
  const data = await DoctorService.create(DoctorValidation.createDoctor.parse(req.body));
  sendResponse(res, { statusCode: httpStatus.CREATED, status: true, message: "Doctor created successfully", data });
});

export const updateDoctor = catchAsync(async (req: Request, res: Response) => {
  const data = await DoctorService.update(objectId.parse(req.params.id), DoctorValidation.updateDoctor.parse(req.body));
  sendResponse(res, { statusCode: httpStatus.OK, status: true, message: "Doctor updated successfully", data });
});

export const listDoctorPatients = catchAsync(async (req: Request, res: Response) => {
  const doctorId = objectId.parse(req.params.id);
  const { data, meta } = await PatientService.listForDoctor(doctorId, PatientValidation.listQuery.parse(req.query));
  sendResponse(res, { statusCode: httpStatus.OK, status: true, message: "Patients retrieved successfully", meta, data });
});

export const addDoctorPatient = catchAsync(async (req: Request, res: Response) => {
  const doctorId = objectId.parse(req.params.id);
  const data = await PatientService.createForDoctor(doctorId, PatientValidation.createPatient.parse(req.body));
  sendResponse(res, { statusCode: httpStatus.CREATED, status: true, message: "Patient added successfully", data });
});

export const deleteDoctorPatient = catchAsync(async (req: Request, res: Response) => {
  const data = await PatientService.remove(objectId.parse(req.params.patientId), objectId.parse(req.params.id));
  sendResponse(res, { statusCode: httpStatus.OK, status: true, message: "Patient deleted successfully", data });
});
