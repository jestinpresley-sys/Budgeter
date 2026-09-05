# Rocket Clone

A subscription and budget tracker with real bank account linking via
Plaid — a personal-finance dashboard in the spirit of Rocket Money.

- **`frontend/`** — Vite + React tracker UI (subscriptions, budgets,
  spend-by-category, cancel/reactivate flow) plus the "Connect a bank
  account" button that launches Plaid Link.
- **`backend/`** — Express server holding the Plaid secret key, handling
  the link-token / public-token exchange, and fetching balances and
  transactions. Full setup instructions in `backend/README.md`.

## Quick start

```bash
# backend
cd backend
npm install
cp .env.example .env        # add your Plaid client_id + sandbox secret
npm run dev                 # http://localhost:8080

# frontend, in a second terminal
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Get free Plaid sandbox keys instantly at https://dashboard.plaid.com/signup
— no approval needed for sandbox. Sandbox login for any bank in the Link
flow: username `user_good`, password `pass_good`.

See `CLAUDE.md` for the current state of the project and what's still
mocked vs. real.
