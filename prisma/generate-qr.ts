import { PrismaClient } from "@prisma/client";
import QRCode from "qrcode";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function generateQR(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: "#000000", light: "#FFFFFF" },
    errorCorrectionLevel: "M",
  });
}

async function main() {
  console.log("=== Generating QR Codes for documents without QR ===\n");
  console.log(`App URL: ${APP_URL}\n`);

  const documents = await prisma.document.findMany({
    where: { qrCode: null },
    select: { id: true, verificationToken: true },
  });

  console.log(`Found ${documents.length} documents without QR code.\n`);

  if (documents.length === 0) {
    console.log("Nothing to do. All documents have QR codes.");
    return;
  }

  let success = 0;
  let failed = 0;
  const batchSize = 50;

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);

    await Promise.all(
      batch.map(async (doc) => {
        try {
          const verificationUrl = `${APP_URL}/verify/${doc.verificationToken}`;
          const qrCode = await generateQR(verificationUrl);

          await prisma.document.update({
            where: { id: doc.id },
            data: { qrCode },
          });

          success++;
        } catch (error) {
          failed++;
        }
      })
    );

    process.stdout.write(
      `\rProgress: ${Math.min(i + batchSize, documents.length)}/${documents.length} (${success} success, ${failed} failed)`
    );
  }

  console.log("\n\n=== QR Generation Complete ===");
  console.log(`Success: ${success}`);
  console.log(`Failed: ${failed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
