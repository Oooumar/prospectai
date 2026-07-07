import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ plan: "starter" });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, subscriptionStatus: true, role: true },
  });

  return NextResponse.json({
    plan: user?.plan ?? "starter",
    subscriptionStatus: user?.subscriptionStatus ?? "pending",
    role: user?.role ?? "user",
  });
}
