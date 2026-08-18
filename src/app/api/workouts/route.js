import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function GET() {
  const user = await getCurrentUser();
  const workouts = await prisma.workout.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ workouts });
}

export async function POST(request) {
  const user = await getCurrentUser();
  const body = await request.json();

  const workout = await prisma.workout.create({
    data: {
      userId: user.id,
      date: new Date(body.date),
      desc: body.desc,
      result: body.result || null,
      notes: body.notes || null,
      restHr: body.restHr ? Number(body.restHr) : null,
      avgHr: body.avgHr ? Number(body.avgHr) : null,
      recovery: body.recovery || null,
      sleepHrs: body.sleepHrs ? Number(body.sleepHrs) : null,
      rpe: body.rpe ? Number(body.rpe) : null,
    },
  });

  return NextResponse.json({ workout });
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id puuttuu" }, { status: 400 });

  await prisma.workout.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
