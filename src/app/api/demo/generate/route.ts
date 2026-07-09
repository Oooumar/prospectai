import { NextRequest, NextResponse } from "next/server";
import { generateProspectEmail } from "@/lib/groq";

const MAX_GEN = 3;
const COOKIE  = "prospectai_demo_gen";

export async function POST(req: NextRequest) {
  const count = Math.max(0, parseInt(req.cookies.get(COOKIE)?.value ?? "0", 10) || 0);

  if (count >= MAX_GEN) {
    return NextResponse.json({ error: "limit_reached" }, { status: 429 });
  }

  let body: { name?: string; niche?: string; city?: string; hasWebsite?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, niche, city, hasWebsite } = body;
  if (!name || !niche || !city) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const result = await generateProspectEmail(
      { name, niche, city, website: hasWebsite ? "https://example.com" : undefined },
      "b2b",
      undefined,
      undefined,
    );

    const res = NextResponse.json({
      subject:   result.subject,
      body:      result.body,
      remaining: MAX_GEN - count - 1,
    });

    res.cookies.set(COOKIE, String(count + 1), {
      maxAge:   60 * 60 * 24,
      path:     "/",
      sameSite: "lax",
      httpOnly: true,
    });

    return res;
  } catch {
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}
