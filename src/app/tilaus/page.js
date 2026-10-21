"use client";

import { useState } from "react";

export default function TilausPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function subscribe() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Tuntematon virhe");
      window.location.href = data.url;
    } catch (e) {
      setError("Tilauksen aloitus epäonnistui. Yritä uudelleen.");
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 380, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 42 }}>
          BOKSI<span style={{ color: "var(--rust)" }}>LOKI</span>
        </div>
        <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginBottom: 24 }}>
          WOD-generaattori, lokikirja, ennätykset sekä raportointi treenaamisen tueksi.
        </div>
        <div style={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 4, padding: 28 }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, marginBottom: 8 }}>TILAUS</div>
          <div style={{ color: "var(--chalk-dim)", fontSize: 13, marginBottom: 20 }}>
            AI-toiminnot (WOD-generaattori, taulun tulkinta ja kehitysraportit) vaativat aktiivisen tilauksen.
          </div>
          <button
            onClick={subscribe}
            disabled={loading}
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 18,
              letterSpacing: "0.05em",
              padding: "9px 20px",
              width: "100%",
              background: "var(--rust)",
              color: "var(--bg)",
              border: "none",
              borderRadius: 3,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "ODOTA…" : "Tilaa BoksiLoki - 10€/kk"}
          </button>
          {error && <div style={{ color: "var(--red)", fontSize: 13, marginTop: 12 }}>{error}</div>}
        </div>
        <div style={{ marginTop: 16 }}>
          <a href="/" style={{ color: "var(--chalk-dim)", fontSize: 12 }}>
            &larr; Takaisin
          </a>
        </div>
      </div>
    </div>
  );
}
