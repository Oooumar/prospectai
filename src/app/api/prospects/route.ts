import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const niche = searchParams.get("niche");
    const noWebsite = searchParams.get("noWebsite") === "true";

    const and: any[] = [];
    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { city: { contains: search, mode: "insensitive" as const } },
        ],
      });
    }
    if (noWebsite) {
      and.push({ OR: [{ website: null }, { website: "" }] });
    }

    const where = {
      userId: session.user.id,
      ...(status && { status: status as any }),
      ...(niche && { niche: { contains: niche, mode: "insensitive" as const } }),
      ...(and.length > 0 && { AND: and }),
    };

    const [prospects, total] = await Promise.all([
      prisma.prospect.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.prospect.count({ where }),
    ]);

    return NextResponse.json({ prospects, total, page, limit });
  } catch (err: any) {
    console.error("[prospects] GET:", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

    await prisma.prospect.deleteMany({ where: { id, userId: session.user.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[prospects] DELETE:", err.message);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
