# Datenbank-Dokumentation

MongoDB-Datenbank: `swapthrift` (MongoDB Atlas oder lokal). Alle Schema-Dateien liegen in `backend/models/`.

---

## Übersicht

| Modell | Zweck | Wichtige Felder |
|---|---|---|
| `User` | Nutzerkonten | firstName, lastName, email, password (select:false), roles, city, postalCode, avatar, isEmailVerified, consent, notificationPreferences |
| `Category` | Kategorien & Unterkategorien | name, slug, parent, icon, isActive, sortOrder |
| `Product` | Produktanzeigen | title, description, price, category, subcategory, brand, condition, city, postalCode, images[], seller, availability, shippingOptions[], status, fraudScore, flags |
| `Address` | Lieferadressen | user, label, street, houseNumber, postalCode, city, country, isDefault |
| `Favorite` | Merkliste | user, product (unique zusammen) |
| `Conversation` | Unterhaltungen | participants[], product, lastMessage, unreadFor[] |
| `Message` | Nachrichten | conversation, sender, text, image, readBy[], isFlagged |
| `Order` | Bestellungen | buyer, seller, product, price, shippingCost, total, currency EUR, address snapshot, shipping, status, timeline[] |
| `Payment` | Zahlungen | order, buyer, seller, stripePaymentIntentId, amount, status, refunds[] |
| `Review` | Bewertungen | reviewer, seller, product, order, rating 1–5, text, sellerResponse, isVerifiedPurchase |
| `Notification` | Benachrichtigungen | user, type, title, message, data, isRead, link |
| `Report` | Meldungen | reporter, type, targetId, reason, details, status, reviewedBy, resolution |
| `AuditLog` | Sicherheitsprotokoll | actor, action, target, meta {ip,userAgent} |

---

## Rollen

- `user` – Käufer (Standard)
- `seller` – Verkäufer (zusätzlich; kann auch kaufen)
- `admin` – Administrator (geschützte Bereiche)

Ein Nutzer kann mehrere Rollen besitzen. Rollen werden serverseitig über `middleware/auth.js` geprüft.

---

## Produktzustände (`condition`)

`Neu`, `Wie neu`, `Sehr gut`, `Gut`, `Akzeptabel`

## Anzeigenstatus (`status`)

`draft`, `pending`, `active`, `inactive`, `sold`

## Bestellstatus (`status`)

`pending`, `payment_processing`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`

---

## Indizes

Empfohlene Indizes (in den Modellen definiert):

- `User.email` unique
- `Category.slug` unique
- `Favorite.user + Favorite.product` unique
- `Product.category`, `Product.seller`, `Product.city`, `Product.price`, `Product.status`
- Texte Indizes für `Product.title`/`description` für die Suche
- `Message.conversation + createdAt`
- `Notification.user + isRead`

---

## Seed

Beim Serverstart werden die 10 Hauptkategorien angelegt, falls sie fehlen:

```
Elektronik, Mode, Möbel, Haus & Wohnen, Fahrzeuge,
Sport, Bücher, Baby & Kind, Beauty, Sammlerstücke
```

Optionaler Admin:

```powershell
cd C:\Projects\SwapThrift\backend
# ADMIN_EMAIL und ADMIN_PASSWORD in .env setzen
npm run seed
```

---

## Datenschutz / DSGVO

- Passwörter ausschließlich als bcrypt-Hash gespeichert (`select: false`).
- Einwilligungen (AGB, Datenschutz, Zeitpunkt) werden am Nutzerkonto gespeichert.
- Konto löschen (`DELETE /api/auth/me`) entfernt personenbezogene Daten; Bestellungen bleiben aus Buchhaltungsgründen pseudonymisiert erhalten, sofern gesetzlich erforderlich.
- Datenexport und detaillierte Aufbewahrungsfristen folgen in Phase 13.
- Die Rechts- und Datenschutztexte müssen vor kommerziellem Start fachlich geprüft werden.
