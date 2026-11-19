# SwapThrift API-Referenz

Basis-URL (lokal): `http://localhost:5000/api`

Alle Endpunkte liegen unter `/api`, außer `/api/health` und statisch ausgelieferten Bildern unter `/uploads`.

Antworten verwenden ein einheitliches Format:

```json
{ "success": true, "message": "optional", "data": { } }
```

Fehler:

```json
{ "success": false, "message": "Fehlerbeschreibung", "errors": [] }
```

Authentifizierung über HTTP-only-Cookie `token` **oder** `Authorization: Bearer <token>`. Geschützte Endpunkte sind mit 🔒 markiert, Admin-Endpunkte mit 👑.

---

## Health

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/api/health` | Lebenszeichen, DB-Status, App-Name, Währung |

---

## Authentifizierung

| Methode | Endpoint | Body | Beschreibung |
|---|---|---|---|
| POST | `/auth/register` | `{firstName,lastName,email,password,phone?,city,postalCode,terms,privacy}` | Registrierung |
| POST | `/auth/login` | `{email,password}` | Login; setzt Cookie und liefert Token |
| POST | `/auth/logout` | – | Logout; löscht Cookie |
| GET | `/auth/me` 🔒 | – | Angemeldeter Benutzer |
| PATCH | `/auth/me` 🔒 | Profilfelder | Vorname, Nachname, Ort, PLZ, Telefon, Bio, Benachrichtigungen |
| DELETE | `/auth/me` 🔒 | – | Konto deaktivieren/anonymisieren |
| POST | `/auth/avatar` 🔒 | Multipart `avatar` | Profilbild hochladen |
| POST | `/auth/verify-email` | `{token}` | E-Mail bestätigen |
| POST | `/auth/resend-verification` | `{email?}` | Bestätigungsmail erneut senden; angemeldet oder öffentlich |
| POST | `/auth/change-email` 🔒 | `{newEmail,password}` | E-Mail ändern und neu verifizieren |
| POST | `/auth/forgot-password` | `{email}` | Reset-Link anfordern |
| POST | `/auth/reset-password` | `{token,password}` | Neues Passwort setzen |
| POST | `/auth/change-password` 🔒 | `{currentPassword,newPassword}` | Passwort ändern |

**Sicherheit:** bcrypt-Hashes, Zod-Validierung, Ratenlimitierung, HTTP-only-Cookies (`sameSite=lax`, in Produktion `secure`), JWT mit Ablauf.

---

## Benutzer

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/users/:id` | Öffentliches Verkäuferprofil |
| PATCH | `/users/me` 🔒 | Profil aktualisieren (Alias zu `/auth/me`) |
| DELETE | `/users/me` 🔒 | Konto löschen (Alias zu `/auth/me`) |

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/sellers?limit=4` | Öffentliche Verkäufer-Highlights, ausschließlich aus realen aktiven Inseraten und echten Bewertungen |

---

## Kategorien

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/categories` | Aktive Kategorien inkl. Unterkategorien |
| GET | `/categories/:id` | Einzelne Kategorie |
| POST | `/categories` 👑 | Kategorie anlegen |
| PUT | `/categories/:id` 👑 | Kategorie bearbeiten |
| DELETE | `/categories/:id` 👑 | Kategorie löschen |

Die 10 Standardkategorien: Elektronik, Mode, Möbel & Wohnen, Bücher, Sport & Freizeit, Kinder & Baby, Haus & Garten, Beauty & Pflege, Fahrzeuge, Sammlerstücke.

---

## Produkte & Suche

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/products` | Suche/Liste mit Filtern und Pagination |
| GET | `/products/:id` | Produktdetail; erhöht den Aufrufzähler |
| POST | `/products` 🔒 | Inserat anlegen (Multipart `images`, max. 5) |
| PUT | `/products/:id` 🔒 | Inserat bearbeiten (Eigentümer:in/Admin) |
| PATCH | `/products/:id/status` 🔒 | Status ändern: `draft`, `pending`, `active`, `inactive`, `sold` |
| DELETE | `/products/:id` 🔒 | Inserat löschen |
| POST | `/products/:id/report` 🔒 | Inserat melden: `{reason,details?}` |

**Query-Parameter für `/products`:** `search`, `category`, `minPrice`, `maxPrice`, `condition`, `city`, `postalCode`, `shipping`, `sort` (`newest`, `price_asc`, `price_desc`, `popular`), `page`, `limit`.

**Zustände:** `Neu`, `Wie neu`, `Sehr gut`, `Gut`, `Akzeptabel`.

**Bilder:** Bis zu 5 Dateien, max. 5 MB pro Datei, nur Bildformate. Mit Cloudinary-Zugangsdaten werden Bilder in die Cloud hochgeladen; ohne Zugangsdaten erfolgt ein lokaler Upload unter `backend/uploads`, der unter `/uploads/<datei>` ausgeliefert wird. Für den lokalen Modus kann `API_PUBLIC_URL` gesetzt werden (Standard `http://localhost:5000`).

---

## Favoriten 🔒

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/favorites` | `{products, ids}` des angemeldeten Benutzers |
| POST | `/favorites/:productId` | Favorit hinzufügen (idempotent) |
| DELETE | `/favorites/:productId` | Favorit entfernen |

---

## Adressen 🔒

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/addresses` | Eigene Adressen |
| POST | `/addresses` | Adresse anlegen |
| PUT | `/addresses/:id` | Adresse bearbeiten |
| DELETE | `/addresses/:id` | Adresse löschen |

Felder: `label?`, `firstName`, `lastName`, `street`, `houseNumber`, `postalCode` (5 Ziffern), `city`, `country?`, `isDefault?`.

---

## Nachrichten 🔒

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/conversations` | Unterhaltungen inkl. letzter Nachricht und Unread-Count |
| POST | `/conversations` | `{productId,receiverId}`; idempotent pro Produkt und Teilnehmern |
| GET | `/conversations/:id/messages` | Nachrichten mit `page`, `limit` |
| POST | `/conversations/:id/messages` | `{text}` senden |
| PATCH | `/conversations/:id/read` | Als gelesen markieren |

**Socket.IO:** gleiche Origin wie die API, Authentifizierung via `auth.token` (Bearer-Token) oder Cookie. Räume: `user:<userId>`. Ereignisse: `message:new`, `conversation:updated`, `notification:new`.

---

## Checkout & Bestellungen

> Der Checkout ist standardmäßig ein **Test-Checkout**. Es werden keine Zahlungsdaten erhoben und keine echte Zahlung ausgelöst. Demo-Bestellungen bleiben ausdrücklich `pending`/`requires_payment_method` und werden nie als bezahlt ausgegeben.

| Methode | Endpoint | Beschreibung |
|---|---|---|
| POST | `/checkout` 🔒 | Testbestellung anlegen (oder Stripe-Sandbox-Intent, wenn konfiguriert) |
| GET | `/orders` 🔒 | `?role=buyer\|seller\|all` |
| GET | `/orders/:id` 🔒 | Bestelldetails inkl. Timeline |
| PATCH | `/orders/:id/status` 🔒 | `{status,carrier?,trackingNumber?}`; Käufer:in nur Stornierung, Verkäufer:in/Admin Versandstatus |
| POST | `/orders/:id/cancel` 🔒 | Bestellung stornieren, solange nicht versendet |

**Checkout-Body:**

```json
{
  "items": [{ "productId": "…", "quantity": 1 }],
  "address": {
    "firstName": "Max",
    "lastName": "Mustermann",
    "street": "Musterstraße",
    "houseNumber": "12",
    "postalCode": "10115",
    "city": "Berlin",
    "country": "Deutschland"
  },
  "shippingMethod": "versand",
  "mode": "demo"
}
```

Da es sich um Einzelstücke handelt, ist `quantity` immer `1`. Bei `mode: "stripe"` wird nur mit gültigem `STRIPE_SECRET_KEY` ein Sandbox-PaymentIntent erzeugt und `checkout.clientSecret` zurückgegeben. Ohne Konfiguration antwortet die API mit 503 und einem klaren Hinweis, den Demo-Modus zu verwenden.

---

## Bewertungen

| Methode | Endpoint | Beschreibung |
|---|---|---|
| POST | `/reviews` 🔒 | `{orderId,rating,text?}`; nur Käufer:in einer zugestellten Bestellung, eine Bewertung pro Bestellung |
| GET | `/reviews` | `?seller=<id>&product=<id>`; `{reviews,summary:{average,count}}` |
| PATCH | `/reviews/:id/response` 🔒 | Antwort der Verkäufer:in: `{text}` |

---

## Benachrichtigungen 🔒

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/notifications` | `?unreadOnly=true`; `{notifications,unreadCount}` |
| PATCH | `/notifications/:id/read` | Einzelne als gelesen markieren |
| PATCH | `/notifications/read-all` | Alle als gelesen markieren |
| DELETE | `/notifications/:id` | Benachrichtigung löschen |

---

## Admin & Moderation 👑

| Methode | Endpoint | Beschreibung |
|---|---|---|
| GET | `/admin/overview` | Reale Zahlen: `{stats:{users,products,activeProducts,orders,openReports,reviews}}` |
| GET | `/admin/reports` | `?status=open\|reviewing\|resolved\|dismissed` |
| PATCH | `/admin/reports/:id` | `{status,resolution?}`; benachrichtigt Melder:in |
| GET | `/admin/products` | `?status=pending\|active\|inactive\|sold` |
| PATCH | `/admin/products/:id/status` | `{status}`; schreibt Audit-Log |
| GET | `/admin/users` | `?search=&page=&limit=` |
| PATCH | `/admin/users/:id/status` | `{isActive?,isSuspended?,roles?}`; Selbstsperrung ist blockiert |

Betrugsbewertungen werden beim Anlegen von Inseraten unterstützend berechnet (`backend/utils/fraud.js`). Es erfolgt keine automatische Bestrafung; auffällige Inserate können im Admin-Dashboard geprüft werden.

---

## Fehlercodes

| Code | Bedeutung |
|---|---|
| 400 | Ungültige Eingabe / Validierung fehlgeschlagen |
| 401 | Nicht angemeldet / Token ungültig |
| 403 | Keine Berechtigung für diese Aktion |
| 404 | Ressource nicht gefunden |
| 409 | Konflikt (z. B. E-Mail bereits registriert) |
| 429 | Zu viele Anfragen (Rate Limit) |
| 500 | Serverfehler |
