import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function PATCH(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Ei kirjauduttu" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const data = {};
  if (body.label !== undefined) {
    data.label = body.label;
    data.key = body.label; // pidetään key ja label samana, koska ryhmittely tapahtuu labelin mukaan
  }
  if (body.date !== undefined) data.date = new Date(body.date);
  if (body.value !== undefined) data.value = String(body.value);

  const { count } = await prisma.personalRecord.updateMany({ where: { id, userId: user.id }, data });
  if (count === 0) return NextResponse.json({ error: "Ennätystä ei löytynyt" }, { status: 404 });

  const record = await prisma.personalRecord.findUnique({ where: { id } });
  return NextResponse.json({ record });
}

export async function DELETE(request, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Ei kirjauduttu" }, { status: 401 });

  const { id } = await params;
  try {
    const { count } = await prisma.personalRecord.deleteMany({ where: { id, userId: user.id } });
    if (count === 0) return NextResponse.json({ error: "Ennätystä ei löytynyt" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PR-poisto epäonnistui:", err);
    return NextResponse.json({ error: "Poisto epäonnistui", detail: String(err) }, { status: 500 });
  }
}
