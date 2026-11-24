import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import httpStatus from "http-status";
import { z, ZodError } from "zod";
import ApiError from "../errors/apiError";

dayjs.extend(utc);
dayjs.extend(timezone);

/** IANA timezone used to decide where a "day" starts/ends for filters and dashboard buckets. */
export const APP_TIMEZONE = process.env.APP_TIMEZONE || "UTC";

/* ─────────────── shared zod pieces ─────────────── */

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

/** page / limit / search / date range / sort direction shared by every paginated list. */
export const listQueryBase = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(100).optional(),
  dateFrom: day.optional(),
  dateTo: day.optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/* ─────────────── helpers ─────────────── */

export const buildMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

/**
 * createdAt filter for an inclusive YYYY-MM-DD range, evaluated in APP_TIMEZONE
 * (so "today" in Dhaka does not slip into yesterday's UTC bucket).
 */
export function createdAtRange(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  if (from && to && from > to) {
    throw new ApiError(httpStatus.BAD_REQUEST, "dateFrom must be on or before dateTo");
  }
  const range: Prisma.DateTimeFilter = {};
  if (from) range.gte = dayjs.tz(from, APP_TIMEZONE).startOf("day").toDate();
  if (to) range.lte = dayjs.tz(to, APP_TIMEZONE).endOf("day").toDate();
  return range;
}

/**
 * A validation error attached to one form field. It flows through the global error handler,
 * so the client gets `errors: [{ path: "email", message }]` and can highlight that input.
 */
export const fieldError = (path: string, message: string) =>
  new ZodError([{ code: "custom", path: [path], message, input: undefined } as never]);
