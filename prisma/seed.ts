import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
  console.log("Seeding database...");

  // Create default admin
  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.admin.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@example.com",
      passwordHash,
      role: "superadmin",
    },
  });
  console.log(`Admin created: ${admin.username}`);

  // Create document types with fields
  const sertifikat = await prisma.documentType.upsert({
    where: { slug: "sertifikat" },
    update: {},
    create: {
      name: "Sertifikat",
      slug: "sertifikat",
      prefix: "SERT",
      fields: {
        create: [
          { fieldName: "nama", fieldLabel: "Nama", fieldType: "text", isRequired: true, sortOrder: 0 },
          { fieldName: "tanggal_sertifikat", fieldLabel: "Tanggal Sertifikat", fieldType: "date", isRequired: true, sortOrder: 1 },
          { fieldName: "nomor_sertifikat", fieldLabel: "Nomor Sertifikat", fieldType: "text", isRequired: true, sortOrder: 2 },
        ],
      },
    },
  });
  console.log(`Document type created: ${sertifikat.name}`);

  const sertifikatLtc = await prisma.documentType.upsert({
    where: { slug: "sertifikat-ltc" },
    update: {},
    create: {
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
  });
  console.log(`Document type created: ${sertifikatLtc.name}`);

  const ijazah = await prisma.documentType.upsert({
    where: { slug: "ijazah" },
    update: {},
    create: {
      name: "Ijazah",
      slug: "ijazah",
      prefix: "IJZ",
      fields: {
        create: [
          { fieldName: "nama", fieldLabel: "Nama", fieldType: "text", isRequired: true, sortOrder: 0 },
          { fieldName: "nim", fieldLabel: "NIM", fieldType: "text", isRequired: true, sortOrder: 1 },
          { fieldName: "program_studi", fieldLabel: "Program Studi", fieldType: "text", isRequired: true, sortOrder: 2 },
          { fieldName: "tempat_lahir", fieldLabel: "Tempat Lahir", fieldType: "text", isRequired: true, sortOrder: 3 },
          { fieldName: "tanggal_lahir", fieldLabel: "Tanggal Lahir", fieldType: "date", isRequired: true, sortOrder: 4 },
          { fieldName: "nomor_ijazah", fieldLabel: "Nomor Ijazah", fieldType: "text", isRequired: true, sortOrder: 5 },
        ],
      },
    },
  });
  console.log(`Document type created: ${ijazah.name}`);

  const transkrip = await prisma.documentType.upsert({
    where: { slug: "transkrip" },
    update: {},
    create: {
      name: "Transkrip",
      slug: "transkrip",
      prefix: "TRK",
      fields: {
        create: [
          { fieldName: "nama", fieldLabel: "Nama", fieldType: "text", isRequired: true, sortOrder: 0 },
          { fieldName: "nim", fieldLabel: "NIM", fieldType: "text", isRequired: true, sortOrder: 1 },
          { fieldName: "program_studi", fieldLabel: "Program Studi", fieldType: "text", isRequired: true, sortOrder: 2 },
          { fieldName: "tempat_lahir", fieldLabel: "Tempat Lahir", fieldType: "text", isRequired: true, sortOrder: 3 },
          { fieldName: "tanggal_lahir", fieldLabel: "Tanggal Lahir", fieldType: "date", isRequired: true, sortOrder: 4 },
          { fieldName: "nomor_ijazah", fieldLabel: "Nomor Ijazah", fieldType: "text", isRequired: true, sortOrder: 5 },
        ],
      },
    },
  });
  console.log(`Document type created: ${transkrip.name}`);

  console.log("\nSeeding complete!");
  console.log("Default admin credentials:");
  console.log("  Username: admin");
  console.log("  Password: admin123");
  console.log("\nPlease change the password after first login!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
