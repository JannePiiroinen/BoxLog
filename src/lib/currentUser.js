import { prisma } from "./prisma";

const DEFAULT_EMAIL = process.env.DEFAULT_USER_EMAIL || "janne@example.com";

export async function getCurrentUser() {
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_EMAIL },
    update: {},
    create: { email: DEFAULT_EMAIL, name: "Testikäyttäjä" },
  });
  return user;
}
