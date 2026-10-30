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
    const docType = await prisma.documentType.findUnique({
      where: { id: parseInt(id) },
      include: { fields: { orderBy: { sortOrder: "asc" } }, _count: { select: { documents: true } } },
    });

    if (!docType) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(docType);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch document type" }, { status: 500 });
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
    const { name, prefix, programName, isActive, fields } = body;

    const docType = await prisma.documentType.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(prefix && { prefix }),
        ...(programName !== undefined && { programName: programName || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Update fields if provided safely without wiping document values
    if (fields && Array.isArray(fields)) {
      const existingFields = await prisma.documentField.findMany({
        where: { documentTypeId: parseInt(id) },
      });
      const existingById = new Map(existingFields.map((f) => [f.id, f]));
      const existingByName = new Map(existingFields.map((f) => [f.fieldName, f]));

      const inputIds = new Set(fields.filter((f: { id?: number }) => f.id).map((f: { id?: number }) => f.id));
      const inputNames = new Set(fields.map((f: { fieldName: string }) => f.fieldName));

      // Only delete fields that are removed from the input AND have no document values
      for (const ef of existingFields) {
        if (!inputIds.has(ef.id) && !inputNames.has(ef.fieldName)) {
          const count = await prisma.documentValue.count({ where: { fieldId: ef.id } });
          if (count === 0) {
            await prisma.documentField.delete({ where: { id: ef.id } });
          }
        }
      }

      // Upsert/update fields preserving existing IDs
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        const existing = (f.id && existingById.get(f.id)) || existingByName.get(f.fieldName);
        if (existing) {
          await prisma.documentField.update({
            where: { id: existing.id },
            data: {
              ...(f.fieldName && { fieldName: f.fieldName }),
              fieldLabel: f.fieldLabel,
              fieldType: f.fieldType || "text",
              isRequired: f.isRequired !== false,
              sortOrder: i,
            },
          });
        } else {
          await prisma.documentField.create({
            data: {
              documentTypeId: parseInt(id),
              fieldName: f.fieldName,
              fieldLabel: f.fieldLabel,
              fieldType: f.fieldType || "text",
              isRequired: f.isRequired !== false,
              sortOrder: i,
            },
          });
        }
      }
    }

    const updated = await prisma.documentType.findUnique({
      where: { id: parseInt(id) },
      include: { fields: { orderBy: { sortOrder: "asc" } } },
    });

    await logActivity(
      parseInt((session.user as { id?: string }).id || "0"),
      "UPDATE_DOCUMENT_TYPE",
      `Updated document type: ${docType.name}`
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update document type" }, { status: 500 });
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
    const docType = await prisma.documentType.delete({
      where: { id: parseInt(id) },
    });

    await logActivity(
      parseInt((session.user as { id?: string }).id || "0"),
      "DELETE_DOCUMENT_TYPE",
      `Deleted document type: ${docType.name}`
    );

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete document type" }, { status: 500 });
  }
}