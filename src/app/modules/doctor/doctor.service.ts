import { Prisma } from "@prisma/client";
import httpStatus from "http-status";
import { z } from "zod";
import prisma from "../../../config/db.prisma";
import ApiError from "../../../errors/apiError";
import { buildMeta, createdAtRange, fieldError } from "../../../helpers/query";
import { DoctorValidation } from "./doctor.validation";

type DoctorListQuery = z.infer<typeof DoctorValidation.listQuery>;
type DoctorInput = z.infer<typeof DoctorValidation.createDoctor>;

/** One round trip returns each doctor together with the number of patients. */
const withPatientCount = { _count: { select: { patients: true } } } satisfies Prisma.DoctorInclude;

const shape = <T extends { _count: { patients: number } }>({ _count, ...doctor }: T) => ({
  ...doctor,
  patientCount: _count.patients,
});

export const assertDoctorExists = async (id: string) => {
  const doctor = await prisma.doctor.findUnique({ where: { id }, select: { id: true } });
  if (!doctor) throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found");
};

const assertEmailFree = async (email: string, exceptId?: string) => {
  const clash = await prisma.doctor.findFirst({
    where: { email, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  if (clash) throw fieldError("email", "A doctor with this email already exists");
};

const list = async (query: DoctorListQuery) => {
  const { page, limit, search, specialization, hospital, dateFrom, dateTo, sortBy, sortOrder } = query;

  const where: Prisma.DoctorWhereInput = {};
  if (specialization) where.specialization = specialization;
  if (hospital) where.hospital = hospital;

  const createdAt = createdAtRange(dateFrom, dateTo);
  if (createdAt) where.createdAt = createdAt;

  if (search) {
    const contains = { contains: search, mode: "insensitive" as const };
    where.OR = [{ name: contains }, { hospital: contains }, { specialization: contains }, { phone: contains }, { email: contains }];
  }

  // `id` as a tiebreaker keeps pagination stable when many rows share the same sort value.
  const orderBy: Prisma.DoctorOrderByWithRelationInput[] = [{ [sortBy]: sortOrder }, { id: sortOrder }];

  const [total, rows] = await Promise.all([
    prisma.doctor.count({ where }),
    prisma.doctor.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, include: withPatientCount }),
  ]);

  return { data: rows.map(shape), meta: buildMeta(page, limit, total) };
};

const filterOptions = async () => {
  // groupBy returns the distinct values straight from the index-friendly collection scan.
  const [specializations, hospitals] = await Promise.all([
    prisma.doctor.groupBy({ by: ["specialization"], orderBy: { specialization: "asc" } }),
    prisma.doctor.groupBy({ by: ["hospital"], orderBy: { hospital: "asc" } }),
  ]);
  return {
    specializations: specializations.map((s) => s.specialization),
    hospitals: hospitals.map((h) => h.hospital),
  };
};

const getById = async (id: string) => {
  const doctor = await prisma.doctor.findUnique({ where: { id }, include: withPatientCount });
  if (!doctor) throw new ApiError(httpStatus.NOT_FOUND, "Doctor not found");
  return shape(doctor);
};

const create = async (payload: DoctorInput) => {
  await assertEmailFree(payload.email);
  const doctor = await prisma.doctor.create({ data: payload, include: withPatientCount });
  return shape(doctor);
};

const update = async (id: string, payload: Partial<DoctorInput>) => {
  await assertDoctorExists(id);
  if (payload.email) await assertEmailFree(payload.email, id);
  const doctor = await prisma.doctor.update({ where: { id }, data: payload, include: withPatientCount });
  return shape(doctor);
};

export const DoctorService = { list, filterOptions, getById, create, update };
