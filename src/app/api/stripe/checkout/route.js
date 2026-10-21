import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/currentUser";

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Ei kirjauduttu" }, { status: 401 });

    const origin = new URL(request.url).origin;

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      // Olemassa oleva Stripe-asiakas tunnistetaan, muuten sähköposti esitäytetään
      ...(user.stripeCustomerId ? { customer: user.stripeCustomerId } : { customer_email: user.email }),
      client_reference_id: user.id,
      subscription_data: { metadata: { userId: user.id } },
      success_url: `${origin}/?subscribed=1`,
      cancel_url: `${origin}/tilaus`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: "Checkoutin luonti epäonnistui", detail: String(err) }, { status: 500 });
  }
}
