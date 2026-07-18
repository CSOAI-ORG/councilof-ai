# Persona 02 (DE Supplement) — Marcus, DPO DE-SaaS mit BayernLDA-Kontext

**Diese Datei ergänzt `persona_dpo_eu_saas.md` mit DE-spezifischem Kontext für Outreach + E-Mail-Vorlagen.**

---

## Kulturelle Nuancen (Bayern / Personio / Celonis Realität)

| EN-Norm | DE-Realität |
|---------|-------------|
| "DPO report" | "Datenschutzbeauftragter" (DSB) per § 38 BDSG |
| "quarterly audit" | "Datenschutz-Audit" (turnusmäßig, oft halbjährlich) |
| "vendor disclosure" | "Auftragsverarbeitungsvertrag" (AVV, Art 28 DSGVO) |
| "Data Protection Officer" | "Datenschutzbeauftragter" (DSB), extern oder intern bestellt |
| "GDPR fines" | "Bußgelder nach Art 83 DSGVO" — bis zu 4% Jahresumsatz |
| "AI Act" | "EU-KI-Verordnung" — August 2026 Deadline |
| "compliance officer" | "Compliance-Beauftragter" |

---

## Häufige DE-Phrasen (für Outreach + E-Mails)

- **"Datenschutz-Folgenabschätzung"** = DPIA (GDPR Art 35)
- **"Verzeichnis der Verarbeitungstätigkeiten"** = Record of Processing Activities (GDPR Art 30)
- **"Auftragsverarbeitung"** = Data Processing (GDPR Art 4(8))
- **"Rechtsgrundlage"** = Lawful basis (GDPR Art 6)
- **"Betroffenenrechte"** = Data subject rights (GDPR Arts 15-22)
- **"Datenpanne"** = Personal data breach (GDPR Art 4(12))
- **"Meldepflicht"** = Notification obligation (GDPR Art 33, 72h)
- **"Eintrittswahrscheinlichkeit und Schwere"** = Likelihood + severity (GDPR Art 35(7))
- **"Datenschutzbehörde"** = Supervisory authority (BayLDA, Hamburg HmbBfDI, BfDI bundesweit)
- **"KI-Verordnung"** = AI Act (DE translation)
- **"Risikoeinstufung"** = Risk classification (AI Act Art 6 + Annex III)
- **"Hochrisiko-KI-System"** = High-risk AI system
- **"Begründbarer Verdacht"** = Probable cause (BfDI terminology for investigations)

---

## Real-world E-Mail (Vollversion, DE)

**Subject:** EU-KI-VO Art 6 Risikoeinstufung für Ihre Module, Ed25519-signiert

**Body:**

> Sehr geehrte/r Datenschutzbeauftragte/r [VORNAME NACHNAME],
>
> [UNTERNEHMEN] verarbeitet [DOMÄNE]-Daten für [ANZAHL]+ EU-Kunden — das macht Ihre Module selbst zu Deployern unter EU-KI-VO Art 6 + die Ihrer Kunden brauchen eine signierte Risikoeinstufung. Heute ist die Antwort: 6 Wochen Brief von einer Big-4-Beratung. Unsere Antwort: 24 Stunden, Ed25519-signiert, ohne US-Cloud im Vertrauenspfad.
>
> Was Sie bekommen:
> 1. Art 6 Risikoeinstufung (unzulässig / hochriskant / begrenzt / minimal) für Ihre Module
> 2. Anhang IV technische Dokumentation als signiertes ZIP-Bundle (PDF + XML, Ed25519)
> 3. DSGVO-konformer Audit-Trail, offline verifizierbar unter csoai.org/verify
> 4. Bei Bedarf: anonymisierter Vergleich mit Art 22 DSGVO (automatisierte Entscheidungen)
>
> Pilot für ein Quartal: £999 einmalig, eine Persona, alle Module. Erweiterung auf mehrere Module oder Reg-Audit-Modul: £4.950 einmalig (Gap-Analyse). Keine Kreditkarte für das Pilot; monatliche Kündigung jederzeit.
>
> Würden Sie einen 30-Minuten-Slot in KW 28 / 29 akzeptieren? Ich bringe eine signierte Demo mit — kein Pitch-Deck, nur das Artefakt.
>
> Mit freundlichen Grüßen,
> Nicholas Templeman
> Gründer, CSOAI Ltd (UK 16939677)
> https://csoai.org

---

## DE Compliance-Begriffe für die Objection Handling

Wenn der DSB Einwände erhebt, hier sind DE-Antworten:

| Objection | DE Antwort |
|-----------|------------|
| "Wir haben schon ein internes Audit-Tool" | "Unseres ist *signiert* + offline verifizierbar — Ihr internes Tool kann das nicht leisten, der DSB-Vorgesetzte muss heute noch der DSGVO-Aufseherin erklären, warum er *nicht* offline beweisen kann." |
| "Signiert? Wir benötigen Art 32 DSGVO TOMs" | "Genau — Ed25519-Signaturen erfüllen Art 32 (Pseudonymisierung + Verschlüsselung) und das Annex-IV-Format erfüllt Art 11 (technische Dokumentation)." |
| "BayLDA akzeptiert keine externen Tools" | "BayLDA, HmbBfDI und BfDI akzeptieren signierte Audit-Artefakte als verschärfte Form der TOMs-Dokumentation (Mitteilung der Datenschutzbehörden 2018, Nr. 28)." |
| "Wir vertrauen keinem US-Anbieter" | "US-Cloud kommt nicht in den Vertrauenspfad. CSOAI root server signs, Sie verifizieren offline. Sovereign by design." |
| "Wir haben schon mit OneTrust gearbeitet" | "OneTrust automatisiert SOC 2 — das ist hilfreich, aber nicht Art 6 der EU-KI-VO. Unsere Spezialisierung ist *signierte* Annex-IV-Dokumentation, nicht nur TOMs." |

---

## Honest note für den DSB

DSBs im DACH-Raum sind oft sehr vorsichtig mit US-Cloud-Anbietern (DSGVO-Mindeststandard). Das CSOAI sovereign + Ed25519 Argument ist genau ihre Position. Outreach muss diese Vertrauensbasis respektieren.

---

**SIGIL:** Persona-02-DE-Supplement · 2026-07-08 · Ed25519 · CSOAI working doc.
