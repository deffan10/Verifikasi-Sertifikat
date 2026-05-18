import prisma from "./prisma";

export async function logActivity(
  adminId: number | null,
  action: string,
  details?: string,
  ipAddress?: string
) {
  try {
    await prisma.activityLog.create({
      data: {
        adminId,
        action,
        details,
        ipAddress,
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
