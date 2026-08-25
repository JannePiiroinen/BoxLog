import { prisma } from "./prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Kirjautuminen voidaan kytkeä kokonaan pois päältä (esim. demo/myyntivaihe ennen
// kuin Google OAuth -tunnukset on hankittu) asettamalla NEXT_PUBLIC_SKIP_AUTH=true.
// Silloin kaikki data menee yhdelle kovakoodatulle testikäyttäjälle, kuten Vaihe 1:ssä.
const SKIP_AUTH = process.env.NEXT_PUBLIC_SKIP_AUTH === "true";
const DEFAULT_EMAIL = process.env.DEFAULT_USER_EMAIL || "janne@example.com";

export async function getCurrentUser() {
  if (SKIP_AUTH) {
    const user = await prisma.user.upsert({
      where: { email: DEFAULT_EMAIL },
      update: {},
      create: { email: DEFAULT_EMAIL, name: "Testikäyttäjä" },
    });
    return user;
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.upsert({
    where: { email: session.user.email },
    update: { name: session.user.name || undefined },
    create: { email: session.user.email, name: session.user.name || null },
  });
  return user;
}
