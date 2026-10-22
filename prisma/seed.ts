// Seeds an ADMIN user so admin-only routes (category writes) can be exercised locally.
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { PrismaClient, Role } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

const main = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env to seed the admin user.");
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: Role.ADMIN, password: hashedPassword },
    create: { email, name: "Admin", password: hashedPassword, role: Role.ADMIN },
  });

  console.log(`Admin user ready: ${admin.email} (id ${admin.id})`);
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
