# Rocket Clone

A subscription and budget tracker (Rocket Money–style) with real bank
account linking via Plaid.

## Structure

- `frontend/` — Vite + React app. The tracker UI (`src/App.jsx`) plus
  `src/ConnectBank.jsx`, which drives the Plaid Link flow. Includes an
  overview, subscriptions, budgets, and student loans view.
- `backend/` — Express server that talks to the Plaid API: creates link
  tokens (`transactions` + `liabilities` products), exchanges public tokens
  for access tokens, fetches balances/transactions/liabilities, and
  receives Plaid webhooks. See `backend/README.md` for full setup.

## Running locally

Two servers, two terminals:

```bash
cd backend && npm install && cp .env.example .env   # then add your Plaid keys
npm run dev      # http://localhost:8080

cd frontend && npm install
npm run dev       # http://localhost:5173
```

## Current state / known gaps

- `backend/store.js` is in-memory — access tokens vanish on server restart.
  Not wired to a real database yet.
- No auth — every request in the backend is hardcoded to `userId:
  "demo-user"`.
- `frontend/src/App.jsx` still carries most of its original mock
  subscriptions/budgets/student-loans data alongside the real Plaid
  connection — linked accounts aren't merged into the subscription list,
  spend totals, or the Student Loans view yet. Wiring that up means
  fetching `GET /api/plaid/liabilities` after a successful link and
  merging `response.items[].student` into `studentLoans` state.
- Plaid is in `sandbox` mode by default (fake banks, fake data) — see
  `backend/README.md` before touching `development` or `production`.

## Conventions

- Frontend styling is hand-written CSS-in-JS (a `<style>` block in
  `App.jsx`) using CSS custom properties under `.rm-app` — no Tailwind, no
  component library. Keep new UI consistent with that token set (`--ink`,
  `--accent`, `--amber`, `--line`, etc.) rather than introducing a new
  styling approach.
- Backend routes live under `backend/routes/plaid.js`; keep Plaid-specific
  logic there rather than in `server.js`.
