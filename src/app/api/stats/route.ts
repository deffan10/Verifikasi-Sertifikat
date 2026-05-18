import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [totalDocuments, totalTypes, recentDocuments, typeStats] = await Promise.all([
      prisma.document.count(),
      prisma.documentType.count(),
      prisma.document.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.documentType.findMany({
        select: {
          name: true,
          _count: { select: { documents: true } },
        },
      }),
    ]);

    return NextResponse.json({
      totalDocuments,
      totalTypes,
      recentDocuments,
      typeStats: typeStats.map((t: { name: string; _count: { documents: number } }) => ({
        name: t.name,
        count: t._count.documents,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
