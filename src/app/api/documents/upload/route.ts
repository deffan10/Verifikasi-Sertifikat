import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateVerificationToken } from "@/lib/utils";
import { generateQRCode, getVerificationUrl } from "@/lib/qr";
import { logActivity } from "@/lib/activity-logger";
import * as XLSX from "xlsx";

interface UploadRow {
  [key: string]: string | number | undefined;
}

/**
 * Convert Excel date serial number to "DD MMMM YYYY" Indonesian format.
 * If the value is already a string, return as-is.
 * Excel serial: 1 = Jan 1 1900, 45881 = Aug 12 2025
 */
function convertCellValue(raw: string | number | undefined): string {
  if (raw === undefined || raw === null) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "number") {
    // Excel date serials are typically between 1 and 2958465 (year 9999)
    // Common range for modern dates: 36526 (2000) to 73050 (2100)
    if (raw >= 36526 && raw <= 73050) {
      // This is very likely an Excel date serial
      const utcDays = Math.floor(raw - 25569);
      const date = new Date(utcDays * 86400 * 1000);
      const year = date.getUTCFullYear();
      if (year >= 2000 && year <= 2100) {
        const months = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember"
        ];
        return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${year}`;
      }
    }
    // Regular number (like score/nilai), return as string
    return String(raw);
  }
  return String(raw).trim();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentTypeId = parseInt(formData.get("documentTypeId") as string);
    const columnMapping = JSON.parse(formData.get("columnMapping") as string || "{}");

    if (!file || !documentTypeId) {
      return NextResponse.json(
        { error: "File and document type are required" },
        { status: 400 }
      );
    }

    // Get document type and fields
    const docType = await prisma.documentType.findUnique({
      where: { id: documentTypeId },
      include: { fields: { orderBy: { sortOrder: "asc" } } },
    });

    if (!docType) {
      return NextResponse.json({ error: "Document type not found" }, { status: 404 });
    }

    // Parse file - use raw:true to get serial numbers for dates
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: UploadRow[] = XLSX.utils.sheet_to_json(sheet, { raw: true });

    if (rows.length === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    const results = {
      total: rows.length,
      success: 0,
      failed: 0,
      errors: [] as { row: number; reason: string }[],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Get document number from mapping
        const docNumberCol = columnMapping["documentNumber"];
        const documentNumber = convertCellValue(row[docNumberCol]);

        if (!documentNumber) {
          results.failed++;
          results.errors.push({ row: i + 2, reason: "Document number is empty" });
          continue;
        }

        // Check duplicate
        const existing = await prisma.document.findUnique({
          where: { documentNumber },
        });
        if (existing) {
          results.failed++;
          results.errors.push({ row: i + 2, reason: `Duplicate document number: ${documentNumber}` });
          continue;
        }

        // Validate required fields
        const requiredFields = docType.fields.filter((f: { isRequired: boolean }) => f.isRequired);
        let hasError = false;
        for (const field of requiredFields) {
          const col = columnMapping[field.fieldName];
          const value = col ? convertCellValue(row[col]) : "";
          if (!value) {
            results.failed++;
            results.errors.push({ row: i + 2, reason: `Required field "${field.fieldLabel}" is empty` });
            hasError = true;
            break;
          }
        }
        if (hasError) continue;

        // Generate token and QR
        const verificationToken = generateVerificationToken(docType.prefix);
        const verificationUrl = getVerificationUrl(verificationToken);
        const qrCode = await generateQRCode(verificationUrl);

        // Create document with values - convert date serials automatically
        const values = docType.fields
          .map((field: { id: number; fieldName: string }) => {
            const col = columnMapping[field.fieldName];
            const value = col ? convertCellValue(row[col]) : "";
            return { fieldId: field.id, value };
          })
          .filter((v: { fieldId: number; value: string }) => v.value);

        await prisma.document.create({
          data: {
            documentTypeId,
            documentNumber,
            verificationToken,
            qrCode,
            values: {
              create: values,
            },
          },
        });

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({ row: i + 2, reason: "Unexpected error" });
      }
    }

    await logActivity(
      parseInt((session.user as { id?: string }).id || "0"),
      "BULK_UPLOAD",
      `Bulk upload: ${results.success} success, ${results.failed} failed out of ${results.total} rows`
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process upload" }, { status: 500 });
  }
}
