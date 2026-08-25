import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Ei kirjauduttu" }, { status: 401 });

  const workouts = await prisma.workout.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ workouts });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Ei kirjauduttu" }, { status: 401 });

  const body = await request.json();

  const workout = await prisma.workout.create({
    data: {
      userId: user.id,
      date: new Date(body.date),
      desc: body.desc,
      result: body.result || null,
      notes: body.notes || null,
      focus: body.focus || null,
      restHr: body.restHr ? Number(body.restHr) : null,
      avgHr: body.avgHr ? Number(body.avgHr) : null,
      recovery: body.recovery || null,
      hrv: body.hrv ? Number(body.hrv) : null,
      sleepHrs: body.sleepHrs ? Number(body.sleepHrs) : null,
      rpe: body.rpe ? Number(body.rpe) : null,
    },
  });

  return NextResponse.json({ workout });
}

export async function DELETE(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Ei kirjauduttu" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id puuttuu" }, { status: 400 });

  const { count } = await prisma.workout.deleteMany({ where: { id, userId: user.id } });
  if (count === 0) return NextResponse.json({ error: "Merkintää ei löytynyt" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
