import { NextResponse } from "next/server";

// Palauttaa 402-vastauksen jos käyttäjällä ei ole aktiivista tilausta, muuten null.
export function subscriptionRequired(user) {
  if (user.subscriptionStatus === "active") return null;
  return NextResponse.json({ error: "Tilaus vaaditaan", subscribe: true }, { status: 402 });
}
