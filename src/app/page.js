"use client";

import { useEffect, useState, useCallback } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const DEFAULT_LIFTS = [
  { key: "etunosto", label: "Etunosto (deadlift)", unit: "kg" },
  { key: "takakyykky", label: "Takakyykky", unit: "kg" },
  { key: "penkki", label: "Penkkipunnerus", unit: "kg" },
  { key: "tyonto", label: "Työntö (push press)", unit: "kg" },
  { key: "tempaus", label: "Tempaus", unit: "kg" },
  { key: "rinnalleveto", label: "Rinnalleveto + työntö", unit: "kg" },
];

const DEFAULT_BENCHMARKS = [
  { key: "fran", label: "Fran", unit: "aika" },
  { key: "grace", label: "Grace", unit: "aika" },
  { key: "helen", label: "Helen", unit: "aika" },
  { key: "cindy", label: "Cindy", unit: "kierrokset" },
  { key: "murph", label: "Murph", unit: "aika" },
  { key: "diane", label: "Diane", unit: "aika" },
];

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

function Panel({ children, style }) {
  return <div style={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 4, ...style }}>{children}</div>;
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

  const [focus, setFocus] = useState("Sekoitus");
  const [duration, setDuration] = useState(45);
  const [level, setLevel] = useState("RX");
  const [equipment, setEquipment] = useState("Täysi varustus");
  const [wod, setWod] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logDesc, setLogDesc] = useState("");
  const [logResult, setLogResult] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [logRestHr, setLogRestHr] = useState("");
  const [logAvgHr, setLogAvgHr] = useState("");
  const [logRecovery, setLogRecovery] = useState("");
  const [logSleep, setLogSleep] = useState("");
  const [logRpe, setLogRpe] = useState("");

  const [reportRange, setReportRange] = useState(2);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

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

  async function saveWodToLog() {
    if (!wod) return;
    const desc = `${wod.nimi} — ${wod.metcon?.muoto || ""}: ${wod.metcon?.liikkeet || ""}`;
    await fetch("/api/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: logDate, desc, notes: wod.coach_cue || "" }),
    });
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
        restHr: logRestHr,
        avgHr: logAvgHr,
        recovery: logRecovery,
        sleepHrs: logSleep,
        rpe: logRpe,
      }),
    });
    setLogDesc("");
    setLogResult("");
    setLogNotes("");
    setLogRestHr("");
    setLogAvgHr("");
    setLogRecovery("");
    setLogSleep("");
    setLogRpe("");
    await loadAll();
  }

  async function deleteEntry(id) {
    await fetch(`/api/workouts?id=${id}`, { method: "DELETE" });
    await loadAll();
  }

  async function updatePr(key, label, unit, value) {
    if (!value) return;
    await fetch("/api/prs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, label, unit, value }),
    });
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

  const allRecords = [...DEFAULT_LIFTS, ...DEFAULT_BENCHMARKS];

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
              {{ plan: "OHJELMA", log: "LOKI", prs: "ENNÄTYKSET", report: "RAPORTTI" }[t]}
            </button>
          ))}
        </div>

        {!loaded && <div style={{ color: "var(--chalk-dim)" }}>Ladataan…</div>}

        {loaded && tab === "plan" && (
          <div>
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

            {wod && (
              <Panel style={{ padding: 24, background: "var(--bg3)" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, borderBottom: "2px solid var(--rust)", display: "inline-block", marginBottom: 16 }}>
                  {wod.nimi}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--chalk-dim)", textTransform: "uppercase" }}>Alkulämmittely</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>{wod.alkulammittely}</div>
                </div>
                {wod.voimaosuus && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: "var(--chalk-dim)", textTransform: "uppercase" }}>Voimaosuus</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>{wod.voimaosuus}</div>
                  </div>
                )}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--rust)", textTransform: "uppercase" }}>
                    Metcon — {wod.metcon?.muoto} {wod.metcon?.aikaraja ? `(${wod.metcon.aikaraja})` : ""}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 15 }}>{wod.metcon?.liikkeet}</div>
                </div>
                {wod.coach_cue && <div style={{ fontSize: 13, color: "var(--steel)", fontStyle: "italic" }}>Vinkki: {wod.coach_cue}</div>}
                <button onClick={saveWodToLog} style={{ ...primaryBtn, marginTop: 18, background: "transparent", border: "1px solid var(--chalk)", color: "var(--chalk)" }}>
                  Tallenna lokiin
                </button>
              </Panel>
            )}
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
                  <Field label="Aamusyke"><input type="text" value={logRestHr} onChange={(e) => setLogRestHr(e.target.value)} style={inputStyle} /></Field>
                </div>
                <div style={{ flex: "1 1 130px" }}>
                  <Field label="Keskisyke"><input type="text" value={logAvgHr} onChange={(e) => setLogAvgHr(e.target.value)} style={inputStyle} /></Field>
                </div>
                <div style={{ flex: "1 1 130px" }}>
                  <Field label="Palautuminen"><input type="text" value={logRecovery} onChange={(e) => setLogRecovery(e.target.value)} style={inputStyle} /></Field>
                </div>
                <div style={{ flex: "1 1 100px" }}>
                  <Field label="Uni (h)"><input type="text" value={logSleep} onChange={(e) => setLogSleep(e.target.value)} style={inputStyle} /></Field>
                </div>
                <div style={{ flex: "1 1 100px" }}>
                  <Field label="RPE"><input type="text" value={logRpe} onChange={(e) => setLogRpe(e.target.value)} style={inputStyle} /></Field>
                </div>
              </div>
              <button onClick={addLogEntry} style={{ ...primaryBtn, marginTop: 10 }}>LISÄÄ</button>
            </Panel>

            {workouts.map((w) => (
              <Panel key={w.id} style={{ padding: 16, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--chalk-dim)" }}>
                      {new Date(w.date).toISOString().slice(0, 10)}
                    </div>
                    <div style={{ fontSize: 14 }}>{w.desc}</div>
                    {w.result && <div style={{ color: "var(--rust)" }}>Tulos: {w.result}</div>}
                  </div>
                  <button onClick={() => deleteEntry(w.id)} style={{ background: "transparent", border: "none", color: "var(--chalk-dim)", cursor: "pointer" }}>
                    Poista
                  </button>
                </div>
              </Panel>
            ))}
          </div>
        )}

        {loaded && tab === "prs" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
            {allRecords.map((rec) => {
              const data = prs[rec.key];
              const latest = data?.history?.length ? data.history[data.history.length - 1] : null;
              return (
                <Panel key={rec.key} style={{ padding: 16 }}>
                  <div style={{ fontSize: 13, color: "var(--chalk-dim)" }}>{rec.label}</div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, color: "var(--red)" }}>
                    {latest ? latest.value : "—"}
                  </div>
                  {data?.history?.length > 1 && (
                    <div style={{ height: 50 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.history.map((h, i) => ({ ...h, i }))}>
                          <Line type="monotone" dataKey="i" stroke="var(--steel)" dot={false} strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  <PrInput onSubmit={(val) => updatePr(rec.key, rec.label, rec.unit, val)} />
                </Panel>
              );
            })}
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
    </div>
  );
}

function PrInput({ onSubmit }) {
  const [val, setVal] = useState("");
  return (
    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
      <input type="text" value={val} onChange={(e) => setVal(e.target.value)} style={{ ...inputStyle, padding: "6px 8px", fontSize: 12 }} />
      <button
        onClick={() => {
          if (val.trim()) {
            onSubmit(val.trim());
            setVal("");
          }
        }}
        style={{ background: "var(--rust)", border: "none", color: "var(--bg)", fontSize: 12, padding: "6px 10px", borderRadius: 3, cursor: "pointer" }}
      >
        OK
      </button>
    </div>
  );
}
