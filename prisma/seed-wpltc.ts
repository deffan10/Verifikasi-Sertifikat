import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

/**
 * Convert Excel serial number to formatted date string "DD MMMM YYYY" (Indonesian)
 */
function excelDateToString(serial: number): string {
  if (!serial || serial <= 1) return "-";
  // Excel date serial: days since 1899-12-30
  const utcDays = Math.floor(serial - 25569);
  const date = new Date(utcDays * 86400 * 1000);
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  // If year is 1970 (serial ~25569), it's likely empty/invalid
  if (year <= 1970) return "-";
  return `${day} ${month} ${year}`;
}

async function main() {
  console.log("=== Importing WP LTC Certificate Data (from XLSX) ===\n");

  // Read XLSX file
  const xlsxPath = path.join(__dirname, "..", "wpltc.xlsx");
  if (!fs.existsSync(xlsxPath)) {
    console.error("ERROR: wpltc.xlsx not found! Make sure the file is in the project root.");
    process.exit(1);
  }

  const workbook = XLSX.readFile(xlsxPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // Read raw values (dates as serial numbers)
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true }) as unknown[][];

  const header = rows[0] as string[];
  console.log("XLSX Columns:", header);
  console.log(`Total rows: ${rows.length - 1}\n`);

  // Create/Get document type "Sertifikat LTC"
  let docType = await prisma.documentType.findUnique({
    where: { slug: "sertifikat-ltc" },
    include: { fields: true },
  });

  if (!docType) {
    docType = await prisma.documentType.create({
      data: {
        name: "Sertifikat LTC",
        slug: "sertifikat-ltc",
        prefix: "LTC",
        fields: {
          create: [
            { fieldName: "nama_peserta", fieldLabel: "Nama Peserta", fieldType: "text", isRequired: true, sortOrder: 0 },
            { fieldName: "jenis_ujian", fieldLabel: "Jenis Ujian", fieldType: "text", isRequired: true, sortOrder: 1 },
            { fieldName: "nilai", fieldLabel: "Nilai", fieldType: "number", isRequired: true, sortOrder: 2 },
            { fieldName: "tanggal_sertifikat", fieldLabel: "Tanggal Sertifikat", fieldType: "text", isRequired: true, sortOrder: 3 },
          ],
        },
      },
      include: { fields: true },
    });
    console.log("Created document type: Sertifikat LTC");
  } else {
    console.log("Document type 'Sertifikat LTC' already exists, using existing.");
  }

  // Get field IDs
  const fieldMap: Record<string, number> = {};
  for (const field of docType.fields) {
    fieldMap[field.fieldName] = field.id;
  }
  console.log("Field mapping:", fieldMap);
  console.log("\nStarting import...\n");

  let success = 0;
  let failed = 0;
  let duplicates = 0;
  const errors: string[] = [];

  const dataRows = rows.slice(1); // skip header

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i] as (string | number | undefined)[];
    if (!row || row.length < 5) {
      failed++;
      continue;
    }

    const nomorSertifikat = String(row[0] || "").trim();
    const namaPeserta = String(row[1] || "").trim();
    const jenisUjian = String(row[2] || "").trim();
    const nilai = String(row[3] || "").trim();
    const tanggalRaw = row[4];

    // Convert date: if number (Excel serial), convert properly
    let tanggalSertifikat: string;
    if (typeof tanggalRaw === "number") {
      tanggalSertifikat = excelDateToString(tanggalRaw);
    } else {
      tanggalSertifikat = String(tanggalRaw || "-").trim();
    }

    if (!nomorSertifikat || !namaPeserta) {
      failed++;
      continue;
    }

    try {
      const existing = await prisma.document.findUnique({
        where: { documentNumber: nomorSertifikat },
      });

      if (existing) {
        duplicates++;
        continue;
      }

      // Verification token: replace slashes with dashes for URL safety
      const verificationToken = nomorSertifikat.replace(/\//g, "-");

      await prisma.document.create({
        data: {
          documentTypeId: docType.id,
          documentNumber: nomorSertifikat,
          verificationToken,
          qrCode: null,
          isActive: true,
          values: {
            create: [
              { fieldId: fieldMap["nama_peserta"], value: namaPeserta },
              { fieldId: fieldMap["jenis_ujian"], value: jenisUjian },
              { fieldId: fieldMap["nilai"], value: nilai },
              { fieldId: fieldMap["tanggal_sertifikat"], value: tanggalSertifikat },
            ],
          },
        },
      });

      success++;
    } catch (error: unknown) {
      failed++;
      const msg = error instanceof Error ? error.message : "Unknown error";
      if (errors.length < 20) {
        errors.push(`${nomorSertifikat}: ${msg}`);
      }
    }

    // Progress every 500 rows
    if ((i + 1) % 500 === 0 || i === dataRows.length - 1) {
      process.stdout.write(
        `\rProgress: ${i + 1}/${dataRows.length} (${success} success, ${duplicates} dup, ${failed} failed)`
      );
    }
  }

  console.log("\n\n=== Import Complete ===");
  console.log(`Total processed: ${dataRows.length}`);
  console.log(`Success: ${success}`);
  console.log(`Duplicates skipped: ${duplicates}`);
  console.log(`Failed: ${failed}`);

  if (errors.length > 0) {
    console.log(`\nSample errors (max 20):`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  // Log activity
  const admin = await prisma.admin.findFirst();
  if (admin) {
    await prisma.activityLog.create({
      data: {
        adminId: admin.id,
        action: "DATA_MIGRATION",
        details: `Imported WP LTC XLSX: ${success} success, ${duplicates} duplicates, ${failed} failed from ${dataRows.length} rows`,
      },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
