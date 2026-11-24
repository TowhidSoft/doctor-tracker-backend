import dayjs from "dayjs";
import prisma from "../../../config/db.prisma";
import { APP_TIMEZONE } from "../../../helpers/query";

type DailyRow = { _id: string; count: number };

/**
 * Counts documents per calendar day inside the database ($group + $dateToString) instead of
 * pulling every row into Node. Cost is one indexed range scan on createdAt, whatever the table size.
 */
const dailyCounts = async (collection: "patient" | "doctor", from: Date): Promise<Map<string, number>> => {
  const pipeline = [
    { $match: { createdAt: { $gte: { $date: from.toISOString() } } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: APP_TIMEZONE } },
        count: { $sum: 1 },
      },
    },
  ];
  const raw =
    collection === "patient"
      ? await prisma.patient.aggregateRaw({ pipeline })
      : await prisma.doctor.aggregateRaw({ pipeline });

  return new Map((raw as unknown as DailyRow[]).map((row) => [row._id, row.count]));
};

const overview = async (days: number) => {
  // Every day in the window, oldest first, so the chart has no gaps.
  const dayKeys = Array.from({ length: days }, (_, i) =>
    dayjs().tz(APP_TIMEZONE).subtract(days - 1 - i, "day").format("YYYY-MM-DD"),
  );
  const from = dayjs.tz(dayKeys[0], APP_TIMEZONE).startOf("day").toDate();

  const [
    totalDoctors,
    totalPatients,
    newDoctors,
    newPatients,
    perDoctor,
    conditions,
    genders,
    specializations,
    patientDays,
    doctorDays,
    recentPatients,
  ] = await Promise.all([
    prisma.doctor.count(),
    prisma.patient.count(),
    prisma.doctor.count({ where: { createdAt: { gte: from } } }),
    prisma.patient.count({ where: { createdAt: { gte: from } } }),
    prisma.patient.groupBy({
      by: ["doctorId"],
      _count: { _all: true },
      orderBy: { _count: { doctorId: "desc" } },
      take: 10,
    }),
    prisma.patient.groupBy({
      by: ["condition"],
      _count: { _all: true },
      orderBy: { _count: { condition: "desc" } },
      take: 8,
    }),
    prisma.patient.groupBy({ by: ["gender"], _count: { _all: true } }),
    prisma.doctor.groupBy({
      by: ["specialization"],
      _count: { _all: true },
      orderBy: { _count: { specialization: "desc" } },
      take: 8,
    }),
    dailyCounts("patient", from),
    dailyCounts("doctor", from),
    prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { doctor: { select: { id: true, name: true, specialization: true } } },
    }),
  ]);

  const doctorRows = await prisma.doctor.findMany({
    where: { id: { in: perDoctor.map((row) => row.doctorId) } },
    select: { id: true, name: true, specialization: true },
  });
  const doctorById = new Map(doctorRows.map((d) => [d.id, d]));

  return {
    totals: {
      doctors: totalDoctors,
      patients: totalPatients,
      avgPatientsPerDoctor: totalDoctors ? Math.round((totalPatients / totalDoctors) * 10) / 10 : 0,
      newPatients,
      newDoctors,
    },
    patientsPerDoctor: perDoctor.map((row) => ({
      doctorId: row.doctorId,
      name: doctorById.get(row.doctorId)?.name ?? "Unknown",
      specialization: doctorById.get(row.doctorId)?.specialization ?? "",
      count: row._count._all,
    })),
    timeline: dayKeys.map((date) => ({
      date,
      patients: patientDays.get(date) ?? 0,
      doctors: doctorDays.get(date) ?? 0,
    })),
    conditions: conditions.map((c) => ({ name: c.condition, count: c._count._all })),
    gender: genders.map((g) => ({ name: g.gender, count: g._count._all })),
    specializations: specializations.map((s) => ({ name: s.specialization, count: s._count._all })),
    recentPatients,
  };
};

export const AnalyticsService = { overview };
