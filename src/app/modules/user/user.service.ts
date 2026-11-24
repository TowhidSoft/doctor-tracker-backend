import httpStatus from "http-status";
import prisma from "../../../config/db.prisma";
import ApiError from "../../../errors/apiError";

const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
  });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "User account not found");
  return user;
};

export const UserService = { getProfile };
