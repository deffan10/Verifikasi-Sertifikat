import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - public (for contact_url) or admin (for all)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      const setting = await prisma.setting.findUnique({ where: { key } });
      return NextResponse.json({ key, value: setting?.value || "" });
    }

    // Return all settings (admin only)
    const session = await getServerSession(authOptions);
    if (!session) {
      // Public: only return contact_url
      const contactUrl = await prisma.setting.findUnique({ where: { key: "contact_url" } });
      return NextResponse.json({ contact_url: contactUrl?.value || "" });
    }

    const settings = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PUT - admin only
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    await prisma.setting.upsert({
      where: { key },
      update: { value: value || "" },
      create: { key, value: value || "" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
