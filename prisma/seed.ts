import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@prospectai.com";
  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const password = await bcrypt.hash("demo1234", 12);
    const user = await prisma.user.create({
      data: {
        name: "Demo User",
        email,
        password,
        dailyLimit: 50,
      },
    });

    console.log("✅ Demo user created:", user.email);
    console.log("   Password: demo1234");
  } else {
    console.log("ℹ️  Demo user already exists");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
