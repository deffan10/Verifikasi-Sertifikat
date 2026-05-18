import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

function generateVerificationToken(prefix: string): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  const seq = String(Date.now()).slice(-4);
  return `${prefix}-${year}-${seq}${random}`;
}

async function main() {
  console.log("=== Importing WP LTC Certificate Data ===\n");

  // Read CSV file
  const csvPath = path.join(__dirname, "..", "wpltc.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.trim().split("\n");

  // Parse header
  const header = lines[0].split(";");
  console.log("CSV Columns:", header);
  console.log(`Total rows: ${lines.length - 1}\n`);

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
            {
              fieldName: "nama_peserta",
              fieldLabel: "Nama Peserta",
              fieldType: "text",
              isRequired: true,
              sortOrder: 0,
            },
            {
              fieldName: "jenis_ujian",
              fieldLabel: "Jenis Ujian",
              fieldType: "text",
              isRequired: true,
              sortOrder: 1,
            },
            {
              fieldName: "nilai",
              fieldLabel: "Nilai",
              fieldType: "number",
              isRequired: true,
              sortOrder: 2,
            },
            {
              fieldName: "tanggal_sertifikat",
              fieldLabel: "Tanggal Sertifikat",
              fieldType: "text",
              isRequired: true,
              sortOrder: 3,
            },
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

  // Process in batches of 100
  const dataLines = lines.slice(1); // skip header
  const batchSize = 100;

  for (let batchStart = 0; batchStart < dataLines.length; batchStart += batchSize) {
    const batch = dataLines.slice(batchStart, batchStart + batchSize);

    for (const line of batch) {
      if (!line.trim()) continue;

      const cols = line.split(";");
      if (cols.length < 5) {
        failed++;
        errors.push(`Invalid row: ${line.substring(0, 50)}...`);
        continue;
      }

      const nomorSertifikat = cols[0].trim();
      const namaPeserta = cols[1].trim();
      const jenisUjian = cols[2].trim();
      const nilai = cols[3].trim();
      const tanggalSertifikat = cols[4].trim();

      if (!nomorSertifikat || !namaPeserta) {
        failed++;
        continue;
      }

      try {
        // Check if already exists
        const existing = await prisma.document.findUnique({
          where: { documentNumber: nomorSertifikat },
        });

        if (existing) {
          duplicates++;
          continue;
        }

        // Generate verification token (use the nomor sertifikat with slashes replaced by dashes for URL safety)
        const verificationToken = nomorSertifikat.replace(/\//g, "-");

        // Create document with values
        await prisma.document.create({
          data: {
            documentTypeId: docType.id,
            documentNumber: nomorSertifikat,
            verificationToken,
            qrCode: null, // Will generate QR on-demand or via separate script
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
    }

    // Progress
    const processed = Math.min(batchStart + batchSize, dataLines.length);
    process.stdout.write(
      `\rProgress: ${processed}/${dataLines.length} (${success} success, ${duplicates} duplicates, ${failed} failed)`
    );
  }

  console.log("\n\n=== Import Complete ===");
  console.log(`Total processed: ${dataLines.length}`);
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
        details: `Imported WP LTC data: ${success} success, ${duplicates} duplicates, ${failed} failed from ${dataLines.length} rows`,
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
