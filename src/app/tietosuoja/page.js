export const metadata = {
  title: "Tietosuoja — BoksiLoki",
};

const sections = [
  {
    title: "1. Rekisterinpitäjä",
    paragraphs: [
      { todo: true, text: "Toiminimi Janne Piiroinen" },
      { todo: true, text: "Y-tunnus: 3649483-1" },
      { todo: true, text: "Yhteystiedot: janne.piiroinen1989@gmail.com" },
    ],
  },
  {
    title: "2. Mitä tietoja keräämme",
    blocks: [
      {
        heading: "Treenidata jonka syötät itse",
        bullets: ["Treenien kuvaukset, tulokset, päivämäärät", "Henkilökohtaiset ennätykset (liikkeen nimi, päivämäärä, kilomäärä)"],
      },
      {
        heading: "Valinnaiset terveyteen liittyvät mittarit (syötät nämä itse, eivät ole pakollisia)",
        bullets: ["Aamusyke, treenin aikainen keskisyke", "Sykevälivaihtelu (HRV)", "Unen kesto", "Koettu rasitustuntemus (RPE)"],
      },
    ],
    paragraphs: [
      {
        text:
          "Näitä mittareita käsitellään GDPR:n tarkoittamana erityisenä henkilötietoryhmänä (terveystieto). Käsittelemme niitä vain, jos syötät ne itse vapaaehtoisesti — käsittelyn peruste on tällöin nimenomainen suostumuksesi.",
      },
      {
        text:
          "Suostumus kysytään erillisellä valintaruudulla aina kun syötät terveysmittareita, etkä voi tallentaa niitä ilman rastitusta. Koska sovelluksessa ei tällä hetkellä ole kirjautumista, suostumus ja sen antopäivä tallennetaan paikallisesti omaan selaimeesi — et voi antaa suostumusta toisen puolesta, eikä se siirry laitteiden välillä. Voit peruuttaa suostumuksen milloin tahansa poistamalla rastin.",
      },
    ],
  },
  {
    title: "3. Mihin tietoja käytetään",
    bullets: [
      "Treenien ja kehityksen seurantaan omassa käytössäsi",
      "Tekoälypohjaisten treeniehdotusten ja kehitysraporttien tuottamiseen syöttämäsi datan pohjalta",
      "Emme käytä tietojasi mainontaan emmekä myy niitä kolmansille osapuolille",
    ],
  },
  {
    title: "4. Kenelle tietoja luovutetaan (alihankkijat)",
    paragraphs: [
      {
        text:
          "Käytämme seuraavia palveluntarjoajia tietojen käsittelyssä. Molemmilla on oma tietosuojakäytäntönsä, ja niiden kanssa on sovittu tietojenkäsittelystä (DPA):",
      },
    ],
    bullets: [
      "Neon (EU, Frankfurt) — tietokannan hosting, jossa treeni- ja käyttäjädata säilytetään salattuna. Myös sovelluksen palvelinfunktiot (Vercel) ajetaan Frankfurtissa.",
      "Anthropic (Yhdysvallat) — käsittelee syöttämääsi treenidataa tuottaakseen tekoälypohjaisia treeniehdotuksia ja raportteja. Dataa ei käytetä Anthropicin mallien kouluttamiseen.",
    ],
    paragraphsAfter: [
      {
        text:
          "Tietokanta ja sen sisältämä data pysyvät EU/ETA-alueella (Neon, Frankfurt). Ainoa EU:n ulkopuolelle siirtyvä tietosisältö on syöttämäsi treenidata, joka lähetetään Anthropicille (Yhdysvallat) tekoälypohjaisten treeniehdotusten ja raporttien tuottamista varten — tämä tiedonsiirto perustuu EU:n vakiosopimuslausekkeisiin (Standard Contractual Clauses, 2021).",
      },
      {
        todo: true,
        text:
          "Tarkista oman tilisi/sopimustasosi kohdalta suoraan Anthropicin ajantasainen DPA-dokumentti ennen julkaisua tuotantokäyttöön, erityisesti jos käyttäjämäärä kasvaa tai käsittelet maksavia asiakkaita.",
      },
    ],
  },
  {
    title: "5. Säilytysaika",
    paragraphs: [
      { text: "Tietoja säilytetään niin kauan kuin tilisi on aktiivinen. Voit pyytää tietojesi poistamisen milloin tahansa (katso kohta 7)." },
    ],
  },
  {
    title: "6. Tietoturva",
    bullets: ["Kaikki tiedonsiirto on salattu (HTTPS/TLS)", "Tietokanta on salattu levossa", "Pääsy tuotantojärjestelmään on rajattu"],
  },
  {
    title: "7. Oikeutesi",
    paragraphs: [{ text: "Sinulla on oikeus:" }],
    bullets: [
      "Tarkastaa mitä tietoja sinusta on tallennettu",
      "Pyytää tietojen korjaamista",
      "Pyytää tietojesi poistamista kokonaan",
      "Pyytää tietojesi siirtämistä toiseen palveluun (tietojen siirrettävyys)",
      "Peruuttaa antamasi suostumus terveysmittareiden käsittelyyn milloin tahansa — tämä ei vaikuta muun datasi käsittelyyn",
      "Tehdä valitus tietosuojavaltuutetun toimistolle (tietosuoja.fi), jos koet että tietojasi on käsitelty virheellisesti",
    ],
    paragraphsAfter: [{ todo: true, text: "Näiden oikeuksien käyttämiseksi, ota yhteyttä: janne.piiroinen1989@gmail.com" }],
  },
  {
    title: "8. Muutokset tähän selosteeseen",
    paragraphs: [{ text: "Jos päivitämme tätä selostetta merkittävästi, ilmoitamme siitä sovelluksen kautta." }],
  },
];

function Bullets({ items }) {
  return (
    <div style={{ marginTop: 8 }}>
      {items.map((b, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, paddingLeft: 4 }}>
          <span style={{ color: "var(--chalk-dim)" }}>•</span>
          <span style={{ color: "var(--chalk)" }}>{b}</span>
        </div>
      ))}
    </div>
  );
}

function Paragraphs({ items }) {
  return (
    <>
      {items.map((p, i) => (
        <div
          key={i}
          style={{
            marginTop: 8,
            fontSize: 14,
            lineHeight: 1.6,
            color: p.todo ? "var(--rust)" : "var(--chalk)",
            fontFamily: p.todo ? "'JetBrains Mono', monospace" : "inherit",
          }}
        >
          {p.text}
        </div>
      ))}
    </>
  );
}

export default function TietosuojaPage() {
  return (
    <div style={{ minHeight: "100vh", padding: "24px 16px 60px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 22 }}>
          <a href="/" style={{ color: "var(--chalk-dim)", fontSize: 12 }}>
            &larr; Takaisin
          </a>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, marginTop: 8 }}>
            TIETOSUOJA<span style={{ color: "var(--rust)" }}>SELOSTE</span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--chalk-dim)", marginTop: 4 }}>
            Päivitetty: 22.10.2026
          </div>
        </div>

        <div style={{ background: "var(--bg2)", border: "1px solid var(--line)", borderRadius: 4, padding: 28 }}>
          {sections.map((s, i) => (
            <div key={s.title} style={{ marginBottom: i === sections.length - 1 ? 0 : 26 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: "var(--rust)", marginBottom: 4 }}>{s.title}</div>
              {s.paragraphs && <Paragraphs items={s.paragraphs} />}
              {s.blocks &&
                s.blocks.map((b) => (
                  <div key={b.heading} style={{ marginTop: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--chalk)" }}>{b.heading}</div>
                    <Bullets items={b.bullets} />
                  </div>
                ))}
              {s.bullets && <Bullets items={s.bullets} />}
              {s.paragraphsAfter && <Paragraphs items={s.paragraphsAfter} />}
            </div>
          ))}
        </div>

        <div style={{ fontSize: 11, color: "var(--chalk-dim)", marginTop: 16, fontStyle: "italic" }}>
          Tämä on luonnos, ei lakineuvontaa. Rust-värillä merkityt kohdat vaativat vielä täydennystä ennen julkaisua.
        </div>
      </div>
    </div>
  );
}
