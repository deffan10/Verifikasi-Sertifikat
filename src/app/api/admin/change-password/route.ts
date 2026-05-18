import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both passwords are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    }

    const adminId = parseInt((session.user as { id?: string }).id || "0");
    const admin = await prisma.admin.findUnique({ where: { id: adminId } });

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Password lama salah" }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.admin.update({
      where: { id: adminId },
      data: { passwordHash: newHash },
    });

    return NextResponse.json({ success: true, message: "Password berhasil diubah" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
