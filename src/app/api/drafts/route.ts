import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);

  try {
    if (searchParams.get("count") === "true") {
      const count = await prisma.emailLog.count({
        where: { userId: session.user.id, status: "DRAFT" },
      });
      return NextResponse.json({ count });
    }

    const drafts = await prisma.emailLog.findMany({
      where: { userId: session.user.id, status: "DRAFT" },
      orderBy: { createdAt: "desc" },
      include: {
        prospect: { select: { name: true, email: true, niche: true, city: true, company: true } },
      },
    });

    return NextResponse.json({ drafts });
  } catch {
    return searchParams.get("count") === "true"
      ? NextResponse.json({ count: 0 })
      : NextResponse.json({ drafts: [] });
  }
}
