// Requires: npm install react-plaid-link
// Talks to the Express backend in ../backend — start that first (npm run dev)
// or the link token fetch below will fail.

import React, { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";

const API_BASE = "http://localhost:8080/api/plaid";
const USER_ID = "demo-user"; // swap for your real logged-in user id

export default function ConnectBank({ onLinked }) {
  const [linkToken, setLinkToken] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/create_link_token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: USER_ID }),
    })
      .then((r) => r.json())
      .then((data) => setLinkToken(data.link_token))
      .catch((err) => console.error("Failed to create link token", err));
  }, []);

  const onSuccess = useCallback(
    async (public_token) => {
      const res = await fetch(`${API_BASE}/exchange_public_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: USER_ID, public_token }),
      });
      const data = await res.json();
      onLinked?.(data);
    },
    [onLinked]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  return (
    <button
      onClick={() => open()}
      disabled={!ready}
      style={{
        fontFamily: "inherit",
        fontSize: 12,
        padding: "9px 16px",
        borderRadius: 6,
        border: "1px solid var(--accent)",
        background: "var(--accent)",
        color: "#fff",
        cursor: ready ? "pointer" : "default",
        opacity: ready ? 1 : 0.5,
      }}
    >
      {ready ? "Connect a bank account" : "Loading…"}
    </button>
  );
}
