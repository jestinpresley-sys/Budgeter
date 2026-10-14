const express = require("express");
const plaidClient = require("../plaidClient");
const store = require("../store");

const router = express.Router();

// In a real app this comes from your auth session (JWT, cookie, etc).
// Hardcoded here so the scaffold runs standalone.
function getUserId(req) {
  return req.body.userId || req.query.userId || "demo-user";
}

// 1. Frontend calls this first to get a link_token, which initializes Plaid Link.
router.post("/create_link_token", async (req, res) => {
  const userId = getUserId(req);
  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: "Rocket Clone",
      products: ["transactions"],
      // Only initialized (and billed) when the chosen accounts support it, so
      // banks with no loan/credit accounts don't fail with NO_LIABILITY_ACCOUNTS.
      required_if_supported_products: ["liabilities"],
      country_codes: ["US"],
      language: "en",
      // webhook: "https://your-deployed-server.com/api/plaid/webhook",
    });
    res.json({ link_token: response.data.link_token });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create link token" });
  }
});

// 2. After the user finishes the Plaid Link flow in the browser, the frontend
//    gets back a public_token and sends it here. This is the ONLY place a
//    public_token should ever be exchanged — it must happen server-side.
router.post("/exchange_public_token", async (req, res) => {
  const userId = getUserId(req);
  const { public_token } = req.body;
  if (!public_token) return res.status(400).json({ error: "Missing public_token" });

  try {
    const exchange = await plaidClient.itemPublicTokenExchange({ public_token });
    const accessToken = exchange.data.access_token;
    const itemId = exchange.data.item_id;

    let institutionName = "Unknown institution";
    try {
      const itemInfo = await plaidClient.itemGet({ access_token: accessToken });
      const institutionId = itemInfo.data.item.institution_id;
      if (institutionId) {
        const inst = await plaidClient.institutionsGetById({
          institution_id: institutionId,
          country_codes: ["US"],
        });
        institutionName = inst.data.institution.name;
      }
    } catch (e) {
      // non-fatal — institution lookup is cosmetic
    }

    store.addItem(userId, { itemId, accessToken, institutionName });
    res.json({ item_id: itemId, institution_name: institutionName });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to exchange public token" });
  }
});

// 3. Fetch balances/accounts across every linked item for this user.
router.get("/accounts", async (req, res) => {
  const userId = getUserId(req);
  const items = store.getItems(userId);

  try {
    const results = await Promise.all(
      items.map(async (item) => {
        const response = await plaidClient.accountsBalanceGet({
          access_token: item.accessToken,
        });
        return {
          institution_name: item.institutionName,
          item_id: item.itemId,
          accounts: response.data.accounts,
        };
      })
    );
    res.json({ items: results });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

// 4. Fetch recent transactions. Uses /transactions/sync, which is Plaid's
//    current recommended approach (cursor-based, handles adds/mods/removes).
router.get("/transactions", async (req, res) => {
  const userId = getUserId(req);
  const items = store.getItems(userId);

  try {
    const results = await Promise.all(
      items.map(async (item) => {
        let cursor = undefined;
        let added = [];
        let hasMore = true;

        while (hasMore) {
          const response = await plaidClient.transactionsSync({
            access_token: item.accessToken,
            cursor,
          });
          added = added.concat(response.data.added);
          hasMore = response.data.has_more;
          cursor = response.data.next_cursor;
        }

        return { institution_name: item.institutionName, transactions: added };
      })
    );
    res.json({ items: results });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// 4b. Fetch liabilities: student loans, credit cards, mortgages — whatever
//     the linked institution reports. Coverage varies by institution; not
//     every bank returns loan-level detail even when the product is enabled.
router.get("/liabilities", async (req, res) => {
  const userId = getUserId(req);
  const items = store.getItems(userId);

  try {
    const results = await Promise.all(
      items.map(async (item) => {
        try {
          const response = await plaidClient.liabilitiesGet({
            access_token: item.accessToken,
          });
          return {
            institution_name: item.institutionName,
            student: response.data.liabilities.student || [],
            credit: response.data.liabilities.credit || [],
            mortgage: response.data.liabilities.mortgage || [],
          };
        } catch (err) {
          // Items without liability accounts (or not yet ready) are expected —
          // report them as empty rather than failing the whole request.
          console.warn(
            `liabilities unavailable for ${item.institutionName}:`,
            err.response?.data?.error_code || err.message
          );
          return { institution_name: item.institutionName, student: [], credit: [], mortgage: [] };
        }
      })
    );
    res.json({ items: results });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch liabilities" });
  }
});

// 5. Let a user unlink a bank connection.
router.post("/remove_item", async (req, res) => {
  const userId = getUserId(req);
  const { item_id } = req.body;
  const item = store.getItems(userId).find((i) => i.itemId === item_id);
  if (!item) return res.status(404).json({ error: "Item not found" });

  try {
    await plaidClient.itemRemove({ access_token: item.accessToken });
    store.removeItem(userId, item_id);
    res.json({ removed: true });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to remove item" });
  }
});

// 6. Plaid calls this URL when new transactions are ready, an item needs
//    re-auth, etc. Must be a publicly reachable HTTPS URL once deployed —
//    won't fire against localhost.
router.post("/webhook", (req, res) => {
  const { webhook_type, webhook_code, item_id } = req.body;
  console.log(`Plaid webhook: ${webhook_type} / ${webhook_code} for item ${item_id}`);
  // e.g. on TRANSACTIONS / SYNC_UPDATES_AVAILABLE, re-run transactionsSync above
  res.sendStatus(200);
});

module.exports = router;
