import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function GET() {
  const user = await getCurrentUser();
  const records = await prisma.personalRecord.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
  });

  // Ryhmitellään käyttäjän itse antaman liikkeen nimen (label) mukaan.
  const grouped = {};
  for (const r of records) {
    if (!grouped[r.label]) grouped[r.label] = { label: r.label, unit: r.unit, history: [] };
    grouped[r.label].history.push({ id: r.id, date: r.date.toISOString().slice(0, 10), value: r.value });
  }
  return NextResponse.json({ prs: grouped });
}

export async function POST(request) {
  const user = await getCurrentUser();
  const body = await request.json();

  if (!body.label || !body.value) {
    return NextResponse.json({ error: "Nimi ja kilomäärä vaaditaan" }, { status: 400 });
  }

  const record = await prisma.personalRecord.create({
    data: {
      userId: user.id,
      key: body.label,
      label: body.label,
      unit: body.unit || "kg",
      value: String(body.value),
      date: body.date ? new Date(body.date) : new Date(),
    },
  });

  return NextResponse.json({ record });
}
