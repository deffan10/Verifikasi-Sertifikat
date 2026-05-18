import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("logo") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "File harus berupa gambar (PNG, JPG, SVG, WEBP)" }, { status: 400 });
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 });
    }

    // Save file
    const ext = file.name.split(".").pop() || "png";
    const filename = `logo.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Remove old logo files
    const existingFiles = fs.readdirSync(uploadDir).filter(f => f.startsWith("logo."));
    for (const f of existingFiles) {
      fs.unlinkSync(path.join(uploadDir, f));
    }

    // Write new file
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(uploadDir, filename), buffer);

    // Update setting
    const logoUrl = `/uploads/${filename}`;
    await prisma.setting.upsert({
      where: { key: "logo_url" },
      update: { value: logoUrl },
      create: { key: "logo_url", value: logoUrl },
    });

    return NextResponse.json({ success: true, url: logoUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to upload logo" }, { status: 500 });
  }
}
