require("dotenv").config();
const express = require("express");
const cors = require("cors");
const plaidRoutes = require("./routes/plaid");

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());

app.use("/api/plaid", plaidRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Plaid backend listening on http://localhost:${port}`);
  console.log(`Environment: ${process.env.PLAID_ENV || "sandbox"}`);
});
