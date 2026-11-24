import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import prisma from "../config/db.prisma";

/**
 * Creates the first admin when the users collection has no account with that email.
 * Override with Admin_Email / Admin_Password in .env (change the defaults before deploying!).
 */
export const initiateSuperAdmin = async () => {
  const email = (process.env.Admin_Email || "admin@gmail.com").toLowerCase();
  const password = process.env.Admin_Password || "123456";

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return;

  await prisma.user.create({
    data: {
      name: "Mr. Admin",
      phone: "12345678901",
      email,
      password: await bcrypt.hash(password, 12),
      role: Role.ADMIN,
    },
  });
  console.log(`Admin user created: ${email}`);
};
