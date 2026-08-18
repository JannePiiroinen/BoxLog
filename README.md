# BoxLog — Vaihe 1

AI-WOD-generaattori, treenilogi ja kehitysraportit CrossFit-urheilijoille.
Tämä on ensimmäinen oikea (ei-artifact) versio: Next.js + Prisma + Postgres.

## 1. Paikallinen kehitys (VS Code)

### Esivaatimukset
- Node.js 18+ asennettuna
- Ilmainen Postgres-tietokanta: [neon.tech](https://neon.tech) tai [supabase.com](https://supabase.com) — molemmat
  antavat ilmaisen `DATABASE_URL`-yhteysosoitteen sekunneissa, ei tarvitse asentaa Postgresia koneelle
- Anthropic API -avain: [console.anthropic.com](https://console.anthropic.com)

### Asennus
```bash
npm install
cp .env.example .env
# täytä .env: DATABASE_URL ja ANTHROPIC_API_KEY
npx prisma db push   # luo taulut tietokantaan schema.prisma:n mukaan
npm run dev
```

Avaa [http://localhost:3000](http://localhost:3000) — tämä on se "reaaliaikainen testiympäristö":
Next.js päivittää sivun automaattisesti aina kun tallennat tiedoston VS Codessa (hot reload).

### Tietokannan sisällön tarkastelu
```bash
npx prisma studio
```
Avaa selaimeen visuaalisen näkymän tietokannan riveihin — hyödyllinen debuggaukseen.

## 2. Jaettava live-esikatselu (esim. salin omistajille näytettäväksi)

Kun haluat jakaa linkin jonka voi avata kuka tahansa (ei vain omalla koneellasi ajettuna):

1. Luo GitHub-repo ja pushaa tämä projekti sinne
2. Mene [vercel.com](https://vercel.com), kirjaudu GitHub-tunnuksilla, "Import Project" ja valitse repo
3. Lisää samat ympäristömuuttujat (`DATABASE_URL`, `ANTHROPIC_API_KEY`) Vercelin Settings → Environment Variables -kohtaan
4. Deploy — saat julkisen `https://boxlog-xxxx.vercel.app`-osoitteen

Tämän jälkeen **jokainen git push päivittää live-version automaattisesti** muutaman sekunnin viiveellä —
tämä on käytännössä "reaaliaikainen" jaettava ympäristö ilman että sinun tarvitsee pyörittää omaa palvelinta.
Vercelin ilmainen taso riittää pilottivaiheeseen mainiosti.

## 3. Rakenne

```
src/app/page.js           - koko käyttöliittymä (yksi sivu, kolme välilehteä)
src/app/api/wod/          - AI-WOD-generaattori (kutsuu Anthropic APIa palvelimella)
src/app/api/workouts/     - treenilogi (GET/POST/DELETE)
src/app/api/prs/          - ennätykset
src/app/api/report/       - AI-kehitysraportti
prisma/schema.prisma      - tietokantamalli
```

## 4. Puuttuu vielä (seuraavat vaiheet)

- **Kirjautuminen** — nyt kaikki data menee yhdelle kovakoodatulle testikäyttäjälle
  (`src/lib/currentUser.js`). Seuraava askel: NextAuth.js tai Clerk.
- **Salikohtaisuus** — Gym-malli ja jäsenyydet, kun laajennetaan useammalle salille
- **Maksut/tilaus** — Stripe, kun tuote on myyntikunnossa
