import httpStatus from "http-status";
import prisma from "../../../config/db.prisma";
import ApiError from "../../../errors/apiError";
import { comparePassword } from "../../../helpers/passwordCompare";
import { GenerateTokens } from "../../../helpers/utility/tokenHelper";

const login = async (payload: { email: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true, name: true, email: true, password: true, role: true, isDeleted: true },
  });

  // One message for "no such user" and "wrong password" so the form does not reveal which emails exist.
  const valid = user && !user.isDeleted && (await comparePassword(payload.password, user.password));
  if (!user || !valid) throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect email or password");

  const { accessToken, refreshToken } = GenerateTokens(user.id, user.email, user.role);

  return { id: user.id, name: user.name, email: user.email, role: user.role, accessToken, refreshToken };
};

export const AuthServices = { login };
