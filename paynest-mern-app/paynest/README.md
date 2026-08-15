# PayNest — Money made simple ✨

A full-stack UPI-style digital wallet app built with the **MERN** stack
(MongoDB, Express, React, Node.js), matching the PayNest UI design —
dark, gradient-forward, mobile-first fintech aesthetic.

---

## ✨ What's included

**20 screens**, all fully wired to a real backend API:

Splash · Onboarding · Login · Register · Home/Dashboard · Add Money ·
Send Money · Confirm & Pay · Payment Successful · Transactions ·
Transaction Details · My Cards · Scan & Pay · Recipients · Profile ·
Personal Details · Bank Accounts · Settings · Help & Support ·
Security · Notifications

**Working features:**
- JWT authentication (register/login), password hashing with bcrypt
- Real wallet balance that goes up/down with actual transactions
- Send money to a saved recipient or any UPI ID, protected by a UPI PIN
- Your own "My QR Code" screen (Scan & Pay → My QR Code tab) so others can pay you
- Add money from a linked bank account
- Transaction history with search + Sent/Received filters and detail view
- Bank accounts (add, set primary, remove)
- Cards (add, freeze/unfreeze, set spending limit)
- Recipients / contacts (add, favorite, remove)
- Notifications (auto-created on transactions, mark read)
- Settings & Security (change password, set/reset UPI PIN, toggles)

---

## 🗂 Project structure

```
paynest/
├── backend/                 Express + MongoDB REST API
│   ├── config/db.js         Mongoose connection
│   ├── models/               User, BankAccount, Card, Recipient, Transaction, Notification
│   ├── controllers/          Route handler logic
│   ├── routes/                Express routers
│   ├── middleware/           JWT auth guard + error handler
│   ├── seed.js               Populates demo data matching the mockups
│   └── server.js             App entry point
│
└── frontend/                 React 18 + Vite SPA
    └── src/
        ├── api/               axios instance + typed API helpers
        ├── context/           AuthContext, ToastContext
        ├── components/        TopBar, BottomNav, Avatar, PinPad, etc.
        ├── pages/              One file per screen
        └── index.css          Design system (colors, buttons, cards, nav...)
```

---

## 🚀 Getting started

### Prerequisites
- **Node.js** 18+ and npm
- **MongoDB** — either a local install (`mongod` running on `localhost:27017`)
  or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env if your MongoDB URI / JWT secret differ from the defaults
npm run seed     # optional but recommended — creates a demo account
npm run dev      # starts the API on http://localhost:5000
```

The seed script creates a demo user pre-loaded with the same balance,
transactions, cards, bank accounts and contacts shown in the UI mockups:

```
Email / Mobile:  sreekrishnan@email.com  /  9676543210
Password:        password123
UPI PIN:         123456
```

### 2. Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
# edit .env if your API isn't running on http://localhost:5000
npm run dev      # starts the app on http://localhost:5173
```

Open **http://localhost:5173** and log in with the demo account above,
or tap "Sign up" to create your own (new accounts start with a ₹5,000
balance and need to set a UPI PIN under Profile → Security before
sending money).

### 3. Using the app on your phone (same Wi-Fi)

The dev servers are already configured to accept LAN connections, so:

1. Find your computer's local IP address:
   - **Windows:** open Command Prompt → `ipconfig` → look for "IPv4 Address" under your Wi-Fi adapter (e.g. `192.168.1.5`)
   - **Mac/Linux:** `ifconfig | grep inet` or `ipconfig getifaddr en0`
2. In `frontend/.env`, set `VITE_API_URL=http://<your-ip>:5000/api` (replace `<your-ip>`), then restart `npm run dev`.
3. On your phone (connected to the same Wi-Fi), open `http://<your-ip>:5173` in the browser.
4. Make sure Windows Firewall / your OS firewall isn't blocking incoming connections on ports 5000 and 5173 — if the page won't load at all, that's usually why.

The backend's CORS config already accepts any private-network origin (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`) automatically, so you shouldn't hit CORS errors once the IP is set correctly.

### 4. Production build

```bash
cd frontend
npm run build     # outputs static files to frontend/dist
```
Deploy `frontend/dist` to any static host (Vercel, Netlify, S3, etc.)
and the `backend/` folder to any Node host (Render, Railway, EC2, etc.),
pointing `VITE_API_URL` at your deployed API URL.

---

## 🔌 API overview

All routes are prefixed with `/api`. Protected routes require
`Authorization: Bearer <token>`.

| Method | Route | Description |
|---|---|---|
| POST | `/auth/register` | Create account, returns JWT |
| POST | `/auth/login` | Login with email/mobile + password |
| GET | `/auth/me` | Current user |
| PUT | `/users/me` | Update name/email |
| PUT | `/users/me/password` | Change login password |
| PUT | `/users/me/upi-pin` | Set/reset UPI PIN |
| PUT | `/users/me/settings` | Update settings toggles |
| GET/POST | `/accounts` | List / add bank accounts |
| PUT | `/accounts/:id/primary` | Set primary account |
| DELETE | `/accounts/:id` | Remove account |
| GET/POST | `/cards` | List / add cards |
| PUT | `/cards/:id/freeze` | Toggle freeze |
| PUT | `/cards/:id/limit` | Update spending limit |
| GET/POST | `/recipients` | List / add contacts |
| PUT | `/recipients/:id/favorite` | Toggle favorite |
| GET | `/transactions?filter=&search=` | List transactions |
| GET | `/transactions/:id` | Transaction detail |
| POST | `/transactions/send` | Send money (debits balance) |
| POST | `/transactions/add-money` | Add money (credits balance) |
| GET | `/notifications` | List notifications |
| PUT | `/notifications/:id/read` | Mark one read |
| PUT | `/notifications/read-all` | Mark all read |

---

## 🎨 Design system

The look is defined entirely in `frontend/src/index.css` as CSS custom
properties, so re-theming is a matter of editing one file:

- **Canvas:** near-black violet (`#07040f`) with soft radial glows
- **Accent gradient:** violet → purple → magenta (`#7c3aed → #a855f7 → #d946ef`)
- **Fonts:** Sora (headings) + Plus Jakarta Sans (body), via Google Fonts
- **Shape:** large rounded corners (16–28px), pill-shaped nav & chips
- Mobile-first: the whole app renders as a centered ~440px "phone" card
  on desktop and full-width on mobile, matching the reference mockups.

---

## 🔒 Notes on security

This is a learning/portfolio-grade implementation. Before shipping to
production you'd want to add: rate limiting, input validation
(e.g. `express-validator`/`zod`), refresh tokens, HTTPS-only cookies
instead of `localStorage` for the JWT, transaction idempotency keys,
and a real UPI/payment-gateway integration instead of the simulated
balance transfer used here.
