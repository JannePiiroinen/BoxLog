import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function POST(request) {
  try {
    const { focus, duration, level, equipment } = await request.json();
    const user = await getCurrentUser();

    const recentWorkouts = await prisma.workout.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: 5,
    });
    const recent = recentWorkouts.map((w) => `${w.date.toISOString().slice(0, 10)}: ${w.desc}`).join("; ");

    const prompt = `Olet kokenut CrossFit-valmentaja. Suunnittele yksi tämän päivän treeni (WOD) suomeksi seuraavilla parametreilla:
- Painopiste: ${focus}
- Kesto: noin ${duration} minuuttia
- Taso: ${level}
- Käytettävissä oleva välineistö: ${equipment}
- Viimeaikaiset treenit (vältä liiallista toistoa): ${recent || "ei tietoa"}

TÄRKEÄÄ liikkeiden nimistä:
Jos liike on yleisesti tunnettu perusliike (esim. squat, lunge, burpee, mountain climber, push-up, plank, box jump, pull-up), älä selitä sitä sulkeissa - kirjoita vain liikkeen nimi ja toistomäärä/paino, kuten oikealla CrossFit-boksin liitutaululla.
LISÄÄ sen sijaan lyhyt (max 5-8 sanan) suomenkielinen selitys sulkeissa aina, kun liike on: (a) tangonvalmistelu- tai olympiannostoliike (esim. puutanko pass-through, muscle snatch, overhead squat puutangolla, positional clean), (b) harvinaisempi gymnastiikka- tai lisäliike, tai (c) muunneltu/skaalattu versio perusliikkeestä.
Kun alkulämmittelyssä tarvitaan kevyt väline tangonvalmisteluun, käytä aina termiä "puutanko" (ei "PVC", "PVC-putki" tai "puukeppi") - saleilla käytetään puutankoja, ei muoviputkia.
Kaikki muu teksti (otsikot, kuvaukset, vinkit) kirjoitetaan suomeksi, mutta pidä ne lyhyinä - älä kirjoita fysioterapiamaisia pitkiä ohjeita.
Kirjoita voimaosuuden lisähuomiot ja coach_cue täysinä, luontevina suomenkielisinä lauseina - älä irrallisina sanafragmentteina (esim. älä kirjoita "pakarat alle polvet", vaan "vie lantio niin syvälle, että pakarat laskeutuvat polvien alapuolelle").
TÄRKEÄÄ rakenteesta: "alkulammittely", "voimaosuus" ja "metcon.liikkeet" ovat JSON-taulukoita (array), EI yhtä pitkää merkkijonoa. Jokainen erillinen liike, sarja tai ohje omana taulukon alkionaan (yksi rivi = yksi asia, ei "•"-merkkejä tai pilkuilla/väliviivoilla yhteen pötköön tungettuja lauseita). Esim. alkulammittely: ["2 kierrosta:", "10 lonkkakierto per suunta", "10 kahvakuula deadlift kevyellä painolla", "8 goblet squat"].
Älä koskaan lisää pelkkää erotinriviä (esim. "---" tai "***") omaksi taulukon alkiokseen alilohkojen väliin - jos alkulämmittelyssä tai voimaosuudessa on selkeästi eri vaiheita (esim. yleinen lämmittely ja tangonvalmistelu), listaa ne silti yhtenä jatkuvana alkioiden sarjana ilman erotinta, tarvittaessa oman lyhyen otsikkorivin avulla (esim. "Tangonvalmistelu:").
JSON-rakenne:
{
  "nimi": "lyhyt nimi treenille",
  "alkulammittely": ["rivi 1", "rivi 2", "..."],
  "voimaosuus": ["rivi 1", "rivi 2", "..."] tai null jos ei sovellu,
  "metcon": { "muoto": "esim. 21-15-9", "liikkeet": ["rivi 1", "rivi 2", "..."], "aikaraja": "esim. 12 min tai null" },
  "coach_cue": "yksi lyhyt vinkki suoritukseen"
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

    let wod;
    try {
      wod = JSON.parse(text);
    } catch (parseErr) {
      return NextResponse.json(
        { error: "AI palautti virheellistä JSONia", detail: text },
        { status: 502 }
      );
    }
    return NextResponse.json({ wod });
  } catch (err) {
    return NextResponse.json({ error: "WOD:n luonti epäonnistui", detail: String(err) }, { status: 500 });
  }
}
