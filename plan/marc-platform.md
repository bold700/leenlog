# Werkbon-platform Marc Hezel — concept (18 aug 2026)

Doel: het uitzendbureau van Marc van Excel/mail/WhatsApp naar één web-app: uren binnenkrijgen, accorderen, werkbon en factuur eruit. Marcs eigen woorden: "ik wil de uren die binnenkomen kunnen accorderen en een factuur sturen naar de klant, eventueel met werkbon."

## Rollen

| Rol | Apparaat | Kerntaak |
|---|---|---|
| **Marc (bureau/admin)** | desktop web | uren accorderen, werkbonnen en facturen sturen, overzicht houden |
| **Uitzendkracht** | mobiel web | uren indienen per dienst/week, status zien |
| **Inlener (klant)** | e-mail + mobiel web (geen account nodig) | werkbon bekijken/akkoorderen via magic link, factuur ontvangen |

## Kernflows

1. **Uren indienen (uitzendkracht, mobiel):** week openen → per dag begin/eind/pauze of totaal → optioneel opmerking → indienen → status "wacht op akkoord".
2. **Accorderen (Marc):** inbox met ingediende urenregels, gegroepeerd per klant/week → regel openen → akkoord met één tik, of afwijzen met reden (gaat terug naar uitzendkracht) → geaccordeerde regels bundelen tot werkbon.
3. **Werkbon → klant:** werkbon-PDF (bureau-logo, klant, periode, uitzendkracht, uren, tarief optioneel) → mail met magic link → klant tekent digitaal akkoord (of automatisch akkoord na X dagen, instelbaar).
4. **Factuur:** geaccordeerde werkbon(nen) → factuur genereren (uurtarief × uren, btw, kenmerk) → versturen als PDF óf doorzetten naar boekhoudpakket (Moneybird / e-Boekhouden / WeFact — **welk pakket Marc gebruikt is de openstaande vraag**) → status betaald/open bijhouden.
5. **Stamdata:** klanten (inleners), uitzendkrachten, plaatsingen (wie werkt waar tegen welk tarief, CAO-toeslagen later).

## Schermen

### Web (Marc)
1. **Dashboard** — te accorderen (badge), openstaande facturen (€), deze week uren, omzet maand; snelacties
2. **Uren accorderen** — lijst/tabel met filters (klant, week, status), bulk-akkoord, regel-detail met afwijzen+reden
3. **Werkbonnen** — lijst + status (concept/verstuurd/akkoord), preview, versturen
4. **Facturen** — lijst + status (concept/verstuurd/betaald/te laat), aanmaken vanuit werkbon, koppeling boekhouding
5. **Klanten & uitzendkrachten** — stamdata + plaatsingen met tarieven
6. **Instellingen** — bureau-gegevens/logo, btw, betaaltermijn, koppeling boekhoudpakket, auto-akkoord-termijn

### Mobiel (uitzendkracht)
7. **Mijn week** — dagen invullen, indienen, status per regel
8. **Historie** — eerdere weken + statussen

### Zonder account (inlener)
9. **Werkbon-akkoord-pagina** (magic link) — werkbon bekijken, akkoord/afwijzen + handtekening

## Datamodel (kern)

Bureau → Klanten → Plaatsingen (uitzendkracht × klant × uurtarief × periode) → Urenregels (datum, uren, status: ingediend/akkoord/afgewezen) → Werkbonnen (bundel urenregels, status) → Facturen (bundel werkbonnen, status). Gebruikers: admin / uitzendkracht.

## MVP v1 (2–3 weken bouw, okt) vs later

**v1:** flows 1 t/m 4 met één bureau, handmatige klant/kracht-invoer, werkbon- en factuur-PDF, mail met magic link, één boekhoudkoppeling (het pakket dat Marc al gebruikt) óf alleen PDF + handmatige boeking.
**Later:** CAO-toeslagen/ORT, automatische herinneringen, betalingen (Mollie), meerdere admins, rapportages, export accountant.

**Prijskader (uit plan):** v1 vast €4.000–6.000 + €99/mnd beheer; 50% aanbetaling.

## Design

- **Material 3** als component-basis (Figma M3 design kit), NL-taal
- Vormtaal overnemen van de Van As personal training-app (Figma-link nog nodig van Kenny)
- Werktitel: **"Bonnen"** (werktitel, Marc mag kiezen)
- Figma-opzet: pagina 1 flows, pagina 2 web-schermen, pagina 3 mobiel
