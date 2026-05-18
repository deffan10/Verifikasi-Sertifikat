import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const typeId = searchParams.get("typeId");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const where: Record<string, unknown> = {};
    if (typeId) where.documentTypeId = parseInt(typeId);

    const documents = await prisma.document.findMany({
      where,
      include: {
        documentType: true,
        values: { include: { field: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to flat rows with QR verification URL
    const rows = documents.map((doc: { documentNumber: string; documentType: { name: string }; verificationToken: string; isActive: boolean; createdAt: Date; values: { field: { fieldLabel: string }; value: string }[] }) => {
      const row: Record<string, string> = {
        "Nomor Dokumen": doc.documentNumber,
        "Jenis Dokumen": doc.documentType.name,
        "Token Verifikasi": doc.verificationToken,
        "URL Verifikasi (QR)": `${appUrl}/verify/${doc.verificationToken}`,
        "Status": doc.isActive ? "Aktif" : "Nonaktif",
        "Tanggal Dibuat": doc.createdAt.toISOString().split("T")[0],
      };
      for (const val of doc.values) {
        row[val.field.fieldLabel] = val.value;
      }
      return row;
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    worksheet["!cols"] = [
      { wch: 30 }, // Nomor Dokumen
      { wch: 18 }, // Jenis Dokumen
      { wch: 30 }, // Token
      { wch: 50 }, // URL Verifikasi
      { wch: 10 }, // Status
      { wch: 12 }, // Tanggal
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Documents");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="documents-export-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}
