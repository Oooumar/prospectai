import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env.local" });

const prisma = new PrismaClient();
const EMAIL = "azizssro72@gmail.com";
const TEMP_PASSWORD = "Admin@ProspectAI2026!";

async function main() {
  const hashed = await bcrypt.hash(TEMP_PASSWORD, 12);
  const trialEndsAt = new Date("2099-12-31");

  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });

  if (existing) {
    await prisma.$executeRawUnsafe(`
      UPDATE "User" SET
        role = 'admin',
        plan = 'agency',
        "dailyLimit" = 999999,
        "subscriptionStatus" = 'active',
        "trialEndsAt" = '2099-12-31'
      WHERE email = $1
    `, EMAIL);
    console.log("✅ Compte existant promu admin :", EMAIL);
    console.log("🔑 Mot de passe inchangé (utilise ton mot de passe existant)");
  } else {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "User" (id, name, email, password, role, plan, "dailyLimit", "subscriptionStatus", "trialEndsAt", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), 'Aziz', $1, $2, 'admin', 'agency', 999999, 'active', '2099-12-31', NOW(), NOW())
    `, EMAIL, hashed);
    console.log("✅ Compte admin créé :", EMAIL);
    console.log("🔑 Mot de passe :", TEMP_PASSWORD);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
