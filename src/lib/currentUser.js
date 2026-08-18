import { prisma } from "./prisma";

// VAIHE 1: ei vielä kirjautumista. Kaikki data liitetään yhteen "oletuskäyttäjään",
// jotta tietokantamalli on jo valmis monen käyttäjän varalle (vaihe 2: NextAuth + Gym-malli).
const DEFAULT_EMAIL = process.env.DEFAULT_USER_EMAIL || "janne@example.com";

export async function getCurrentUser() {
  const user = await prisma.user.upsert({
    where: { email: DEFAULT_EMAIL },
    update: {},
    create: { email: DEFAULT_EMAIL, name: "Testikäyttäjä" },
  });
  return user;
}
