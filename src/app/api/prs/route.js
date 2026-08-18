import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function GET() {
  const user = await getCurrentUser();
  const records = await prisma.personalRecord.findMany({
    where: { userId: user.id },
    orderBy: { date: "asc" },
  });

  // Ryhmitellään liikkeen avaimen mukaan, jotta frontend saa suoraan historian per liike.
  const grouped = {};
  for (const r of records) {
    if (!grouped[r.key]) grouped[r.key] = { label: r.label, unit: r.unit, history: [] };
    grouped[r.key].history.push({ date: r.date.toISOString().slice(0, 10), value: r.value });
  }
  return NextResponse.json({ prs: grouped });
}

export async function POST(request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const record = await prisma.personalRecord.create({
    data: {
      userId: user.id,
      key: body.key,
      label: body.label,
      unit: body.unit,
      value: String(body.value),
    },
  });

  return NextResponse.json({ record });
}
