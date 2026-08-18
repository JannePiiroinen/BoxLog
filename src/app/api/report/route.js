import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function POST(request) {
  try {
    const { rangeMonths = 2 } = await request.json();
    const user = await getCurrentUser();

    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - rangeMonths);
    const prevCutoff = new Date(cutoff);
    prevCutoff.setMonth(prevCutoff.getMonth() - rangeMonths);

    const [current, previous, records] = await Promise.all([
      prisma.workout.findMany({ where: { userId: user.id, date: { gte: cutoff, lt: now } }, orderBy: { date: "asc" } }),
      prisma.workout.findMany({ where: { userId: user.id, date: { gte: prevCutoff, lt: cutoff } }, orderBy: { date: "asc" } }),
      prisma.personalRecord.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } }),
    ]);

    const summarize = (list) =>
      list
        .map((w) => {
          const d = w.date.toISOString().slice(0, 10);
          let line = `${d}: ${w.desc}`;
          if (w.result) line += ` | tulos: ${w.result}`;
          if (w.restHr) line += ` | aamusyke: ${w.restHr}`;
          if (w.avgHr) line += ` | keskisyke: ${w.avgHr}`;
          if (w.recovery) line += ` | palautuminen/HRV: ${w.recovery}`;
          if (w.sleepHrs) line += ` | uni: ${w.sleepHrs}h`;
          if (w.rpe) line += ` | RPE: ${w.rpe}`;
          return line;
        })
        .join("\n");

    const prSummary = Object.entries(
      records.reduce((acc, r) => {
        acc[r.label] = acc[r.label] || [];
        acc[r.label].push(`${r.date.toISOString().slice(0, 10)}=${r.value}`);
        return acc;
      }, {})
    )
      .map(([label, points]) => `${label}: ${points.join(", ")}`)
      .join("\n");

    const prompt = `Olet CrossFit-valmentaja, joka analysoi urheilijan kehitystä. Tarkastelujakso on viimeiset ${rangeMonths} kuukautta verrattuna sitä edeltäneisiin ${rangeMonths} kuukauteen.

TARKASTELUJAKSON TREENIT (${current.length} kpl):
${summarize(current) || "ei merkintöjä"}

EDELLINEN JAKSO (${previous.length} kpl):
${summarize(previous) || "ei merkintöjä"}

ENNÄTYSHISTORIA:
${prSummary || "ei ennätystietoja"}

Kirjoita suomeksi lyhyt kehitysraportti. 
Jos mainitset liikkeitä nimeltä, käytä vakiintunutta englanninkielistä CrossFit-terminologiaa (esim. thruster, snatch, pull-up) äläkä käännä niitä.
Vastaa VAIN JSON-muodossa, ei muuta tekstiä, ei markdown-koodilohkoja:
{
  "yhteenveto": "2-3 lauseen yleiskatsaus kehityksestä",
  "vahvuudet": "mikä on kehittynyt tai mennyt hyvin",
  "huomiot": "mahdolliset varoitusmerkit palautumisen, unen, sykkeen tai treenimäärän trendeistä",
  "suositus": "1-2 konkreettista suositusta seuraavalle jaksolle"
}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: "Anthropic API -virhe", detail: errText }, { status: 502 });
    }

    const data = await res.json();
    const text = (data.content || [])
      .map((b) => b.text || "")
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    const report = JSON.parse(text);
    return NextResponse.json({ report: { ...report, currentCount: current.length, previousCount: previous.length } });
  } catch (err) {
    return NextResponse.json({ error: "Raportin luonti epäonnistui", detail: String(err) }, { status: 500 });
  }
}
