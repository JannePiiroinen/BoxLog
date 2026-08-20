"use client";

import { useEffect, useState, useCallback } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const wodFormats = [
  { term: "For Time", desc: "Suorita liikkeet/kierrokset mahdollisimman nopeasti, mitataan aika. Klassinen \"kuka on nopein\" -formaatti (esim. Fran)." },
  { term: "AMRAP (As Many Rounds/Reps As Possible)", desc: "Tee mahdollisimman monta kierrosta (tai toistoa) annetussa ajassa, esim. \"AMRAP 12 min\". Mittarina on kierrosmäärä, ei aika." },
  { term: "EMOM (Every Minute On the Minute)", desc: "Uusi liikesarja alkaa joka minuutin alussa. Jos ehdit ennen minuutin loppua, lepäät jäljelle jäävän ajan. Testaa sekä suoritustehoa että palautumista." },
  { term: "RFT (Rounds For Time)", desc: "Sama kuin For Time, mutta korostaa nimenomaan kierrosten määrää, esim. \"5 RFT: 10 pull-up, 15 push-up\"." },
  { term: "Tabata", desc: "20 sekuntia täysillä, 10 sekuntia lepoa, toistetaan 8 kierrosta (yhteensä 4 min) per liike. Alunperin tutkimusprotokolla, otettu CrossFitin käyttöön." },
  { term: "Chipper", desc: "Pitkä lista erilaisia liikkeitä, jotka suoritetaan kerran läpi järjestyksessä (ei kierroksia), usein isoilla toistomäärillä. \"Chippaat\" listaa läpi." },
  { term: "Ladder (tikapuut)", desc: "Toistomäärä nousee tai laskee joka kierroksella, esim. 1-2-3-4-5... tai päinvastoin. Nouseva/laskeva ladder." },
  { term: "Death By", desc: "Aloitat yhdellä toistolla minuutissa, joka minuutti lisäät yhden toiston (2, 3, 4...), kunnes et enää ehdi annetussa minuutissa — silloin treeni päättyy. Testaa kestävyyttä äärirajoille." },
  { term: "Interval / Rest-based", desc: "Esim. \"3 rounds, rest 2 min between\" — kierrokset erotettu kiinteillä lepotauoilla, ei jatkuva suoritus." },
  { term: "Strength/Skill work", desc: "Ei varsinainen \"metcon\"-formaatti, mutta osa WOD-rakennetta. Esim. \"5x5 back squat\" — sarjat x toistot kiinteällä painolla, keskittyy voimaan/tekniikkaan ennen metconia." },
  { term: "Partner WOD", desc: "Kaksi urheilijaa jakavat työn (esim. vuorotellen, tai toinen tekee liikettä A kun toinen liikettä B)." },
];

function resizeImageFile(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve({ dataUrl, base64: dataUrl.split(",")[1], mediaType: "image/jpeg" });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Kuvan lataus epäonnistui"));
    };
    img.src = url;
  });
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  background: "#171a18",
  border: "1px solid var(--line)",
  borderRadius: 3,
  color: "var(--chalk)",
  padding: "9px 10px",
  fontSize: 13,
};

const primaryBtn = {
  fontFamily: "'Bebas Neue', sans-serif",
  fontSize: 18,
  letterSpacing: "0.05em",
  padding: "9px 20px",
  background: "var(--rust)",
  color: "var(--bg)",
  border: "none",
  borderRadius: 3,
  cursor: "pointer",
};

function Panel({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 4, ...style }}>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--chalk-dim)", marginBottom: 6, textTransform: "uppercase" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function WodLines({ value, fontSize = 14 }) {
  if (!value) return null;
  const lines = Array.isArray(value) ? value : [value];
  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize }}>
      {lines.map((line, i) => {
        const isHeading = typeof line === "string" && line.trim().endsWith(":");
        if (isHeading) {
          return (
            <div key={i} style={{ marginTop: i === 0 ? 0 : 8, marginBottom: 2 }}>
              {line}
            </div>
          );
        }
        return (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, paddingLeft: 4 }}>
            <span style={{ color: "var(--chalk-dim)" }}>•</span>
            <span>{line}</span>
          </div>
        );
      })}
    </div>
  );
}

function WodCard({ wod, warning, onSave, saveLabel = "Tallenna lokiin", children }) {
  return (
    <Panel style={{ padding: 24, background: "var(--bg3)" }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, borderBottom: "2px solid var(--rust)", display: "inline-block", marginBottom: 16 }}>
        {wod.nimi || "Treeni"}
      </div>
      {wod.alkulammittely && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "var(--chalk-dim)", textTransform: "uppercase" }}>Alkulämmittely</div>
          <WodLines value={wod.alkulammittely} />
        </div>
      )}
      {wod.voimaosuus && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "var(--chalk-dim)", textTransform: "uppercase" }}>Voimaosuus</div>
          <WodLines value={wod.voimaosuus} />
        </div>
      )}
      {wod.metcon?.liikkeet && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "var(--rust)", textTransform: "uppercase" }}>
            Metcon {wod.metcon?.muoto ? `— ${wod.metcon.muoto}` : ""} {wod.metcon?.aikaraja ? `(${wod.metcon.aikaraja})` : ""}
          </div>
          <WodLines value={wod.metcon.liikkeet} fontSize={15} />
        </div>
      )}
      {wod.coach_cue && <div style={{ fontSize: 13, color: "var(--steel)", fontStyle: "italic" }}>Vinkki: {wod.coach_cue}</div>}
      {warning && (
        <div style={{ color: "var(--red)", fontSize: 13, marginTop: 14, padding: "10px 12px", border: "1px solid var(--red)", borderRadius: 3 }}>
          {warning}
        </div>
      )}
      {children}
      <button onClick={onSave} style={{ ...primaryBtn, marginTop: 18, background: "transparent", border: "1px solid var(--chalk)", color: "var(--chalk)" }}>
        {saveLabel}
      </button>
    </Panel>
  );
}

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 13,
        fontWeight: 500,
        padding: "7px 14px",
        marginRight: 8,
        marginBottom: 8,
        borderRadius: 999,
        border: `1px solid ${active ? "var(--rust)" : "var(--line)"}`,
        background: active ? "rgba(193,101,46,0.18)" : "transparent",
        color: active ? "var(--rust)" : "var(--chalk-dim)",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function Home() {
  const [tab, setTab] = useState("plan");
  const [workouts, setWorkouts] = useState([]);
  const [prs, setPrs] = useState({});
  const [loaded, setLoaded] = useState(false);

  const [planMode, setPlanMode] = useState("ai");

  const [focus, setFocus] = useState("Sekoitus");
  const [duration, setDuration] = useState(45);
  const [level, setLevel] = useState("RX");
  const [equipment, setEquipment] = useState("Täysi varustus");
  const [wod, setWod] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  const [manualDesc, setManualDesc] = useState("");
  const [manualResult, setManualResult] = useState("");
  const [manualSaving, setManualSaving] = useState(false);

  const [photoImage, setPhotoImage] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoWod, setPhotoWod] = useState(null);
  const [photoInterpreting, setPhotoInterpreting] = useState(false);
  const [photoError, setPhotoError] = useState(null);
  const [photoExtraSection, setPhotoExtraSection] = useState("metcon");
  const [photoExtraLine, setPhotoExtraLine] = useState("");

  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logDesc, setLogDesc] = useState("");
  const [logResult, setLogResult] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [logAvgHr, setLogAvgHr] = useState("");
  const [logRecovery, setLogRecovery] = useState("");
  const [logSleep, setLogSleep] = useState("");

  const [wodAvgHr, setWodAvgHr] = useState("");
  const [wodRecovery, setWodRecovery] = useState("");
  const [wodSleepHrs, setWodSleepHrs] = useState("");

  const [showGlossary, setShowGlossary] = useState(false);

  const [reportRange, setReportRange] = useState(2);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  const [prName, setPrName] = useState("");
  const [prDate, setPrDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [prValue, setPrValue] = useState("");
  const [prUnit, setPrUnit] = useState("kg");
  const [prError, setPrError] = useState(null);
  const [editingPrId, setEditingPrId] = useState(null);

  const loadAll = useCallback(async () => {
    const [wRes, pRes] = await Promise.all([fetch("/api/workouts"), fetch("/api/prs")]);
    const wData = await wRes.json();
    const pData = await pRes.json();
    setWorkouts(wData.workouts || []);
    setPrs(pData.prs || {});
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  async function generateWod() {
    setGenerating(true);
    setGenError(null);
    setWod(null);
    try {
      const res = await fetch("/api/wod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus, duration, level, equipment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWod(data.wod);
    } catch (e) {
      setGenError("WOD:n luonti epäonnistui. Yritä uudelleen.");
    } finally {
      setGenerating(false);
    }
  }

  function describeWod(w) {
    const liikkeet = Array.isArray(w.metcon?.liikkeet) ? w.metcon.liikkeet.join(", ") : w.metcon?.liikkeet || "";
    const nimi = w.nimi || "Treeni";
    const muoto = w.metcon?.muoto ? ` — ${w.metcon.muoto}` : "";
    const osa = liikkeet ? `: ${liikkeet}` : "";
    return `${nimi}${muoto}${osa}`;
  }

  async function saveWodToLog() {
    if (!wod) return;
    await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: logDate,
        desc: describeWod(wod),
        notes: wod.coach_cue || "",
        focus,
        avgHr: wodAvgHr,
        recovery: wodRecovery,
        sleepHrs: wodSleepHrs,
      }),
    });
    setWodAvgHr("");
    setWodRecovery("");
    setWodSleepHrs("");
    await loadAll();
    setTab("log");
  }

  async function saveManualWorkout() {
    if (!manualDesc.trim()) return;
    setManualSaving(true);
    await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: logDate,
        desc: manualDesc.trim(),
        result: manualResult.trim(),
      }),
    });
    setManualDesc("");
    setManualResult("");
    setManualSaving(false);
    await loadAll();
    setTab("log");
  }

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoWod(null);
    setPhotoError(null);
    try {
      const { dataUrl, base64, mediaType } = await resizeImageFile(file);
      setPhotoPreview(dataUrl);
      setPhotoImage({ base64, mediaType });
    } catch (err) {
      setPhotoError("Kuvan lukeminen epäonnistui.");
    }
  }

  async function interpretPhoto() {
    if (!photoImage) return;
    setPhotoInterpreting(true);
    setPhotoError(null);
    setPhotoWod(null);
    try {
      const res = await fetch("/api/wod-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: photoImage.base64, mediaType: photoImage.mediaType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhotoWod(data.wod);
    } catch (e) {
      setPhotoError("Taulun tulkinta epäonnistui. Tarkista valaistus/terävyys ja yritä uudelleen.");
    } finally {
      setPhotoInterpreting(false);
    }
  }

  function addPhotoWodLine() {
    const line = photoExtraLine.trim();
    if (!line || !photoWod) return;
    setPhotoWod((prev) => {
      if (photoExtraSection === "metcon") {
        const liikkeet = Array.isArray(prev.metcon?.liikkeet) ? prev.metcon.liikkeet : [];
        return { ...prev, metcon: { ...(prev.metcon || {}), liikkeet: [...liikkeet, line] } };
      }
      const current = Array.isArray(prev[photoExtraSection]) ? prev[photoExtraSection] : [];
      return { ...prev, [photoExtraSection]: [...current, line] };
    });
    setPhotoExtraLine("");
  }

  async function savePhotoWodToLog() {
    if (!photoWod) return;
    await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: logDate,
        desc: describeWod(photoWod),
        notes: "Tulkittu salin taululta",
      }),
    });
    setPhotoWod(null);
    setPhotoPreview(null);
    setPhotoImage(null);
    await loadAll();
    setTab("log");
  }

  async function addLogEntry() {
    if (!logDesc.trim()) return;
    await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: logDate,
        desc: logDesc.trim(),
        result: logResult.trim(),
        notes: logNotes.trim(),
        avgHr: logAvgHr,
        recovery: logRecovery,
        sleepHrs: logSleep,
      }),
    });
    setLogDesc("");
    setLogResult("");
    setLogNotes("");
    setLogAvgHr("");
    setLogRecovery("");
    setLogSleep("");
    await loadAll();
  }

  async function deleteEntry(id) {
    await fetch(`/api/workouts?id=${id}`, { method: "DELETE" });
    await loadAll();
  }

  async function addPr() {
    setPrError(null);
    if (!prName.trim() || !prValue) {
      setPrError("Anna liikkeen nimi ja kilomäärä.");
      return;
    }
    await fetch("/api/prs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: prName.trim(), date: prDate, value: prValue, unit: prUnit }),
    });
    setPrName("");
    setPrValue("");
    await loadAll();
  }

  async function savePrEdit(id, label, date, value) {
    await fetch(`/api/prs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, date, value }),
    });
    setEditingPrId(null);
    await loadAll();
  }

  async function deletePr(id) {
    await fetch(`/api/prs/${id}`, { method: "DELETE" });
    await loadAll();
  }

  async function generateReport() {
    setReportLoading(true);
    setReport(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rangeMonths: reportRange }),
      });
      const data = await res.json();
      setReport(data.report);
    } catch (e) {
      // näytetään yksinkertainen virhe
    } finally {
      setReportLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", padding: "24px 16px 60px" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42 }}>
            BOX<span style={{ color: "var(--rust)" }}>LOG</span>
          </div>
          <div style={{ color: "var(--chalk-dim)", fontSize: 13 }}>Oma valmentaja ja lokikirja.</div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {["plan", "log", "prs", "report"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 20,
                letterSpacing: "0.08em",
                padding: "10px 22px",
                background: tab === t ? "var(--rust)" : "transparent",
                color: tab === t ? "var(--bg)" : "var(--chalk-dim)",
                border: `1px solid ${tab === t ? "var(--rust)" : "var(--line)"}`,
                borderRadius: 3,
                cursor: "pointer",
              }}
            >
              {{ plan: "LUO WOD", log: "LOKI", prs: "ENNÄTYKSET", report: "RAPORTTI" }[t]}
            </button>
          ))}
        </div>

        {!loaded && <div style={{ color: "var(--chalk-dim)" }}>Ladataan…</div>}

        {loaded && tab === "plan" && (
          <div>
            <Field label="Tila">
              {[
                { key: "ai", label: "AI luo WOD" },
                { key: "manual", label: "Luo oma" },
                { key: "photo", label: "Ohjattu WOD" },
              ].map((m) => (
                <Pill key={m.key} active={planMode === m.key} onClick={() => setPlanMode(m.key)}>
                  {m.label}
                </Pill>
              ))}
            </Field>

            {planMode === "ai" && (
              <Panel style={{ padding: 20, marginBottom: 20 }}>
                <Field label="Painopiste">
                  {["Voima", "Kestävyys / Metcon", "Taito", "Sekoitus"].map((f) => (
                    <Pill key={f} active={focus === f} onClick={() => setFocus(f)}>
                      {f}
                    </Pill>
                  ))}
                </Field>
                <Field label="Kesto">
                  {[20, 30, 45, 60].map((d) => (
                    <Pill key={d} active={duration === d} onClick={() => setDuration(d)}>
                      {d} min
                    </Pill>
                  ))}
                </Field>
                <Field label="Taso">
                  {["Scaled", "RX"].map((l) => (
                    <Pill key={l} active={level === l} onClick={() => setLevel(l)}>
                      {l}
                    </Pill>
                  ))}
                </Field>
                <Field label="Välineet">
                  {["Ei välineitä", "Kahvakuula/dumbbell", "Täysi varustus"].map((e) => (
                    <Pill key={e} active={equipment === e} onClick={() => setEquipment(e)}>
                      {e}
                    </Pill>
                  ))}
                </Field>
                <button onClick={generateWod} disabled={generating} style={primaryBtn}>
                  {generating ? "LUODAAN…" : "LUO TÄMÄN PÄIVÄN WOD"}
                </button>
                {genError && <div style={{ color: "var(--red)", fontSize: 13, marginTop: 10 }}>{genError}</div>}
              </Panel>
            )}

            {planMode === "ai" && wod && (
              <WodCard wod={wod} onSave={saveWodToLog}>
                <div style={{ fontSize: 11, color: "var(--chalk-dim)", textTransform: "uppercase", marginTop: 18, marginBottom: 8 }}>
                  Palautumisdata (kellosta/sykevyöstä, valinnainen)
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
                  <div style={{ flex: "1 1 130px" }}>
                    <Field label="Keskisyke"><input type="text" value={wodAvgHr} onChange={(e) => setWodAvgHr(e.target.value)} style={inputStyle} /></Field>
                  </div>
                  <div style={{ flex: "1 1 130px" }}>
                    <Field label="Palautuminen"><input type="text" value={wodRecovery} onChange={(e) => setWodRecovery(e.target.value)} style={inputStyle} /></Field>
                  </div>
                  <div style={{ flex: "1 1 100px" }}>
                    <Field label="Uni (h)"><input type="text" value={wodSleepHrs} onChange={(e) => setWodSleepHrs(e.target.value)} style={inputStyle} /></Field>
                  </div>
                </div>
              </WodCard>
            )}

            {planMode === "manual" && (
              <Panel style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, marginBottom: 12 }}>LUO OMA TREENI</div>
                <Field label="Treeni">
                  <textarea
                    value={manualDesc}
                    onChange={(e) => setManualDesc(e.target.value)}
                    rows={6}
                    placeholder={"Kirjoita treeni vapaasti, esim.\n21-15-9\nThruster (42,5/30 kg)\nPull-up"}
                    style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace", resize: "vertical" }}
                  />
                </Field>
                <Field label="Tulos (valinnainen)">
                  <input type="text" value={manualResult} onChange={(e) => setManualResult(e.target.value)} style={inputStyle} />
                </Field>
                <button onClick={saveManualWorkout} disabled={!manualDesc.trim() || manualSaving} style={primaryBtn}>
                  {manualSaving ? "TALLENNETAAN…" : "TALLENNA LOKIIN"}
                </button>
              </Panel>
            )}

            {planMode === "photo" && (
              <Panel style={{ padding: 20, marginBottom: 20 }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, marginBottom: 12 }}>OHJATTU WOD — KUVAA TAULU</div>
                <Field label="Kuva salin liitutaulusta">
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} style={{ color: "var(--chalk-dim)", fontSize: 13 }} />
                </Field>
                {photoPreview && (
                  <div style={{ marginBottom: 14 }}>
                    <img src={photoPreview} alt="Esikatselu" style={{ maxWidth: "100%", borderRadius: 4, border: "1px solid var(--line)", display: "block" }} />
                  </div>
                )}
                <button onClick={interpretPhoto} disabled={!photoImage || photoInterpreting} style={primaryBtn}>
                  {photoInterpreting ? "TULKITAAN…" : "TULKITSE TAULU"}
                </button>
                {photoError && <div style={{ color: "var(--red)", fontSize: 13, marginTop: 10 }}>{photoError}</div>}
              </Panel>
            )}

            {planMode === "photo" && photoWod && (
              <WodCard
                wod={photoWod}
                onSave={savePhotoWodToLog}
                warning={photoWod.epavarma ? "Kuva oli osittain epäselvä — tarkista lukemat ennen tallennusta." : null}
              >
                <div style={{ fontSize: 11, color: "var(--chalk-dim)", textTransform: "uppercase", marginTop: 18, marginBottom: 8 }}>
                  Puuttuuko taulusta jokin? Lisää rivi käsin
                </div>
                <div style={{ marginBottom: 8 }}>
                  {[
                    { key: "alkulammittely", label: "Alkulämmittely" },
                    { key: "voimaosuus", label: "Voimaosuus" },
                    { key: "metcon", label: "Metcon" },
                  ].map((s) => (
                    <Pill key={s.key} active={photoExtraSection === s.key} onClick={() => setPhotoExtraSection(s.key)}>
                      {s.label}
                    </Pill>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <input
                    type="text"
                    value={photoExtraLine}
                    onChange={(e) => setPhotoExtraLine(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPhotoWodLine()}
                    placeholder="esim. 10 devil's press (2x22,5 kg)"
                    style={{ ...inputStyle, flex: "1 1 auto" }}
                  />
                  <button
                    onClick={addPhotoWodLine}
                    disabled={!photoExtraLine.trim()}
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 14,
                      padding: "0 18px",
                      background: "var(--rust)",
                      color: "var(--bg)",
                      border: "none",
                      borderRadius: 3,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    LISÄÄ
                  </button>
                </div>
              </WodCard>
            )}

            <Panel style={{ padding: 20, marginTop: 20 }}>
              <div
                onClick={() => setShowGlossary((v) => !v)}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
              >
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22 }}>CROSSFIT-SANASTO</div>
                <div style={{ color: "var(--chalk-dim)", fontSize: 20, lineHeight: 1 }}>{showGlossary ? "−" : "+"}</div>
              </div>
              {!showGlossary && (
                <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginTop: 6 }}>
                  Uusi CrossFitissä? Tarkista mitä For Time, AMRAP, EMOM ja muut lyhenteet tarkoittavat.
                </div>
              )}
              {showGlossary && (
                <div style={{ marginTop: 14 }}>
                  {wodFormats.map((f) => (
                    <div key={f.term} style={{ marginBottom: 14 }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--rust)", marginBottom: 2 }}>
                        {f.term}
                      </div>
                      <div style={{ fontSize: 13, color: "var(--chalk-dim)", lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        )}

        {loaded && tab === "log" && (
          <div>
            <Panel style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, marginBottom: 12 }}>LISÄÄ MERKINTÄ</div>
              <Field label="Päivämäärä">
                <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Treeni">
                <input type="text" value={logDesc} onChange={(e) => setLogDesc(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Tulos">
                <input type="text" value={logResult} onChange={(e) => setLogResult(e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Muistiinpanot">
                <input type="text" value={logNotes} onChange={(e) => setLogNotes(e.target.value)} style={inputStyle} />
              </Field>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <div style={{ flex: "1 1 130px" }}>
                  <Field label="Keskisyke"><input type="text" value={logAvgHr} onChange={(e) => setLogAvgHr(e.target.value)} style={inputStyle} /></Field>
                </div>
                <div style={{ flex: "1 1 130px" }}>
                  <Field label="Palautuminen"><input type="text" value={logRecovery} onChange={(e) => setLogRecovery(e.target.value)} style={inputStyle} /></Field>
                </div>
                <div style={{ flex: "1 1 100px" }}>
                  <Field label="Uni (h)"><input type="text" value={logSleep} onChange={(e) => setLogSleep(e.target.value)} style={inputStyle} /></Field>
                </div>
              </div>
              <button onClick={addLogEntry} style={{ ...primaryBtn, marginTop: 10 }}>LISÄÄ</button>
            </Panel>

            {workouts.map((w) => (
              <Panel
                key={w.id}
                style={{ padding: 16, marginBottom: 10, cursor: "pointer" }}
                onClick={() => setSelectedWorkout(w)}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--chalk-dim)" }}>
                      {new Date(w.date).toISOString().slice(0, 10)}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {w.desc}
                    </div>
                    {w.result && <div style={{ color: "var(--rust)" }}>Tulos: {w.result}</div>}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEntry(w.id);
                    }}
                    style={{ background: "transparent", border: "none", color: "var(--chalk-dim)", cursor: "pointer", flexShrink: 0 }}
                  >
                    Poista
                  </button>
                </div>
              </Panel>
            ))}
          </div>
        )}

        {loaded && tab === "prs" && (
          <div>
            <Panel style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, marginBottom: 12 }}>LISÄÄ ENNÄTYS</div>
              <Field label="Liikkeen nimi">
                <input
                  type="text"
                  list="pr-movement-list"
                  placeholder="esim. Takakyykky, Fran, Etunosto..."
                  value={prName}
                  onChange={(e) => setPrName(e.target.value)}
                  style={inputStyle}
                />
                <datalist id="pr-movement-list">
                  {Object.keys(prs).map((label) => (
                    <option key={label} value={label} />
                  ))}
                </datalist>
              </Field>
              <Field label="Yksikkö">
                {[
                  { key: "kg", label: "Kilot" },
                  { key: "toistoa", label: "Toistot" },
                  { key: "aika", label: "Aika" },
                ].map((u) => (
                  <Pill key={u.key} active={prUnit === u.key} onClick={() => setPrUnit(u.key)}>
                    {u.label}
                  </Pill>
                ))}
              </Field>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 160px" }}>
                  <Field label="Päivämäärä">
                    <input type="date" value={prDate} onChange={(e) => setPrDate(e.target.value)} style={inputStyle} />
                  </Field>
                </div>
                <div style={{ flex: "1 1 120px" }}>
                  <Field label={prUnit === "kg" ? "Kilomäärä (kg)" : prUnit === "toistoa" ? "Toistot" : "Aika (esim. 3:45)"}>
                    <input
                      type="text"
                      placeholder={prUnit === "kg" ? "esim. 100" : prUnit === "toistoa" ? "esim. 3" : "esim. 3:45"}
                      value={prValue}
                      onChange={(e) => setPrValue(e.target.value)}
                      style={inputStyle}
                    />
                  </Field>
                </div>
              </div>
              <button onClick={addPr} style={primaryBtn}>TALLENNA</button>
              {prError && <div style={{ color: "var(--red)", fontSize: 13, marginTop: 10 }}>{prError}</div>}
            </Panel>

            {Object.keys(prs).length === 0 ? (
              <div style={{ color: "var(--chalk-dim)", fontSize: 14 }}>
                Ei vielä ennätyksiä. Lisää ensimmäinen liike yllä olevalla lomakkeella.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
                {Object.entries(prs).map(([label, data]) => {
                  const sorted = [...data.history].sort((a, b) => (a.date < b.date ? 1 : -1));
                  const latest = sorted[0];
                  return (
                    <Panel key={label} style={{ padding: 16 }}>
                      <div style={{ fontSize: 13, color: "var(--chalk-dim)" }}>{label}</div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: "var(--red)" }}>
                        {latest ? `${latest.value} ${data.unit}` : "—"}
                      </div>
                      {data.history.length > 1 && (
                        <div style={{ height: 50 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.history.map((h, i) => ({ ...h, i, v: Number(h.value) }))}>
                              <Line type="monotone" dataKey="v" stroke="var(--steel)" dot={false} strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      <div style={{ marginTop: 10 }}>
                        {sorted.map((h) => (
                          <PrEntryRow
                            key={h.id}
                            entry={h}
                            unit={data.unit}
                            editing={editingPrId === h.id}
                            onEdit={() => setEditingPrId(h.id)}
                            onCancel={() => setEditingPrId(null)}
                            onSave={(date, value) => savePrEdit(h.id, label, date, value)}
                            onDelete={() => deletePr(h.id)}
                          />
                        ))}
                      </div>
                    </Panel>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {loaded && tab === "report" && (
          <div>
            <Panel style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, marginBottom: 4 }}>KEHITYSRAPORTTI</div>
              <Field label="Tarkastelujakso">
                {[1, 2, 3].map((m) => (
                  <Pill key={m} active={reportRange === m} onClick={() => setReportRange(m)}>
                    {m} kk
                  </Pill>
                ))}
              </Field>
              <button onClick={generateReport} disabled={reportLoading} style={primaryBtn}>
                {reportLoading ? "ANALYSOIDAAN…" : "LUO RAPORTTI"}
              </button>
            </Panel>
            {report && (
              <Panel style={{ padding: 22, background: "var(--bg3)" }}>
                <div style={{ fontSize: 12, color: "var(--chalk-dim)", marginBottom: 12 }}>
                  {report.currentCount} treeniä tarkastelujaksolla (edellisellä {report.previousCount})
                </div>
                {["yhteenveto", "vahvuudet", "huomiot", "suositus"].map((k) => (
                  <div key={k} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, textTransform: "uppercase", color: "var(--rust)" }}>{k}</div>
                    <div style={{ fontSize: 14 }}>{report[k]}</div>
                  </div>
                ))}
              </Panel>
            )}
          </div>
        )}
      </div>

      {selectedWorkout && (
        <div
          onClick={() => setSelectedWorkout(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 50,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560, width: "100%" }}>
            <Panel style={{ padding: 24, background: "var(--bg3)", maxHeight: "80vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--chalk-dim)" }}>
                  {new Date(selectedWorkout.date).toISOString().slice(0, 10)}
                </div>
                <button
                  onClick={() => setSelectedWorkout(null)}
                  style={{ background: "transparent", border: "none", color: "var(--chalk-dim)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}
                >
                  ✕
                </button>
              </div>

              <div style={{ fontSize: 16, marginBottom: 14, whiteSpace: "pre-wrap" }}>{selectedWorkout.desc}</div>

              {selectedWorkout.result && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "var(--chalk-dim)", textTransform: "uppercase" }}>Tulos</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15, color: "var(--rust)" }}>{selectedWorkout.result}</div>
                </div>
              )}

              {selectedWorkout.notes && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "var(--chalk-dim)", textTransform: "uppercase" }}>Muistiinpanot</div>
                  <div style={{ fontSize: 14, fontStyle: "italic", whiteSpace: "pre-wrap" }}>{selectedWorkout.notes}</div>
                </div>
              )}

              {(selectedWorkout.avgHr || selectedWorkout.recovery || selectedWorkout.sleepHrs) && (
                <div>
                  <div style={{ fontSize: 11, color: "var(--chalk-dim)", textTransform: "uppercase", marginBottom: 6 }}>Mittarit</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--steel)", display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {selectedWorkout.avgHr && <span>Keskisyke {selectedWorkout.avgHr}</span>}
                    {selectedWorkout.recovery && <span>Palautuminen {selectedWorkout.recovery}</span>}
                    {selectedWorkout.sleepHrs && <span>Uni {selectedWorkout.sleepHrs}h</span>}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  deleteEntry(selectedWorkout.id);
                  setSelectedWorkout(null);
                }}
                style={{
                  marginTop: 20,
                  background: "transparent",
                  border: "1px solid var(--line)",
                  color: "var(--red)",
                  fontSize: 12,
                  padding: "8px 14px",
                  borderRadius: 3,
                  cursor: "pointer",
                }}
              >
                Poista merkintä
              </button>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}

function PrEntryRow({ entry, unit, editing, onEdit, onCancel, onSave, onDelete }) {
  const [date, setDate] = useState(entry.date);
  const [value, setValue] = useState(entry.value);

  if (editing) {
    return (
      <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center" }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, flex: "1 1 auto" }} />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ ...inputStyle, padding: "6px 8px", fontSize: 12, width: 70, flex: "0 0 auto" }}
        />
        <button
          onClick={() => onSave(date, value)}
          style={{ background: "var(--rust)", border: "none", color: "var(--bg)", fontSize: 12, padding: "6px 10px", borderRadius: 3, cursor: "pointer" }}
        >
          OK
        </button>
        <button
          onClick={onCancel}
          style={{ background: "transparent", border: "1px solid var(--line)", color: "var(--chalk-dim)", fontSize: 12, padding: "6px 10px", borderRadius: 3, cursor: "pointer" }}
        >
          Peru
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
        color: "var(--chalk-dim)",
        marginTop: 6,
      }}
    >
      <span>{entry.date} — {entry.value} {unit}</span>
      <span style={{ display: "flex", gap: 8 }}>
        <button onClick={onEdit} style={{ background: "transparent", border: "none", color: "var(--steel)", cursor: "pointer", fontSize: 12 }}>
          Muokkaa
        </button>
        <button onClick={onDelete} style={{ background: "transparent", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 12 }}>
          Poista
        </button>
      </span>
    </div>
  );
}
