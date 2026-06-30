import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

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
