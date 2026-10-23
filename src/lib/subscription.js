import { NextResponse } from "next/server";

// Tilausvaatimus on pois päältä, kunnes REQUIRE_SUBSCRIPTION=true asetetaan.
// Käyttörajat (src/lib/usageLimit.js) suojaavat AI-kuluja silti.
const SUBSCRIPTION_ENABLED = process.env.REQUIRE_SUBSCRIPTION === "true";

// Palauttaa 402-vastauksen jos käyttäjällä ei ole aktiivista tilausta, muuten null.
export function subscriptionRequired(user) {
  if (!SUBSCRIPTION_ENABLED) return null;
  if (user.subscriptionStatus === "active") return null;
  return NextResponse.json({ error: "Tilaus vaaditaan", subscribe: true }, { status: 402 });
}
