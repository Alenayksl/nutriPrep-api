import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { PrismaClient, Role } from "@prisma/client";
import { ALL_SCOPES, GRANT_TYPES, SCOPES } from "../src/models/oauth";

dotenv.config();

const prisma = new PrismaClient();

const seedAdmin = async () => {
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

const seedClients = async () => {
  const webClientId = process.env.OAUTH_WEB_CLIENT_ID ?? "nutriprep-web";
  const webClient = {
    name: "NutriPrep Web",
    clientSecret: null,
    grantTypes: [GRANT_TYPES.PASSWORD, GRANT_TYPES.REFRESH_TOKEN],
    scopes: [...ALL_SCOPES],
  };
  await prisma.oAuthClient.upsert({
    where: { clientId: webClientId },
    update: webClient,
    create: { clientId: webClientId, ...webClient },
  });
  console.log(`OAuth client ready: ${webClientId} (public; password, refresh_token)`);

  const serviceClientId = process.env.OAUTH_SERVICE_CLIENT_ID ?? "nutriprep-service";
  const serviceSecret = process.env.OAUTH_SERVICE_CLIENT_SECRET;
  if (!serviceSecret) {
    console.log(`Skipping ${serviceClientId}: set OAUTH_SERVICE_CLIENT_SECRET in .env to create it.`);
    return;
  }
  const serviceClient = {
    name: "NutriPrep Catalog Service",
    clientSecret: await bcrypt.hash(serviceSecret, 12),
    grantTypes: [GRANT_TYPES.CLIENT_CREDENTIALS],
    scopes: [SCOPES.CATEGORIES_READ, SCOPES.CATEGORIES_WRITE],
  };
  await prisma.oAuthClient.upsert({
    where: { clientId: serviceClientId },
    update: serviceClient,
    create: { clientId: serviceClientId, ...serviceClient },
  });
  console.log(`OAuth client ready: ${serviceClientId} (confidential; client_credentials)`);
};

const main = async () => {
  await seedAdmin();
  await seedClients();
};

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
