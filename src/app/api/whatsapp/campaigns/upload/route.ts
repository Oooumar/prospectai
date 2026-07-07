import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getPlanLimits, PLAN_DISPLAY, NEXT_PLAN } from "@/lib/plan-limits";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    // Plan check: image upload blocked on DÉCOUVERTE
    type UserPlanRow = { plan: string; role: string };
    const planRows = await prisma.$queryRaw<UserPlanRow[]>`
      SELECT "plan", "role" FROM "User" WHERE "id" = ${session.user.id}
    `;
    const u = planRows[0];
    const isAdmin = u?.role === "admin";
    const limits = getPlanLimits(u?.plan ?? "starter");

    if (!isAdmin && !limits.imageUpload) {
      const required = NEXT_PLAN[u?.plan ?? "starter"] ?? "starter";
      return NextResponse.json({
        error: `L'upload d'images est disponible à partir du plan ${PLAN_DISPLAY[required] ?? "STARTER"}.`,
        blockedByPlan: true,
        requiredPlan: required,
      }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 });

    const ext = file.name.split(".").pop() ?? "jpg";
    const blobName = `wa-campaigns/${session.user.id}/${Date.now()}.${ext}`;
    const blob = await put(blobName, file, { access: "public" });

    return NextResponse.json({ url: blob.url, name: file.name });
  } catch (err: any) {
    console.error("[campaigns/upload]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
