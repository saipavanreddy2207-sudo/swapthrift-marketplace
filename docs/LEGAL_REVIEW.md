# Rechtliche Prüfung vor dem Launch

SwapThrift enthält funktionsfähige Rechtsseiten unter `/rechtliches/...`. Die Texte sind **strukturelle Entwürfe** und wurden nicht von einer Rechtsanwaltskanzlei geprüft. Vor einem kommerziellen oder öffentlichen Betrieb in Deutschland ist eine qualified legal review zwingend erforderlich.

## Zu prüfende Unterlagen

| Seite | Pfad | Wichtigste Prüfpunkte |
|---|---|---|
| Impressum | `/rechtliches/impressum` | Ladungsfähige Anschrift, Vertretungsberechtigte, Registergericht, Umsatzsteuer-ID, Kontakt |
| Datenschutz | `/rechtliches/datenschutz` | Verzeichnis der Verarbeitungstätigkeiten, Auftragsverarbeitung (MongoDB/Cloudinary/SMTP/Stripe), Speicherfristen, Betroffenenrechte |
| AGB | `/rechtliches/agb` | Rolle der Plattform als Vermittler, Vertragsschluss zwischen Nutzer:innen, Haftung, Nutzerpflichten |
| Widerrufsbelehrung | `/rechtliches/widerrufsbelehrung` | Anwendbarkeit bei Privatverkäufen, Muster-Widerrufsformular, Ausnahmen |
| Cookies | `/rechtliches/cookies` | TTDSG/DSGVO-Einwilligung, technisch notwendige Speicherung, Analyse/Tracking |
| Community-Richtlinien | `/rechtliches/community-richtlinien` | Moderation, Sanktionen, Meldewege |
| Marktplatzregeln | `/rechtliches/marktplatzregeln` | Verbotene Artikel, Pflichten, sichere Übergabe |

## Technische Hinweise

- Die Plattform erhebt beim Registrieren ausdrückliche Zustimmungen zu AGB und Datenschutz (`gdprConsent` im User-Modell, inklusive Zeitstempel).
- Der Demo-Checkout erhebt keine Zahlungsdaten und löst keine Zahlung aus. Es wird keine Zahlung als erfolgreich dargestellt.
- Stripe darf ausschließlich im Sandbox-/Testmodus verwendet werden. Ein Live-Key darf in diesem Projekt nicht eingesetzt werden.
- Vor Produktivbetrieb müssen SMTP, Cloudinary und Stripe mit eigenen Konten und Umgebungsvariablen konfiguriert werden.
- Löschung von Konten anonymisiert personenbezogene Daten; buchhaltungsrelevante Bestelldaten bleiben erhalten. Die Aufbewahrungsfristen sind mit der Rechtsberatung abzustimmen.

> Diese Datei ersetzt keine Rechtsberatung. Sie dokumentiert nur, welche Punkte vor dem Launch geprüft werden müssen.
