import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  profileType: z.enum(["b2b", "creator", "agency"]).default("b2b"),
  plan: z.enum(["starter", "creator", "pro", "agency"]).default("starter"),
  paymentMethod: z.enum(["stripe", "paypal"]).default("stripe"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const { name, email, password, profileType, plan, paymentMethod } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    let user: any;
    try {
      user = await (prisma.user as any).create({
        data: {
          name,
          email,
          password: hashed,
          profileType,
          plan,
          paymentMethod,
          trialEndsAt,
          subscriptionStatus: "trialing",
          trialReminderSent: false,
        },
      });
    } catch {
      // Fallback: create without subscription columns if they don't exist yet
      user = await prisma.user.create({
        data: { name, email, password: hashed },
      });
    }

    return NextResponse.json({ success: true, userId: user.id, email: user.email, plan, paymentMethod }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
