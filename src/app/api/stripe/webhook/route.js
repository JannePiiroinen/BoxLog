import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export async function POST(request) {
  // Raw body tarvitaan signeeraukseen - älä parsi JSONiksi ennen verifiointia
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: "Virheellinen webhook-allekirjoitus" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode !== "subscription" || !session.subscription) break;
        const sub = await getStripe().subscriptions.retrieve(session.subscription);
        await prisma.user.updateMany({
          where: { id: session.client_reference_id },
          data: {
            stripeCustomerId: session.customer,
            stripeSubscriptionId: sub.id,
            subscriptionStatus: sub.status,
          },
        });
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object;
        await prisma.user.updateMany({
          where: { stripeCustomerId: sub.customer },
          data: { stripeSubscriptionId: sub.id, subscriptionStatus: sub.status },
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        await prisma.user.updateMany({
          where: { stripeCustomerId: sub.customer },
          data: { stripeSubscriptionId: sub.id, subscriptionStatus: "canceled" },
        });
        break;
      }
      default:
        // Muut tapahtumat ohitetaan
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    // 500 saa Stripen yrittämään tapahtumaa uudelleen
    return NextResponse.json({ error: "Webhook-käsittely epäonnistui" }, { status: 500 });
  }
}
