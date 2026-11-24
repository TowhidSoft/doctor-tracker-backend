import { z } from "zod";
import { listQueryBase } from "../../../helpers/query";

// Keep in sync with the frontend (src/lib/validation.ts) so form and API accept the same input.
export const PHONE_PATTERN = /^[0-9+\-()\s]{7,20}$/;
export const PHONE_MESSAGE = "Use 7–20 digits; + - ( ) and spaces are allowed";

export const requiredText = (label: string, max = 100) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

export const phone = z.string({ error: "Phone is required" }).trim().regex(PHONE_PATTERN, PHONE_MESSAGE);

const createDoctor = z.object({
  name: requiredText("Name"),
  specialization: requiredText("Specialization", 80),
  hospital: requiredText("Hospital", 120),
  phone,
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Enter a valid email address"),
});

const updateDoctor = createDoctor.partial().refine((v) => Object.keys(v).length > 0, {
  message: "Send at least one field to update",
});

const listQuery = listQueryBase.extend({
  specialization: z.string().trim().max(120).optional(),
  hospital: z.string().trim().max(120).optional(),
  sortBy: z.enum(["createdAt", "name", "specialization", "hospital"]).default("createdAt"),
});

export const DoctorValidation = { createDoctor, updateDoctor, listQuery };
