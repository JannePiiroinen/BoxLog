import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { imageBase64, mediaType } = await request.json();
    if (!imageBase64 || !mediaType) {
      return NextResponse.json({ error: "Kuva puuttuu" }, { status: 400 });
    }

    const prompt = `Olet CrossFit-valmentaja, joka lukee tämän päivän treenin kuvasta salin liitutaulusta tai käsinkirjoitetusta lapusta.

TÄRKEÄÄ:
Lue kuvasta liikkeet, toistot, painot ja aikaraja TARKALLEEN kuten ne on kirjoitettu - älä keksi, arvaa tai täydennä mitään, mitä kuvassa ei lue.
Säilytä liikkeiden nimet ja lyhenteet täsmälleen sellaisina kuin taululla lukee (esim. "T2B" pysyy "T2B", älä laajenna sitä muotoon "toes-to-bar") - käännä vain ympäröivä teksti (otsikot, ohjeet) suomeksi, jos taulu on osittain tai kokonaan englanniksi.
Jos jokin osio (esim. alkulämmittely tai voimaosuus) ei näy kuvassa lainkaan, jätä se JSON:ssa arvoksi null - älä keksi täytettä sen tilalle.
"alkulammittely", "voimaosuus" ja "metcon.liikkeet" ovat JSON-taulukoita (array), yksi rivi/liike per taulukon alkio - ei "•"-merkkejä tai yhteen pötköön tungettuja lauseita. Väliotsikot (esim. "Tangonvalmistelu:") ovat sallittuja omana alkionaan, jos taulu erottelee vaiheita niin.
Lisää kenttä "epavarma": true, jos kuva on osittain epäselvä, huonosti valaistu, käsiala vaikeasti luettavaa tai jokin lukema jouduttiin arvaamaan tulkinnassa - muussa tapauksessa "epavarma": false.

Vastaa VAIN JSON-muodossa, ei muuta tekstiä, ei markdown-koodilohkoja:
{
  "nimi": "lyhyt nimi treenille, tai null jos ei näy kuvassa",
  "alkulammittely": ["rivi 1", "rivi 2", "..."] tai null,
  "voimaosuus": ["rivi 1", "rivi 2", "..."] tai null,
  "metcon": { "muoto": "esim. 21-15-9, tai null", "liikkeet": ["rivi 1", "rivi 2", "..."] tai null, "aikaraja": "esim. 12 min, tai null" },
  "coach_cue": "taululla mahdollisesti oleva vinkki, tai null",
  "epavarma": true tai false
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
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
              { type: "text", text: prompt },
            ],
          },
        ],
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
    return NextResponse.json({ error: "Kuvan tulkinta epäonnistui", detail: String(err) }, { status: 500 });
  }
}
