import Stripe from "stripe";

// Luodaan vasta pyynnön yhteydessä, jotta build ei kaadu puuttuvaan avaimeen.
// Test-tilassa STRIPE_SECRET_KEY alkaa "sk_test_". Oikeat avaimet vasta testauksen jälkeen.
let client;
export function getStripe() {
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}
