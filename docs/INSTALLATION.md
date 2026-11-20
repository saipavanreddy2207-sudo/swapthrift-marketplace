# Installation auf Windows (Einsteiger-Anleitung)

Diese Anleitung führt dich Schritt für Schritt durch die Einrichtung von SwapThrift auf einem Windows-Computer.

---

## 1. ZIP herunterladen und entpacken

1. Lade `SwapThrift-Professional-Germany.zip` herunter.
2. Rechtsklick auf die Datei → **Alle extrahieren…**
3. Wähle einen einfachen Pfad ohne Leerzeichen, z. B. `C:\Projects\SwapThrift`.
4. Nach dem Entpacken siehst du die Ordner `backend` und `frontend`.

> 💡 Falls Windows eine Warnung anzeigt: Die Datei stammt aus deinem eigenen Projekt. Bestätige das Extrahieren.

---

## 2. Node.js installieren

1. Öffne https://nodejs.org/
2. Lade die **LTS-Version** herunter und installiere sie (Standardeinstellungen beibehalten).
3. Starte **PowerShell** und prüfe:

```powershell
node --version
npm --version
```

Beide Befehle müssen eine Versionsnummer ausgeben (z. B. `v22.x` und `10.x`).

---

## 3. Abhängigkeiten installieren

Öffne PowerShell und führe aus:

```powershell
cd C:\Projects\SwapThrift\backend
npm install
```

In einem zweiten PowerShell-Fenster:

```powershell
cd C:\Projects\SwapThrift\frontend
npm install
```

---

## 4. MongoDB einrichten

### Variante A: MongoDB Atlas (empfohlen)

1. Gehe zu https://www.mongodb.com/atlas und erstelle ein kostenloses Konto.
2. Erstelle ein **Projekt** und einen **Shared Cluster (M0 Free)**.
3. Wähle **Database Access** → **Add New Database User**:
   - Authentication: **Password**
   - Rolle: **Read and write to any database**
4. Wähle **Network Access** → **Add IP Address** → **Add Current IP Address** (oder für Tests `0.0.0.0/0`).
5. Klicke im Cluster auf **Connect** → **Connect via drivers** → **Node.js** und kopiere die Connection-String.
6. Füge den Datenbanknamen ein: `...mongodb.net/swapthrift?retryWrites=true&w=majority`

### Variante B: Lokales MongoDB

Installiere MongoDB Community Server und starte den Dienst. Verbindung:
`mongodb://127.0.0.1:27017/swapthrift`

---

## 5. Umgebungsvariablen konfigurieren

### Backend

```powershell
cd C:\Projects\SwapThrift\backend
Copy-Item .env.example .env
notepad .env
```

Wichtigste Felder:

```env
PORT=5000
MONGO_URI=mongodb+srv://BENUTZER:PASSWORT@CLUSTER.mongodb.net/swapthrift?retryWrites=true&w=majority
JWT_SECRET=ein_langer_zufaelliger_wert
CLIENT_URL=http://localhost:5173
```

> ⚠️ Das Passwort gehört in `MONGO_URI` — **nicht** in `JWT_SECRET`. `JWT_SECRET` ist ein separater, langer Zufallswert.

Weitere Felder:

- `API_PUBLIC_URL=http://localhost:5000` — notwendig, wenn Bilder ohne Cloudinary lokal gespeichert werden.
- `ADMIN_EMAIL` und `ADMIN_PASSWORD` — optional, aber empfohlen für den Admin-Bereich.
- `SMTP_*` — optional; ohne Konfiguration werden E-Mails nur in der Konsole protokolliert.
- `CLOUDINARY_*` — optional; ohne Konfiguration landen hochgeladene Bilder unter `backend/uploads`.
- `STRIPE_SECRET_KEY` — nur für echte Stripe-**Sandbox**-Tests. Der normale Checkout läuft ohne Stripe als klar gekennzeichneter Test-Checkout.

### Frontend

```powershell
cd C:\Projects\SwapThrift\frontend
Copy-Item .env.example .env
notepad .env
```

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 6. Datenbank vorbereiten (Seed)

Beim Start legt das Backend die 10 Hauptkategorien automatisch an. Optional kannst du außerdem einen Admin anlegen:

```powershell
cd C:\Projects\SwapThrift\backend
npm run seed
```

Voraussetzung: `ADMIN_EMAIL` und `ADMIN_PASSWORD` sind in `.env` gesetzt.

---

## 7. Backend starten

```powershell
cd C:\Projects\SwapThrift\backend
npm run dev
```

Erwartete Ausgabe:

```
Connected to MongoDB Atlas (swapthrift)
Backend server running at http://localhost:5000
```

Test im Browser: http://localhost:5000/api/health

---

## 8. Frontend starten

In einem **neuen** PowerShell-Fenster:

```powershell
cd C:\Projects\SwapThrift\frontend
npm run dev
```

Öffne anschließend http://localhost:5173 in Google Chrome.

---

## 9. Häufige Probleme

| Problem | Lösung |
|---|---|
| `bad auth : authentication failed` | DB-Benutzername/Passwort in `MONGO_URI` prüfen — nicht das Atlas-Login verwenden |
| `Invalid scheme` in der URI | Die Zeile muss mit `MONGO_URI=mongodb+srv://` beginnen (kein doppeltes Präfix) |
| CORS-Fehler im Browser | `CLIENT_URL=http://localhost:5173` im Backend-.env prüfen |
| Port bereits belegt | Anderen PORT in `.env` setzen und Frontend-URL anpassen |
| Änderungen an `.env` wirken nicht | Server mit Strg+C stoppen und neu starten (`node --watch` überwacht keine `.env`) |

---

## 10. Projekt mit GitHub Desktop hochladen

1. Installiere https://desktop.github.com/ und melde dich an.
2. **File → Add Local Repository** → Ordner `C:\Projects\SwapThrift` auswählen.
3. Falls kein Repository vorhanden: **Create a Repository** wählen.
4. Prüfe, dass `.env`-Dateien **nicht** zur Versionierung vorgeschlagen werden (`.gitignore` enthält `.env`).
5. Änderungen auswählen, Commit-Nachricht eingeben (z. B. `Add marketplace foundation`), **Commit to main**.
6. **Publish repository** → Name wählen → ggf. privat/public → **Publish**.

---

## 11. Vorbereitung für Deployment

Siehe [DEPLOYMENT.md](DEPLOYMENT.md). Kurz:

- Frontend + API + Socket.IO: gemeinsam auf Vercel (`api/index.js`, `vercel.json`)
- Datenbank: MongoDB Atlas
- Bilder: Cloudinary (optional) oder MongoDB-Upload-Collection
- Zahlungen: Demo-Checkout; Stripe-Sandbox optional vorbereitet
- Alle Secrets als Umgebungsvariablen bei Vercel hinterlegen
- HTTPS wird von Vercel automatisch bereitgestellt
- Live: https://swapthrift.vercel.app

---

## 12. Nächste Schritte

Sobald Backend und Frontend laufen, kannst du dich registrieren, einloggen, Produkte anlegen, suchen, Favoriten nutzen, Nachrichten schreiben und den Test-Checkout ausprobieren.

> 💡 Der Checkout ist ausdrücklich ein **Test-Checkout**. Es werden keine Kartendaten abgefragt, kein Geld abgebucht und keine Zahlung als erfolgreich ausgegeben. Bestellungen erscheinen trotzdem real in deinem Konto, damit du den Ablauf nachvollziehen kannst.

Vor einem öffentlichen Launch bitte [LEGAL_REVIEW.md](LEGAL_REVIEW.md) beachten.
