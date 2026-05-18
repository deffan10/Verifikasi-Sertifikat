import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { logActivity } from "@/lib/activity-logger";

export async function GET() {
  try {
    const types = await prisma.documentType.findMany({
      include: { fields: { orderBy: { sortOrder: "asc" } }, _count: { select: { documents: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(types);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch document types" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, prefix, fields } = body;

    if (!name || !prefix) {
      return NextResponse.json({ error: "Name and prefix are required" }, { status: 400 });
    }

    const slug = slugify(name);

    const existing = await prisma.documentType.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Document type already exists" }, { status: 409 });
    }

    const docType = await prisma.documentType.create({
      data: {
        name,
        slug,
        prefix,
        fields: fields?.length
          ? {
              create: fields.map((f: { fieldName: string; fieldLabel: string; fieldType?: string; isRequired?: boolean }, i: number) => ({
                fieldName: f.fieldName,
                fieldLabel: f.fieldLabel,
                fieldType: f.fieldType || "text",
                isRequired: f.isRequired !== false,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: { fields: true },
    });

    await logActivity(
      parseInt((session.user as { id?: string }).id || "0"),
      "CREATE_DOCUMENT_TYPE",
      `Created document type: ${name}`
    );

    return NextResponse.json(docType, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create document type" }, { status: 500 });
  }
}
