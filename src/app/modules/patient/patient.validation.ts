import { z } from "zod";
import { listQueryBase, objectId } from "../../../helpers/query";
import { phone, requiredText } from "../doctor/doctor.validation";

const GENDERS = ["Male", "Female", "Others"] as const;

/** "" from a cleared form field becomes null. */
const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

const optionalEmail = z.preprocess(
  emptyToNull,
  z.string().trim().toLowerCase().email("Enter a valid email address").nullable().optional(),
);

const optionalNotes = z.preprocess(
  emptyToNull,
  z.string().trim().max(500, "Notes must be at most 500 characters").nullable().optional(),
);

const createPatient = z.object({
  name: requiredText("Name"),
  age: z
    .number({ error: "Age is required" })
    .int("Age must be a whole number")
    .min(0, "Age cannot be negative")
    .max(120, "Age must be 120 or less"),
  gender: z.enum(GENDERS, { error: "Choose a gender" }),
  phone,
  email: optionalEmail,
  condition: requiredText("Condition", 120),
  notes: optionalNotes,
});

/** Editing may also move the patient to another doctor. */
const updatePatient = createPatient
  .partial()
  .extend({ doctorId: objectId.optional() })
  .refine((v) => Object.keys(v).length > 0, { message: "Send at least one field to update" });

const listQuery = listQueryBase.extend({
  condition: z.string().trim().max(120).optional(),
  gender: z.enum(GENDERS).optional(),
  doctorId: objectId.optional(),
  sortBy: z.enum(["createdAt", "name", "age", "condition"]).default("createdAt"),
});

export type PatientListQuery = z.infer<typeof listQuery>;

export const PatientValidation = { createPatient, updatePatient, listQuery };
