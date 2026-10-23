import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { subscriptionRequired } from "@/lib/subscription";
import { checkAndRecordUsage, releaseUsage } from "@/lib/usageLimit";

const MAX_WORKOUTS_PER_PERIOD = 60;

export async function POST(request) {
  let usageEventId = null;
  try {
    const body = await request.json();
    const rangeMonths = Math.min(Math.max(parseInt(body.rangeMonths, 10) || 2, 1), 12);
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Ei kirjauduttu" }, { status: 401 });
    const gate = subscriptionRequired(user);
    if (gate) return gate;

    const usage = await checkAndRecordUsage(user.id, "report");
    if (!usage.ok) return NextResponse.json({ error: usage.message }, { status: usage.status });
    usageEventId = usage.eventId;

    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setMonth(cutoff.getMonth() - rangeMonths);
    const prevCutoff = new Date(cutoff);
    prevCutoff.setMonth(prevCutoff.getMonth() - rangeMonths);

    // Promptiin otetaan enintään MAX_WORKOUTS_PER_PERIOD viimeisintä treeniä per jakso, ettei se kasva rajatta.
    // Kokonaismäärät haetaan erikseen, jotta raportin kappalemäärät pitävät paikkansa.
    const currentWhere = { userId: user.id, date: { gte: cutoff, lt: now } };
    const previousWhere = { userId: user.id, date: { gte: prevCutoff, lt: cutoff } };
    const latestFirst = { orderBy: { date: "desc" }, take: MAX_WORKOUTS_PER_PERIOD };
    const [currentLatest, previousLatest, currentCount, previousCount, records] = await Promise.all([
      prisma.workout.findMany({ where: currentWhere, ...latestFirst }),
      prisma.workout.findMany({ where: previousWhere, ...latestFirst }),
      prisma.workout.count({ where: currentWhere }),
      prisma.workout.count({ where: previousWhere }),
      prisma.personalRecord.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } }),
    ]);
    const current = currentLatest.reverse();
    const previous = previousLatest.reverse();
    const countLabel = (total, shown) => (total > shown ? `${total} kpl, alla viimeisimmät ${shown}` : `${total} kpl`);

    const summarize = (list) =>
      list
        .map((w) => {
          const d = w.date.toISOString().slice(0, 10);
          let line = `${d}: ${w.desc}`;
          if (w.result) line += ` | tulos: ${w.result}`;
          if (w.restHr) line += ` | aamusyke: ${w.restHr}`;
          if (w.avgHr) line += ` | keskisyke: ${w.avgHr}`;
          if (w.recovery) line += ` | palautuminen: ${w.recovery}`;
          if (w.hrv) line += ` | HRV: ${w.hrv}ms`;
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

TARKASTELUJAKSON TREENIT (${countLabel(currentCount, current.length)}):
${summarize(current) || "ei merkintöjä"}

EDELLINEN JAKSO (${countLabel(previousCount, previous.length)}):
${summarize(previous) || "ei merkintöjä"}

ENNÄTYSHISTORIA:
${prSummary || "ei ennätystietoja"}

Kirjoita suomeksi lyhyt kehitysraportti. 
Jos mainitset liikkeitä nimeltä, käytä vakiintunutta englanninkielistä CrossFit-terminologiaa (esim. thruster, snatch, pull-up) äläkä käännä niitä.

TÄRKEÄÄ: älä koskaan mainitse tai keksi mitään lukuarvoa jota ei esiinny yllä olevassa treenidatassa. Tämä koskee jokaista mittaria erikseen (aamusyke, keskisyke, HRV, uni, RPE): jos JOKIN näistä mittareista puuttuu KAIKISTA annetuista treenimerkinnöistä, älä mainitse sitä mittaria raportissa lainkaan. Jos taas esimerkiksi HRV-arvoja ON annettu useammassa merkinnässä, voit ja kannattaa kommentoida niiden trendiä (nouseva/laskeva/vakaa) "huomiot"-kentässä, koska se on aidosti hyödyllistä palautetta käyttäjälle. Sama periaate koskee jokaista yksittäistä mittaria itsenäisesti - osa mittareista voi puuttua ja osa olla mukana samassa raportissa.

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
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      await releaseUsage(usageEventId);
      const errText = await res.text();
      return NextResponse.json({ error: "Anthropic API -virhe", detail: errText }, { status: 502 });
    }

    const data = await res.json();
    const text = (data.content || [])
      .map((b) => b.text || "")
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    let report;
    try {
      report = JSON.parse(text);
    } catch (parseErr) {
      await releaseUsage(usageEventId);
      return NextResponse.json(
        { error: "AI palautti virheellistä JSONia", detail: text },
        { status: 502 }
      );
    }
    return NextResponse.json({ report: { ...report, currentCount, previousCount } });
  } catch (err) {
    await releaseUsage(usageEventId);
    return NextResponse.json({ error: "Raportin luonti epäonnistui", detail: String(err) }, { status: 500 });
  }
}
