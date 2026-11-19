# Testing & Verifikation

## Automatische Tests

Backend-Tests liegen in `backend/tests/` und laufen mit Node's integriertem Test-Runner:

```powershell
cd C:\Projects\SwapThrift\backend
npm test
```

**Ergebnis der Schlussprüfung: 17/17 Tests bestanden.**

Abgedeckt:

- Zod-Validierung (Registrierung, Login, Produkt, Adresse, Checkout, Nachrichten, Bewertungen, Admin)
- Betrugs-Score-Heuristik
- Versandkosten- und Bestellsummenberechnung
- Bestellberechtigungen und erlaubte Statuswechsel
- Pfadsichere lokale Upload-PublicIds und absolute `API_PUBLIC_URL`-URLs
- Deutsche Slugs

Zusätzlich:

```powershell
npm audit --omit=dev
```

**Ergebnis: 0 Schwachstellen in Produktionsabhängigkeiten.**

Frontend-Prüfung:

```powershell
cd C:\Projects\SwapThrift\frontend
npm run lint
npm run build
```

**Ergebnis: Lint ohne Fehler/Warnungen, Produktions-Build erfolgreich.**

---

## Live-Integrationstest (MongoDB Atlas)

Gegen eine echte Backend-Instanz mit MongoDB Atlas und lokalem Upload-Fallback wurde ein 30-Punkte-End-to-End-Skript ausgeführt. Alle Punkte bestanden:

| Bereich | Geprüfte Abläufe |
|---|---|
| Infrastruktur | Health, Kategorien aus der Datenbank |
| Authentifizierung | Zwei Konten registrieren, beide anmelden |
| Inserate | Produkt mit echtem Bild-Upload anlegen, Bild abrufen, Suche nach Titel |
| Favoriten | Hinzufügen und listen |
| Nachrichten | Unterhaltung anlegen, Nachricht senden, als Verkäufer lesen |
| Adressen | Lieferadresse anlegen |
| Checkout | Demo-Bestellung anlegen, ausdrücklich `mode: demo`, kein Paid-Status, kein Client-Secret |
| Bestellungen | Käufer- und Verkäuferliste, Statuswechsel `processing → shipped → delivered` |
| Bewertungen | Bewertung nach Lieferung anlegen, öffentliche Bewertungsliste |
| Benachrichtigungen | Liste und „alle gelesen“ |
| Admin | Login, Statistik, Meldung anlegen/auflisten/auflösen |
| Zugriffsschutz | Nicht-Admin erhält 403 |
| Aufräumen | Produkt und Testkonten löschen |

---

## Browser-Smoke-Test

Im echten Browser (Vite-Dev-Server + Backend + Atlas) wurden ohne Konsolenfehler geprüft:

- Registrierung mit anschließender Weiterleitung ins Dashboard
- Login und Sitzungs-Hydration nach Reload
- Startseite, Marktplatz, Produktdetail, Favoriten, Warenkorb
- Produkt in den Warenkorb legen und Test-Checkout abschließen
- Bestellseite mit echter Testbestellung
- Nachrichten-Deep-Link vom Inserat, Unterhaltung anlegen, Nachricht senden
- Admin-Dashboard mit echten Statistiken, Meldungen, Inseraten und Nutzer:innen
- Nicht-Admin erhält im Admin-Bereich „Kein Zugriff auf diesen Bereich“
- Rechtliche Seiten

---

## Manuelle Prüfliste (Entwicklung)

| Bereich | Prüfung | Erwartung |
|---|---|---|
| Health | `GET /api/health` | `{status:"ok"}` |
| Registrierung | Formular ausfüllen | Konto angelegt, Bestätigungsmail (wenn SMTP konfiguriert) |
| Login | Korrekte Daten | Token gesetzt, Weiterleitung zum Dashboard |
| Falsches Passwort | Login | Fehlermeldung, kein Token |
| Produkt | Mehrere Bilder hochladen | Bilder erscheinen, Hauptbild markiert |
| Suche | `?search=...&minPrice=...` | Nur passende Produkte aus MongoDB |
| Favoriten | Herz anklicken | Zahl im Navbar erhöht sich, nach Reload erhalten |
| Warenkorb | Produkt hinzufügen | Summe in EUR korrekt |
| Nachrichten | Zwei Konten | Echtzeit-Nachricht kommt an |
| Checkout | Testmodus | Ausdrücklich als Test gekennzeichnet, keine Zahlungsdaten |
| Admin | Nicht-Admin versucht `/admin` | Kein Zugriff / 403 |
| Mobil | Browser auf 375 px | Kein horizontaler Scroll, Menü funktioniert |

---

## Hinweis zu Zahlungen

Der Checkout läuft im Demo-Modus. Es werden keine Kartendaten erhoben, kein Geld abgebucht und keine Bestellung als bezahlt markiert. Stripe kann optional mit Sandbox-Schlüsseln konfiguriert werden; auch dann wird nur ein Sandbox-PaymentIntent vorbereitet. Echte Zahlungen wären erst nach Webhook-Verifizierung und rechtlicher Freigabe möglich.
