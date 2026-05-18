import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const document = await prisma.document.findUnique({
      where: { id: parseInt(id) },
      include: {
        documentType: { include: { fields: { orderBy: { sortOrder: "asc" } } } },
        values: { include: { field: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(document);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch document" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { documentNumber, isActive, values } = body;

    const document = await prisma.document.update({
      where: { id: parseInt(id) },
      data: {
        ...(documentNumber && { documentNumber }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    if (values && Array.isArray(values)) {
      for (const v of values) {
        await prisma.documentValue.upsert({
          where: {
            documentId_fieldId: {
              documentId: parseInt(id),
              fieldId: v.fieldId,
            },
          },
          update: { value: v.value },
          create: {
            documentId: parseInt(id),
            fieldId: v.fieldId,
            value: v.value,
          },
        });
      }
    }

    const updated = await prisma.document.findUnique({
      where: { id: parseInt(id) },
      include: {
        documentType: true,
        values: { include: { field: true } },
      },
    });

    await logActivity(
      parseInt((session.user as { id?: string }).id || "0"),
      "UPDATE_DOCUMENT",
      `Updated document: ${document.documentNumber}`
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const document = await prisma.document.delete({
      where: { id: parseInt(id) },
    });

    await logActivity(
      parseInt((session.user as { id?: string }).id || "0"),
      "DELETE_DOCUMENT",
      `Deleted document: ${document.documentNumber}`
    );

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
