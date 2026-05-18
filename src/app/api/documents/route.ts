import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/utils";
import { generateQRCode, getVerificationUrl } from "@/lib/qr";
import { logActivity } from "@/lib/activity-logger";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const typeId = searchParams.get("typeId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (typeId) where.documentTypeId = parseInt(typeId);
    if (search) {
      where.OR = [
        { documentNumber: { contains: search } },
        { values: { some: { value: { contains: search } } } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: {
          documentType: true,
          values: { include: { field: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { documentTypeId, documentNumber, values } = body;

    if (!documentTypeId || !documentNumber) {
      return NextResponse.json({ error: "Document type and number are required" }, { status: 400 });
    }

    // Check for duplicate document number
    const existing = await prisma.document.findUnique({
      where: { documentNumber },
    });
    if (existing) {
      return NextResponse.json({ error: "Document number already exists" }, { status: 409 });
    }

    // Get document type for prefix
    const docType = await prisma.documentType.findUnique({
      where: { id: documentTypeId },
      include: { fields: true },
    });
    if (!docType) {
      return NextResponse.json({ error: "Document type not found" }, { status: 404 });
    }

    // Validate required fields
    const requiredFields = docType.fields.filter((f: { isRequired: boolean }) => f.isRequired);
    for (const field of requiredFields) {
      const value = values?.find((v: { fieldId: number }) => v.fieldId === field.id);
      if (!value || !value.value) {
        return NextResponse.json(
          { error: `Field "${field.fieldLabel}" is required` },
          { status: 400 }
        );
      }
    }

    // Generate verification token and QR
    const verificationToken = generateVerificationToken(docType.prefix);
    const verificationUrl = getVerificationUrl(verificationToken);
    const qrCode = await generateQRCode(verificationUrl);

    const document = await prisma.document.create({
      data: {
        documentTypeId,
        documentNumber,
        verificationToken,
        qrCode,
        values: values?.length
          ? {
              create: values.map((v: { fieldId: number; value: string }) => ({
                fieldId: v.fieldId,
                value: v.value || "",
              })),
            }
          : undefined,
      },
      include: {
        documentType: true,
        values: { include: { field: true } },
      },
    });

    await logActivity(
      parseInt((session.user as { id?: string }).id || "0"),
      "CREATE_DOCUMENT",
      `Created document: ${documentNumber}`
    );

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}
