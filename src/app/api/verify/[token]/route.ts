import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { token } = await params;

    const document = await prisma.document.findFirst({
      where: {
        OR: [
          { verificationToken: token },
          { documentNumber: token },
        ],
        isActive: true,
      },
      include: {
        documentType: true,
        values: {
          include: { field: true },
          orderBy: { field: { sortOrder: "asc" } },
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { verified: false, message: "Dokumen Tidak Ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      verified: true,
      message: "Dokumen Terverifikasi",
      document: {
        documentNumber: document.documentNumber,
        documentType: document.documentType.name,
        verificationToken: document.verificationToken,
        createdAt: document.createdAt,
        fields: document.values.map((v: { field: { fieldLabel: string; fieldType: string }; value: string }) => ({
          label: v.field.fieldLabel,
          value: v.value,
          type: v.field.fieldType,
        })),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
