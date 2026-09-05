# Rocket Clone — Plaid Backend

A real backend for linking bank accounts via Plaid: creates link tokens,
exchanges public tokens for access tokens, and pulls balances and
transactions. Run this alongside the tracker artifact (or any frontend).

## 1. Get Plaid credentials

Sign up free at https://dashboard.plaid.com/signup — sandbox access is
instant, no approval needed. Grab your `client_id` and `sandbox` secret from
the dashboard.

## 2. Install and configure

```bash
cd plaid-backend
npm install
cp .env.example .env
# paste your PLAID_CLIENT_ID and PLAID_SECRET into .env
```

## 3. Run it

```bash
npm run dev
```

Server starts on `http://localhost:8080`. Check `http://localhost:8080/health`.

## 4. Connect the frontend

Install the Plaid Link SDK in your frontend project:

```bash
npm install react-plaid-link
```

Use `frontend-example/ConnectBank.jsx` as a starting point — it calls
`/api/plaid/create_link_token`, opens Plaid Link, and on success sends the
`public_token` back to `/api/plaid/exchange_public_token`.

## 5. Test with sandbox credentials

In sandbox mode, Plaid Link shows a list of fake institutions. Pick any one
and log in with:

- username: `user_good`
- password: `pass_good`

This returns fake — but fully structured — accounts and transactions, so
the whole flow (`/accounts`, `/transactions`) works exactly like production
would, without touching a real bank.

Sandbox institution **"First Platypus Bank"** returns sample student loan
data for the `/liabilities` endpoint — useful for testing that flow
specifically. Real coverage varies: not every bank or servicer returns
loan-level detail even in production.

## Endpoints

| Method | Path                          | Purpose                                   |
|--------|-------------------------------|--------------------------------------------|
| POST   | `/api/plaid/create_link_token`   | Start the Link flow                     |
| POST   | `/api/plaid/exchange_public_token`| Finish linking, store access_token     |
| GET    | `/api/plaid/accounts`            | Balances for all linked accounts        |
| GET    | `/api/plaid/liabilities`         | Student loans, credit cards, mortgages  |
| GET    | `/api/plaid/transactions`        | Recent transactions for all linked items|
| POST   | `/api/plaid/remove_item`         | Unlink a bank connection                |
| POST   | `/api/plaid/webhook`             | Plaid calls this on updates              |

## Before this touches real users

- **Swap the in-memory store** (`store.js`) for a real database, and encrypt
  `access_token` values at rest — they're as sensitive as a password.
- **Add real auth** — `getUserId()` is hardcoded to `"demo-user"` right now.
- **Deploy the webhook** to a public HTTPS URL and set it in
  `create_link_token` — Plaid can't reach `localhost`.
- **Apply for production access** in the Plaid dashboard before switching
  `PLAID_ENV` to `production` — Plaid reviews use cases before real bank
  data flows through.
- **Handle Plaid's error codes** (`ITEM_LOGIN_REQUIRED`, rate limits, etc.) —
  this scaffold logs and returns a generic 500 for anything unexpected.
