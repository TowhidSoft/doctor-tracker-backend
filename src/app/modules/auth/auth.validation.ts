import { z } from "zod";

const loginSchema = z.object({
  email: z.string({ error: "Email is required" }).trim().toLowerCase().email("Enter a valid email address"),
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export const AuthValidation = { loginSchema };
