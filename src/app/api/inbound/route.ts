import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const url = new URL(req.url);
  const countOnly = url.searchParams.get("count") === "true";

  if (countOnly) {
    const count = await prisma.inboundEmail.count({
      where: { userId: session.user.id, status: "pending" },
    });
    return NextResponse.json({ count });
  }

  const inboundEmails = await prisma.inboundEmail.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      prospect: { select: { name: true, niche: true, city: true } },
      emailLog: { select: { subject: true } },
    },
  });

  return NextResponse.json({ inboundEmails });
}
