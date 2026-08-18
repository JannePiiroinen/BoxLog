import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request, { params }) {
  const { id } = await params;
  const body = await request.json();

  const data = {};
  if (body.label !== undefined) {
    data.label = body.label;
    data.key = body.label; // pidetään key ja label samana, koska ryhmittely tapahtuu labelin mukaan
  }
  if (body.date !== undefined) data.date = new Date(body.date);
  if (body.value !== undefined) data.value = String(body.value);

  const record = await prisma.personalRecord.update({ where: { id }, data });
  return NextResponse.json({ record });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await prisma.personalRecord.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
