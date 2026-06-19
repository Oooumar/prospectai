import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        prospect: { select: { name: true, niche: true, city: true } },
        campaign: { select: { name: true } },
      },
    }),
    prisma.emailLog.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ logs, total, page, limit });
}
