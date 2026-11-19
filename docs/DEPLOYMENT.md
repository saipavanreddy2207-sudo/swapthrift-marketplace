# Deployment-Dokumentation

Zielzustand: Frontend auf Vercel, Backend auf Render (oder vergleichbar), Datenbank auf MongoDB Atlas, Bilder auf Cloudinary, Zahlungen im Stripe-Sandbox-Modus.

> Die Anwendung ist lokal vollständig verifiziert. Diese Anleitung beschreibt die produktive Konfiguration für Vercel + Render. Für echte Produktion sind Cloudinary-Zugangsdaten erforderlich, weil der lokale Upload-Fallback auf Render nicht dauerhaft gespeichert wird.

---

## 1. MongoDB Atlas

1. Cluster erstellen (M0 Free reicht für Tests).
2. **Database Access:** DB-Benutzer mit `Read and write to any database`.
3. **Network Access:** IP des Backend-Hosts freigeben (Render：`0.0.0.0/0` mit Zugriffsschutz, besser: statische IP).
4. Connection-String kopieren und als `MONGO_URI` beim Backend hinterlegen.

---

## 2. Backend auf Render

1. GitHub-Repository mit Render verbinden.
2. Neuer **Web Service**:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Umgebungsvariablen setzen:

```env
PORT=10000
NODE_ENV=production
MONGO_URI=<Atlas-URI>
JWT_SECRET=<langer Zufallswert>
CLIENT_URL=https://<deine-frontend-domain>
CORS_ORIGINS=https://<preview-domain-1>,https://<preview-domain-2>
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_EMAIL=...
ADMIN_PASSWORD=...
```

4. Health-Check-Pfad: `/api/health`
5. HTTPS wird von Render automatisch bereitgestellt.
6. `CLIENT_URL` und `CORS_ORIGINS` akzeptieren auch kommaseparierte Listen für Vercel-Preview-Deployments.
7. Cloudinary ist in Produktion erforderlich: Der lokale `backend/uploads`-Fallback geht bei jedem Render-Neustart verloren.

---

## 3. Frontend auf Vercel

1. GitHub-Repository importieren.
2. Framework Preset: **Vite**
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Umgebungsvariable:

```env
VITE_API_URL=https://<deine-backend-domain>/api
```

7. Nach dem Deployment Domain in `CLIENT_URL` des Backends eintragen (CORS).

---

## 4. Cloudinary

1. Konto erstellen → Dashboard → Cloud Name, API Key, API Secret kopieren.
2. Als Backend-Umgebungsvariablen hinterlegen.
3. Upload-Ordner: `swapthrift/products` und `swapthrift/avatars`.
4. Bilder werden optimiert (Resize/WebP) ausgeliefert.

---

## 5. Stripe (spätere Phase)

1. Stripe-Dashboard → **Connect** aktivieren (Eligibility/Country prüfen).
2. Sandbox-Keys verwenden (`sk_test_...`).
3. Webhook-Endpoint: `https://<backend>/api/webhooks/stripe`
4. Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`, `account.updated`.
5. `STRIPE_WEBHOOK_SECRET` aus dem Webhook-Dashboard kopieren.
6. **Nie echte Zahlungen mit Test-Karten vorgeben** — Testmodus klar kennzeichnen.

---

## 6. Domain & HTTPS

- Domain bei Vercel/Render verbinden.
- HTTPS-Zertifikate werden automatisch ausgestellt.
- `CLIENT_URL` und CORS auf die finale Domain setzen.
- Cookies: `secure: true`, `sameSite: 'lax'` in Produktion.

---

## 7. Monitoring, Backups, Sicherheit

- Fehler-Logging im Backend (Konsole + optionales Monitoring-Tool).
- MongoDB Atlas: automatisierte Backups (auch im Free-Tier verfügbar je nach Plan).
- Rate-Limits auf Auth- und API-Endpunkten aktiv.
- Helmet-Sicherheitsheader aktiv.
- Regelmäßige Überprüfung der npm-Abhängigkeiten (`npm audit`).
- Admin-Zugang ausschließlich über geschützte Rollen; Audit-Log führt Aktionen mit.

---

## 8. Deployment-Checkliste

- [ ] `.env` nicht im Repository
- [ ] `MONGO_URI` zeigt auf Produktions-Cluster
- [ ] `JWT_SECRET` lang und zufällig
- [ ] `CLIENT_URL` = Frontend-Domain
- [ ] Cloudinary-Zugangsdaten gesetzt
- [ ] Stripe im Sandbox-Modus (für Tests)
- [ ] Health-Endpoint erreichbar
- [ ] Admin-Konto angelegt
- [ ] Rechtsseiten von Rechtsberatung geprüft
- [ ] Backups aktiviert
