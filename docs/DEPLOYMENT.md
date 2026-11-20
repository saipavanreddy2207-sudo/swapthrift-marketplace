# Deployment-Dokumentation

**Live_URL:** https://swapthrift.vercel.app

**Stabiler Kurzlink:** https://is.gd/swapthrift_app → https://rentry.co/swapthrift-live-2026 → Live_URL

**Founder & Creator:** sai pavan reddy pedaveti · saipavanreddy2207@gmail.com

SwapThrift läuft als **eine Vercel-Umgebung** mit statischem Frontend, Express/Socket.IO-Funktion, MongoDB Atlas und MongoDB-gestützten Uploads. Cloudinary ist optional; ohne Cloudinary werden Bildbytes in der MongoDB-Collection `uploads` gespeichert und über `/uploads/:filename` ausgeliefert. Damit funktionieren Profilbilder und Inseratsbilder auch über mehrere Serverless-Instanzen hinweg.

> `.env`-Dateien und Tokens gehören nie ins Repository oder in ein ZIP. Alle Secrets liegen ausschließlich als Umgebungsvariablen beim Hosting-Anbieter.

---

## 1. MongoDB Atlas

1. Cluster erstellen (M0 Free reicht für Tests).
2. **Database Access:** DB-Benutzer mit `Read and write to any database`.
3. **Network Access:** Für Vercel Functions ist der ausgehende IP-Adressbereich nicht fest. Aktuell ist `0.0.0.0/0` mit dem Kommentar `Vercel serverless` freigegeben. Für eine strengere Produktion():

   - Cluster mit privatem Endpoint/VPC-Peering nutzen, oder
   - IP-Ausschluss über ein Proxy-/Gateway-Setup lösen.

4. Connection-String als `MONGO_URI` in Vercel hinterlegen.

---

## 2. Vercel (produktive 24/7-Deployment)

Projekt: `swapthrift` (Hobby Plan, Region Frankfurt).

### Root-Konfiguration (`vercel.json`)

```json
{
  "framework": null,
  "installCommand": "npm install --prefix backend --omit=dev && npm install --prefix frontend --include=dev",
  "buildCommand": "npm --prefix frontend run build",
  "outputDirectory": "frontend/dist",
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/index.js" },
    { "source": "/socket.io", "destination": "/api/index.js" },
    { "source": "/socket.io/", "destination": "/api/index.js" },
    { "source": "/socket.io/:path*", "destination": "/api/index.js" },
    { "source": "/uploads/:path*", "destination": "/api/index.js" },
    { "source": "/:path*", "destination": "/index.html" }
  ]
}
```

Wichtig: Die expliziten Rewrites für `/socket.io` und `/socket.io/` sind erforderlich. `:path*` allein trifft nicht den Pfad ohne weiteres Segment, wodurch der Socket.IO-Handshake sonst mit 404 abgebrochen wird.

### Umgebungsvariablen

| Variable | Wert / Zweck |
|---|---|
| `MONGO_URI` | Atlas-Connection-String |
| `JWT_SECRET` | Langer Zufallswert für Tokens |
| `API_PUBLIC_URL` | `https://swapthrift.vercel.app` – absolute Upload-URLs |
| `VITE_API_URL` | `/api` – Frontend ruft die gleiche Origin auf |
| `VITE_WS_ONLY` | `true` – Socket.IO nur via WebSocket (Vercel unterstützt kein Long-Polling hinter der Function) |
| `NODE_ENV` | `production` |

Der Installer muss `--include=dev` für das Frontend verwenden, weil Vercel bei `NODE_ENV=production` sonst die Vite-DevDependencies überspringt und der Build an `@vitejs/plugin-react` scheitert.

### Deployment

```powershell
$env:VERCEL_TOKEN=(Get-Content 'C:\Users\pedaveti sai pavan\AppData\Local\Temp\opencode\vercel-token.txt' -Raw).Trim()
npx.cmd vercel --prod --yes
```

Danach die Production-Domain `https://swapthrift.vercel.app` prüfen.

---

## 3. Socket.IO auf Vercel

- `api/index.js` exportiert den HTTP-Server (nicht nur die Express-App), damit Vercel WebSocket-Upgrades verarbeiten kann.
- Der Client nutzt `transports: ['websocket']` (`VITE_WS_ONLY=true`).
- Erfolgreicher Handshake: `wss://swapthrift.vercel.app/socket.io/?EIO=4&transport=websocket` → HTTP 101.
- Die Chat-Seite zeigt „Chat-Server verbunden“, wenn die Verbindung steht.

---

## 4. Uploads

Priorität:

1. **Cloudinary** (wenn `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` gesetzt sind).
2. **MongoDB-Fallback** (aktuell aktiv): Multer hält die Datei im Speicher, `backend/config/uploadStore.js` speichert die Bytes in der Collection `uploads`, `backend/app.js` liefert sie unter `/uploads/:filename` aus.

Das lokale `backend/uploads`-Verzeichnis enthält nur die mitgelieferten Demo-Bilder und wird nicht für neue Serverless-Uploads verwendet.

---

## 5. Stripe (Sandbox)

1. Stripe-Dashboard → **Connect** aktivieren (Eligibility/Country prüfen).
2. Nur Sandbox-Keys verwenden (`sk_test_...`).
3. Webhook-Endpoint: `https://swapthrift.vercel.app/api/webhooks/stripe`
4. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `account.updated`.
5. `STRIPE_WEBHOOK_SECRET` aus dem Webhook-Dashboard kopieren.
6. Der sichtbare Checkout bleibt ausdrücklich ein **Demo-Modus**: keine Kartendaten, keine echte Abbuchung, keine Zahlung als bezahlt markiert.

---

## 6. Domain & HTTPS

- HTTPS wird von Vercel automatisch bereitgestellt.
- `API_PUBLIC_URL` muss der finalen Origin entsprechen, damit gespeicherte Bild-URLs auf allen Geräten funktionieren.
- Cookies: `secure: true`, `sameSite: 'lax'` in Produktion.

---

## 7. Monitoring, Backups, Sicherheit

- Vercel-Logs: `npx.cmd vercel logs swapthrift.vercel.app`
- Health-Check: `https://swapthrift.vercel.app/api/health`
- MongoDB Atlas: automatisierte Backups aktivieren.
- Rate-Limits auf Auth- und API-Endpunkten aktiv.
- Helmet-Sicherheitsheader aktiv.
- Regelmäßig `npm audit --omit=dev` ausführen.
- Admin-Zugang ausschließlich über geschützte Rollen; Audit-Log führt Aktionen mit.
- Rechtsseiten sind Strukturentwürfe und benötigen eine qualifizierte rechtliche Prüfung vor dem echten Launch.

---

## 8. Selbstheilende Demo (Fallback, nicht 24/7)

Der Kurzlink `https://is.gd/swapthrift_app` zeigt derzeit auf die Rentry-Seite, die wiederum auf Vercel verweist. Der frühere Cloudflare-Tunnel bleibt als Fallback erhalten:

1. `node scripts/preview-proxy.js` bündelt Frontend (5173) und API (5000) auf `http://127.0.0.1:4000`.
2. `scripts/preview-watchdog.ps1` überwacht Prozesse und aktualisiert die Rentry-Weiterleitung bei einer neuen Tunnel-URL.
3. `frontend/dist/config.js` enthält `window.__SWAPTHRIFT_API_URL__ = '/api'`.

Dieser Pfad ist nur eine Demo mit eingeschränkter Verfügbarkeit. Die permanente Adresse ist `https://swapthrift.vercel.app`.

---

## 9. Deployment-Checkliste

- [x] `.env` nicht im Repository
- [x] `MONGO_URI` zeigt auf Atlas
- [x] `JWT_SECRET` lang und zufällig
- [x] `API_PUBLIC_URL` = finale Origin
- [x] Health-Endpoint erreichbar
- [x] Socket.IO-Handshake 101
- [x] Uploads persistent (MongoDB oder Cloudinary)
- [x] Demo-Checkout ohne Kartendaten
- [x] Admin-Bereich gibt 403 für normale Nutzer
- [ ] Cloudinary für Bildoptimierung optional nachrüsten
- [ ] Stripe-Sandbox nur bei echtem Bedarf aktivieren
- [ ] Rechtsseiten von Rechtsberatung prüfen
- [ ] Backups aktiviert
