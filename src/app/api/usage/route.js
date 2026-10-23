import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/currentUser";
import { getMonthlyUsage } from "@/lib/usageLimit";

// Kuluvan kalenterikuukauden AI-käyttö ja rajat per laji: { usage: { wod: { used, limit }, ... } }
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Ei kirjauduttu" }, { status: 401 });

    const usage = await getMonthlyUsage(user.id);
    return NextResponse.json({ usage });
  } catch (err) {
    return NextResponse.json({ error: "Käyttötietojen haku epäonnistui", detail: String(err) }, { status: 500 });
  }
}
