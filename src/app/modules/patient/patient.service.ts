import { Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { z } from "zod";
import prisma from "../../../config/db.prisma";
import ApiError from "../../../errors/apiError";
import { buildMeta, createdAtRange } from "../../../helpers/query";
import { assertDoctorExists } from "../doctor/doctor.service";
import { PatientListQuery, PatientValidation } from "./patient.validation";

type PatientInput = z.infer<typeof PatientValidation.createPatient>;
type PatientUpdate = z.infer<typeof PatientValidation.updatePatient>;

const withDoctor = {
  doctor: { select: { id: true, name: true, specialization: true } },
} satisfies Prisma.PatientInclude;

/** Shared by GET /patients and GET /doctors/:id/patients (which pins `doctorId`). */
const list = async (query: PatientListQuery, pinnedDoctorId?: string) => {
  const { page, limit, search, condition, gender, dateFrom, dateTo, sortBy, sortOrder } = query;
  const doctorId = pinnedDoctorId ?? query.doctorId;

  const where: Prisma.PatientWhereInput = {};
  if (doctorId) where.doctorId = doctorId;
  if (condition) where.condition = condition;
  if (gender) where.gender = gender;

  const createdAt = createdAtRange(dateFrom, dateTo);
  if (createdAt) where.createdAt = createdAt;

  if (search) {
    const contains = { contains: search, mode: "insensitive" as const };
    where.OR = [{ name: contains }, { condition: contains }, { phone: contains }, { email: contains }];
  }

  const orderBy: Prisma.PatientOrderByWithRelationInput[] = [{ [sortBy]: sortOrder }, { id: sortOrder }];

  const [total, data] = await Promise.all([
    prisma.patient.count({ where }),
    prisma.patient.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, include: withDoctor }),
  ]);

  return { data, meta: buildMeta(page, limit, total) };
};

const listForDoctor = async (doctorId: string, query: PatientListQuery) => {
  await assertDoctorExists(doctorId);
  return list(query, doctorId);
};

const filterOptions = async () => {
  const [conditions, doctors] = await Promise.all([
    prisma.patient.groupBy({ by: ["condition"], orderBy: { condition: "asc" } }),
    // Capped: this feeds a dropdown, not a table.
    prisma.doctor.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" }, take: 500 }),
  ]);
  return { conditions: conditions.map((c) => c.condition), doctors };
};

const createForDoctor = async (doctorId: string, payload: PatientInput) => {
  await assertDoctorExists(doctorId);
  return prisma.patient.create({ data: { ...payload, doctorId }, include: withDoctor });
};

const update = async (id: string, payload: PatientUpdate) => {
  const existing = await prisma.patient.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
  if (payload.doctorId) await assertDoctorExists(payload.doctorId);
  return prisma.patient.update({ where: { id }, data: payload, include: withDoctor });
};

const remove = async (id: string, doctorId?: string) => {
  // Scoping by doctorId stops /doctors/A/patients/<patient of B> from deleting someone else's patient.
  const { count } = await prisma.patient.deleteMany({ where: { id, ...(doctorId ? { doctorId } : {}) } });
  if (count === 0) throw new ApiError(httpStatus.NOT_FOUND, "Patient not found");
  return { id };
};

export const PatientService = { list, listForDoctor, filterOptions, createForDoctor, update, remove };
