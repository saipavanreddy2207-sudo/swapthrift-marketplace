# SwapThrift 🇩🇪

**Gutes finden. Weitergeben.**

Ein professioneller, deutschlandweiter Second-Hand-Marktplatz mit React, Vite, Node.js, Express, MongoDB und Socket.IO.

> **Status:** Alle 14 Entwicklungsphasen sind implementiert und verifiziert. Die Anwendung ist lokal lauffähig und nutzt echte MongoDB-Daten, echte JWT-Authentifizierung, echte Datei-Uploads und echte API-Abläufe. Der Checkout bleibt bewusst im Demonstrationsmodus: Es werden keine Kartendaten erfasst und kein Geld abgebucht. Stripe wird ausschließlich optional im Sandbox-Modus vorbereitet.

---

## Inhaltsverzeichnis

- [Über das Projekt](#über-das-projekt)
- [Technologie-Stack](#technologie-stack)
- [Projektstruktur](#projektstruktur)
- [Schnellstart (Windows)](#schnellstart-windows)
- [Umgebungsvariablen](#umgebungsvariablen)
- [Verifizierung](#verifizierung)
- [Dokumentation](#dokumentation)
- [Entwicklungsphasen](#entwicklungsphasen)
- [Rechtliches](#rechtliches)

---

## Über das Projekt

SwapThrift ist ein Full-Stack-Marktplatz für Gebrauchtwaren mit Fokus auf den deutschen Markt. Nutzer können sich registrieren, Produkte mit mehreren Bildern anlegen, suchen und filtern, Favoriten speichern, in Echtzeit kommunizieren, Testbestellungen aufgeben, Bestellungen verwalten, bewerten und Benachrichtigungen erhalten. Ein Admin-Bereich bietet echte Moderation auf Basis realer Daten.

**Kernfunktionen:**

- Professionelle, responsive Marktplatz-Oberfläche (Desktop, Tablet, Mobile)
- Echte Registrierung, Login, E-Mail-Verifizierung, Passwort-Reset, HTTP-only-Cookies und JWT
- Produktanlagen mit bis zu fünf Bildern, Cloudinary oder lokalem Upload-Fallback, Kategorien, Zustand, EUR-Preise
- Suche und Filter (Preis, Kategorie, Marke, Zustand, Stadt, PLZ, Versand, Sortierung)
- Käufer- und Verkäufer-Dashboards mit echten Kennzahlen
- Favoriten mit Backend-Persistenz, Warenkorb und Nachrichten mit Socket.IO
- Test-Checkout, Bestellungen inklusive Statusverlauf, Bewertungen und Benachrichtigungen
- Admin-Dashboard, Meldungen, Produkt- und Nutzer-Moderation, Audit-Logs
- Unterstützende Betrugsbewertung ohne automatische Bestrafung
- Deutsche Rechtsseiten als geprüfte Strukturentwürfe
- Umfassende Tests, API-Dokumentation und Deployment-Anleitung

---

## Technologie-Stack

| Bereich | Technologie |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router, Axios, Lucide React, Socket.IO Client |
| Backend | Node.js, Express, MongoDB Atlas, Mongoose, JWT, bcryptjs, Zod, Helmet, express-rate-limit |
| Uploads | Cloudinary (optional) oder lokaler `backend/uploads`-Fallback |
| E-Mail | Nodemailer/SMTP (optional; ohne Konfiguration nur Server-Log) |
| Zahlungen | Demo-Modus ohne Zahlungsdaten; Stripe-Sandbox optional vorbereitet |
| Sicherheit | HTTP-only Cookies, Passwort-Hashing, Ratenlimitierung, Validierung, Rollenrechte |

---

## Projektstruktur

```text
SwapThrift/
├── backend/
│   ├── config/          # DB, Cloudinary, Uploads, E-Mail, Stripe
│   ├── controllers/     # Request-Logik
│   ├── middleware/      # Auth, Validierung, Upload, Error-Handling
│   ├── models/          # Mongoose-Schemas
│   ├── routes/          # API-Routen
│   ├── services/        # Fachlogik, Benachrichtigungen, Realtime
│   ├── sockets/         # Socket.IO-Authentifizierung
│   ├── tests/           # Unit-/Validierungstests
│   ├── uploads/         # Lokaler Upload-Fallback (nur .gitkeep im Source)
│   ├── utils/           # Hilfsfunktionen, Seeder
│   ├── .env.example
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/ components/ layouts/ pages/ context/ hooks/ services/ routes/ utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── INSTALLATION.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── TESTING.md
│   └── LEGAL_REVIEW.md
├── .gitignore
└── README.md
```

---

## Schnellstart (Windows)

Vollständige Anleitung für Einsteiger: [docs/INSTALLATION.md](docs/INSTALLATION.md)

Kurzfassung:

```powershell
# 1. Backend
cd C:\Projects\SwapThrift\backend
npm install
# .env anhand von backend\.env.example anlegen
npm run dev        # http://localhost:5000

# 2. Frontend (neues Terminal)
cd C:\Projects\SwapThrift\frontend
npm install
# .env anhand von frontend\.env.example anlegen
npm run dev        # http://localhost:5173
```

Gesundheitscheck: `http://localhost:5000/api/health` → `{ "status": "ok" }`

Optionaler Admin-Zugang beim Start:

```powershell
$env:ADMIN_EMAIL="admin@beispiel.de"
$env:ADMIN_PASSWORD="EinSicheresPasswort2026!"
npm run dev
```

---

## Umgebungsvariablen

Back-end: `backend/.env` (siehe `backend/.env.example`)
Front-end: `frontend/.env` (siehe `frontend/.env.example`)

Wichtig: `.env` niemals in Git einchecken. Die `.gitignore` schließt `.env`, `node_modules`, `dist` und hochgeladene Dateien aus.

---

## Verifizierung

| Prüfung | Ergebnis |
|---|---|
| Backend-Unit-Tests (`npm test`) | 17/17 bestanden |
| Backend-Produktions-Audit (`npm audit --omit=dev`) | 0 Schwachstellen |
| Live-API-Integrationstest gegen MongoDB Atlas | 30/30 bestanden |
| Frontend-Lint (`npm run lint`) | 0 Fehler/Warnungen |
| Frontend-Produktions-Build (`npm run build`) | erfolgreich |
| Browser-Smoke-Test | Registrierung, Login, Inserat, Warenkorb, Test-Checkout, Nachrichten, Admin und 403-Schutz ohne Konsolenfehler |

Details: [docs/TESTING.md](docs/TESTING.md)

---

## Dokumentation

- [Installation & Windows-Einrichtung](docs/INSTALLATION.md)
- [API-Referenz](docs/API.md)
- [Datenbank-/Modell-Dokumentation](docs/DATABASE.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Tests & Verifikation](docs/TESTING.md)
- [Rechtliche Prüfliste](docs/LEGAL_REVIEW.md)

---

## Entwicklungsphasen

| Phase | Inhalt | Status |
|---|---|---|
| 1 | Professionelle Website & Navigation | ✅ umgesetzt |
| 2 | Backend & MongoDB | ✅ umgesetzt |
| 3 | Authentifizierung | ✅ umgesetzt |
| 4 | Produktanlagen & Bild-Upload | ✅ umgesetzt |
| 5 | Suche & Filter | ✅ umgesetzt |
| 6 | Käufer-/Verkäufer-Dashboards | ✅ umgesetzt |
| 7 | Favoriten & Nachrichten | ✅ umgesetzt |
| 8 | Warenkorb & Checkout | ✅ Demo-Checkout umgesetzt |
| 9 | Bestellungen & Versand | ✅ umgesetzt |
| 10 | Bewertungen & Benachrichtigungen | ✅ umgesetzt |
| 11 | Admin-Dashboard | ✅ umgesetzt |
| 12 | Betrugserkennung & Moderation | ✅ umgesetzt |
| 13 | Rechtliches & Datenschutz | ✅ Strukturen umgesetzt, Rechtsprüfung offen |
| 14 | Tests & Deployment | ✅ umgesetzt |

---

## Rechtliches

Die Rechtsseiten (Impressum, Datenschutzerklärung, AGB, Widerrufsbelehrung, Cookie-Hinweise, Community-Richtlinien, Marktplatzregeln) sind als Struktur vorbereitet. **Vor einem kommerziellen Start müssen sie von einer qualifizierten Rechtsberatung geprüft werden.** Siehe [docs/LEGAL_REVIEW.md](docs/LEGAL_REVIEW.md).

Zahlungen werden ausschließlich im Sandbox-/Testmodus durchgeführt; simulierte Bestellungen werden nie als echte Zahlungen ausgegeben.
