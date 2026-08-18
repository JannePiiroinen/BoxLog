"use client";

import { useEffect, useState, useCallback } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

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

              {(selectedWorkout.restHr || selectedWorkout.avgHr || selectedWorkout.recovery || selectedWorkout.sleepHrs || selectedWorkout.rpe) && (
                <div>
                  <div style={{ fontSize: 11, color: "var(--chalk-dim)", textTransform: "uppercase", marginBottom: 6 }}>Mittarit</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--steel)", display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {selectedWorkout.restHr && <span>Aamusyke {selectedWorkout.restHr}</span>}
                    {selectedWorkout.avgHr && <span>Keskisyke {selectedWorkout.avgHr}</span>}
                    {selectedWorkout.recovery && <span>Palautuminen {selectedWorkout.recovery}</span>}
                    {selectedWorkout.sleepHrs && <span>Uni {selectedWorkout.sleepHrs}h</span>}
                    {selectedWorkout.rpe && <span>RPE {selectedWorkout.rpe}</span>}
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
