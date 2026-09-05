import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  Repeat,
  PiggyBank,
  GraduationCap,
  X,
  Check,
  RotateCcw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import ConnectBank from "./ConnectBank";

const CATEGORIES = [
  "Streaming",
  "Music",
  "Books",
  "Software",
  "Fitness",
  "Cloud Storage",
  "News",
  "Utilities",
];

const initialSubscriptions = [
  { id: "netflix", name: "Netflix", category: "Streaming", amount: 15.49, cycle: "monthly", status: "active", flagged: false, note: "Watched 4 times this month" },
  { id: "disney", name: "Disney+", category: "Streaming", amount: 13.99, cycle: "monthly", status: "active", flagged: false, note: "Watched last week" },
  { id: "hulu", name: "Hulu", category: "Streaming", amount: 7.99, cycle: "monthly", status: "active", flagged: true, note: "No activity in 97 days" },
  { id: "prime", name: "Amazon Prime", category: "Streaming", amount: 139, cycle: "yearly", status: "active", flagged: false, note: "Renews in March" },
  { id: "spotify", name: "Spotify", category: "Music", amount: 11.99, cycle: "monthly", status: "active", flagged: false, note: "Used daily" },
  { id: "audible", name: "Audible", category: "Books", amount: 14.95, cycle: "monthly", status: "active", flagged: true, note: "3 unused credits" },
  { id: "adobe", name: "Adobe Creative Cloud", category: "Software", amount: 54.99, cycle: "monthly", status: "active", flagged: false, note: "Used for client work" },
  { id: "notion", name: "Notion Plus", category: "Software", amount: 8.0, cycle: "monthly", status: "active", flagged: false, note: "Opened this week" },
  { id: "gym", name: "Planet Fitness", category: "Fitness", amount: 24.99, cycle: "monthly", status: "active", flagged: true, note: "No check-ins in 84 days" },
  { id: "icloud", name: "iCloud+", category: "Cloud Storage", amount: 2.99, cycle: "monthly", status: "active", flagged: false, note: "200GB plan" },
  { id: "nyt", name: "NYT Digital", category: "News", amount: 17.0, cycle: "monthly", status: "active", flagged: true, note: "Last opened in June" },
  { id: "internet", name: "Home Internet", category: "Utilities", amount: 65.0, cycle: "monthly", status: "active", flagged: false, note: "Comcast" },
];

const initialBudgets = [
  { category: "Groceries", limit: 500, spentOverride: 381.42, standalone: true },
  { category: "Dining Out", limit: 200, spentOverride: 246.1, standalone: true },
  { category: "Transportation", limit: 150, spentOverride: 92.3, standalone: true },
  { category: "Streaming", limit: 60, standalone: false },
  { category: "Software", limit: 70, standalone: false },
  { category: "Fitness", limit: 30, standalone: false },
];

const transactions = [
  { id: 1, merchant: "Netflix", amount: 15.49, date: "Sep 3", sub: true },
  { id: 2, merchant: "Trader Joe's", amount: 64.21, date: "Sep 2", sub: false },
  { id: 3, merchant: "Spotify", amount: 11.99, date: "Sep 1", sub: true },
  { id: 4, merchant: "Shell", amount: 41.0, date: "Aug 31", sub: false },
  { id: 5, merchant: "Chipotle", amount: 13.85, date: "Aug 30", sub: false },
  { id: 6, merchant: "Adobe Creative Cloud", amount: 54.99, date: "Aug 29", sub: true },
];

// Shape mirrors what Plaid's /liabilities/get returns for student loans —
// swap this for a real fetch to GET /api/plaid/liabilities once accounts
// are linked (see backend/routes/plaid.js).
const initialStudentLoans = [
  {
    id: "loan-1",
    loanName: "Direct Subsidized Loan",
    servicer: "Nelnet",
    principalBalance: 9820.44,
    originalPrincipal: 14000,
    interestRate: 4.99,
    minimumPayment: 118,
    nextPaymentDate: "Oct 1",
    status: "current",
  },
  {
    id: "loan-2",
    loanName: "Direct Unsubsidized Loan",
    servicer: "Nelnet",
    principalBalance: 16230.02,
    originalPrincipal: 22000,
    interestRate: 6.54,
    minimumPayment: 187,
    nextPaymentDate: "Oct 1",
    status: "current",
  },
  {
    id: "loan-3",
    loanName: "Private Student Loan",
    servicer: "Sallie Mae",
    principalBalance: 5410.9,
    originalPrincipal: 8000,
    interestRate: 8.25,
    minimumPayment: 95,
    nextPaymentDate: "Sep 14",
    status: "overdue",
  },
];

const fmt = (n) => `$${n.toFixed(2)}`;
const monthly = (sub) => (sub.cycle === "yearly" ? sub.amount / 12 : sub.amount);
const STORAGE_KEY = "rocket-clone-state-v1";

export default function RocketMoneyClone() {
  const [subscriptions, setSubscriptions] = useState(initialSubscriptions);
  const [budgets, setBudgets] = useState(initialBudgets);
  const [studentLoans, setStudentLoans] = useState(initialStudentLoans);
  const [view, setView] = useState("overview");
  const [subFilter, setSubFilter] = useState("active");
  const [confirmId, setConfirmId] = useState(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.subscriptions) setSubscriptions(parsed.subscriptions);
        if (parsed.budgets) setBudgets(parsed.budgets);
        if (parsed.studentLoans) setStudentLoans(parsed.studentLoans);
      }
    } catch (e) {
      // no saved state yet — defaults stand
    } finally {
      loadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ subscriptions, budgets, studentLoans })
      );
    } catch (e) {
      // best effort — ignore
    }
  }, [subscriptions, budgets, studentLoans]);

  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const cancelledSubs = subscriptions.filter((s) => s.status === "cancelled");
  const totalMonthly = activeSubs.reduce((sum, s) => sum + monthly(s), 0);
  const flaggedActive = activeSubs.filter((s) => s.flagged);
  const potentialSavings = flaggedActive.reduce((sum, s) => sum + monthly(s), 0);

  const byCategory = {};
  activeSubs.forEach((s) => {
    byCategory[s.category] = (byCategory[s.category] || 0) + monthly(s);
  });
  const categoryRows = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxCategory = categoryRows.length ? categoryRows[0][1] : 1;

  function cancelSub(id) {
    setSubscriptions((subs) =>
      subs.map((s) => (s.id === id ? { ...s, status: "cancelled" } : s))
    );
    setConfirmId(null);
  }
  function reactivateSub(id) {
    setSubscriptions((subs) =>
      subs.map((s) => (s.id === id ? { ...s, status: "active" } : s))
    );
  }
  function updateBudgetLimit(category, value) {
    setBudgets((bs) =>
      bs.map((b) => (b.category === category ? { ...b, limit: value } : b))
    );
  }

  const filteredSubs = subscriptions.filter((s) =>
    subFilter === "all" ? true : s.status === subFilter
  );

  const totalLoanBalance = studentLoans.reduce((sum, l) => sum + l.principalBalance, 0);
  const totalLoanMinPayment = studentLoans.reduce((sum, l) => sum + l.minimumPayment, 0);
  const weightedRate = totalLoanBalance
    ? studentLoans.reduce((sum, l) => sum + l.interestRate * l.principalBalance, 0) / totalLoanBalance
    : 0;
  const overdueLoanCount = studentLoans.filter((l) => l.status === "overdue").length;

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "subscriptions", label: "Subscriptions", icon: Repeat },
    { id: "budgets", label: "Budgets", icon: PiggyBank },
    { id: "loans", label: "Student Loans", icon: GraduationCap },
  ];

  return (
    <div className="rm-app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        .rm-app {
          --bg: #FFFFFF;
          --ink: #111111;
          --ink-soft: #3A3A3A;
          --accent: #6B3FA3;
          --accent-soft: #EDE4F7;
          --amber: #B5651D;
          --amber-soft: #F6E7D6;
          --red: #A8402A;
          --red-soft: #F5E1DB;
          --line: #E4E4E4;
          --card: #FFFFFE;
          --muted: #737373;
          font-family: 'IBM Plex Mono', ui-monospace, monospace;
          background: var(--bg);
          color: var(--ink);
          min-height: 100%;
          display: flex;
          border-radius: 4px;
          overflow: hidden;
        }
        .rm-app * { box-sizing: border-box; }
        .rm-serif { font-family: 'Fraunces', Georgia, serif; }

        .rm-nav {
          width: 168px;
          flex-shrink: 0;
          border-right: 1px solid var(--line);
          padding: 24px 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .rm-nav-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 19px;
          font-weight: 600;
          padding: 0 10px 20px;
          letter-spacing: -0.01em;
        }
        .rm-nav-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 10px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-family: inherit;
          font-size: 13px;
          color: var(--ink-soft);
          cursor: pointer;
          text-align: left;
          width: 100%;
        }
        .rm-nav-btn:hover { background: var(--accent-soft); }
        .rm-nav-btn.active { background: var(--accent); color: #fff; }
        .rm-nav-btn svg { width: 16px; height: 16px; flex-shrink: 0; }

        .rm-main {
          flex: 1;
          padding: 32px 36px 60px;
          overflow-y: auto;
          min-width: 0;
        }
        .rm-eyebrow {
          font-size: 12px;
          color: var(--muted);
          margin: 0 0 6px;
        }
        .rm-hero-number {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 52px;
          font-weight: 500;
          letter-spacing: -0.02em;
          margin: 0;
          font-variant-numeric: tabular-nums;
        }
        .rm-hero-sub {
          font-size: 13px;
          color: var(--ink-soft);
          margin: 8px 0 28px;
        }

        .rm-callout {
          background: var(--amber-soft);
          border: 1px solid #E3C6A3;
          border-radius: 8px;
          padding: 16px 18px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 32px;
        }
        .rm-callout svg { width: 18px; height: 18px; color: var(--amber); flex-shrink: 0; margin-top: 2px; }
        .rm-callout-text { font-size: 13px; line-height: 1.55; color: var(--ink); }
        .rm-callout-text b { font-family: 'Fraunces', Georgia, serif; font-size: 14px; }
        .rm-callout-btn {
          margin-top: 10px;
          border: 1px solid var(--amber);
          background: transparent;
          color: var(--amber);
          font-family: inherit;
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 5px;
          cursor: pointer;
        }
        .rm-callout-btn:hover { background: var(--amber); color: #fff; }

        .rm-section-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 17px;
          font-weight: 600;
          margin: 0 0 14px;
        }

        .rm-cat-row {
          display: grid;
          grid-template-columns: 120px 1fr 64px;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          font-size: 12.5px;
        }
        .rm-cat-track {
          height: 7px;
          background: var(--accent-soft);
          border-radius: 4px;
          overflow: hidden;
        }
        .rm-cat-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 4px;
        }
        .rm-cat-amount { text-align: right; font-variant-numeric: tabular-nums; }

        .rm-two-col {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
          margin-top: 8px;
        }

        .rm-txn-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid var(--line);
          font-size: 12.5px;
        }
        .rm-txn-row:last-child { border-bottom: none; }
        .rm-txn-left { display: flex; align-items: center; gap: 9px; }
        .rm-txn-badge {
          font-size: 9.5px;
          background: var(--accent-soft);
          color: var(--accent);
          padding: 2px 6px;
          border-radius: 999px;
        }
        .rm-txn-date { color: var(--muted); font-size: 11px; }
        .rm-txn-amount { font-variant-numeric: tabular-nums; }

        .rm-filters { display: flex; gap: 6px; margin-bottom: 18px; }
        .rm-filter-btn {
          border: 1px solid var(--line);
          background: var(--card);
          color: var(--ink-soft);
          font-family: inherit;
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 999px;
          cursor: pointer;
        }
        .rm-filter-btn.active { background: var(--ink); color: #fff; border-color: var(--ink); }

        .rm-sub-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 0;
          border-bottom: 1px solid var(--line);
          gap: 16px;
        }
        .rm-sub-name { font-family: 'Fraunces', Georgia, serif; font-size: 15.5px; font-weight: 500; }
        .rm-sub-meta { font-size: 11.5px; color: var(--muted); margin-top: 3px; }
        .rm-flag-badge {
          display: inline-block;
          font-size: 9.5px;
          background: var(--amber-soft);
          color: var(--amber);
          padding: 1px 6px;
          border-radius: 999px;
          margin-left: 8px;
          vertical-align: middle;
        }
        .rm-sub-amount { font-size: 14.5px; font-variant-numeric: tabular-nums; white-space: nowrap; }
        .rm-sub-cycle { font-size: 10.5px; color: var(--muted); }
        .rm-sub-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

        .rm-btn {
          border: 1px solid var(--line);
          background: var(--card);
          font-family: inherit;
          font-size: 11.5px;
          padding: 7px 12px;
          border-radius: 6px;
          cursor: pointer;
          color: var(--ink);
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .rm-btn:hover { border-color: var(--ink); }
        .rm-btn.danger { color: var(--red); }
        .rm-btn.danger:hover { background: var(--red-soft); border-color: var(--red); }
        .rm-btn.confirm { background: var(--red); color: #fff; border-color: var(--red); }
        .rm-btn svg { width: 13px; height: 13px; }

        .rm-budget-row { padding: 16px 0; border-bottom: 1px solid var(--line); }
        .rm-budget-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
        .rm-budget-cat { font-family: 'Fraunces', Georgia, serif; font-size: 15px; font-weight: 500; }
        .rm-budget-nums { font-size: 12px; color: var(--ink-soft); font-variant-numeric: tabular-nums; }
        .rm-budget-track { height: 8px; background: var(--accent-soft); border-radius: 4px; overflow: hidden; margin-bottom: 6px; }
        .rm-budget-fill { height: 100%; border-radius: 4px; }
        .rm-budget-foot { display: flex; justify-content: space-between; align-items: center; }
        .rm-budget-status { font-size: 11px; }
        .rm-limit-input {
          width: 66px;
          font-family: inherit;
          font-size: 11.5px;
          border: 1px solid var(--line);
          border-radius: 5px;
          padding: 4px 6px;
          text-align: right;
          background: var(--card);
          color: var(--ink);
        }

        @media (max-width: 720px) {
          .rm-app { flex-direction: column; }
          .rm-nav {
            width: 100%;
            flex-direction: row;
            border-right: none;
            border-bottom: 1px solid var(--line);
            padding: 10px 12px;
            gap: 4px;
          }
          .rm-nav-title { display: none; }
          .rm-nav-btn { flex-direction: column; gap: 3px; font-size: 10.5px; padding: 8px 4px; text-align: center; }
          .rm-nav-btn span { white-space: nowrap; }
          .rm-main { padding: 22px 18px 40px; }
          .rm-hero-number { font-size: 38px; }
          .rm-two-col { grid-template-columns: 1fr; gap: 28px; }
          .rm-sub-row { flex-wrap: wrap; }
        }
      `}</style>

      <nav className="rm-nav">
        <div className="rm-nav-title">Ledger</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`rm-nav-btn ${view === item.id ? "active" : ""}`}
              onClick={() => setView(item.id)}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <main className="rm-main">
        {view === "overview" && (
          <>
            <p className="rm-eyebrow">This month</p>
            <p className="rm-hero-number">{fmt(totalMonthly)}<span style={{fontSize: 16, color: "var(--muted)"}}> /mo</span></p>
            <p className="rm-hero-sub">Recurring spend across {activeSubs.length} subscriptions and bills</p>

            <div style={{ marginBottom: 28 }}>
              <ConnectBank onLinked={(data) => console.log("Linked:", data)} />
            </div>

            {flaggedActive.length > 0 && (
              <div className="rm-callout">
                <AlertTriangle />
                <div>
                  <div className="rm-callout-text">
                    <b>{fmt(potentialSavings)}/mo</b> sitting in {flaggedActive.length} subscriptions with little to no recent activity.
                  </div>
                  <button className="rm-callout-btn" onClick={() => { setView("subscriptions"); setSubFilter("active"); }}>
                    Review flagged subscriptions
                  </button>
                </div>
              </div>
            )}

            <div className="rm-two-col">
              <div>
                <h2 className="rm-section-title">Spend by category</h2>
                {categoryRows.map(([cat, amt]) => (
                  <div className="rm-cat-row" key={cat}>
                    <span>{cat}</span>
                    <div className="rm-cat-track">
                      <div className="rm-cat-fill" style={{ width: `${(amt / maxCategory) * 100}%` }} />
                    </div>
                    <span className="rm-cat-amount">{fmt(amt)}</span>
                  </div>
                ))}
              </div>

              <div>
                <h2 className="rm-section-title">Recent activity</h2>
                {transactions.map((t) => (
                  <div className="rm-txn-row" key={t.id}>
                    <div className="rm-txn-left">
                      <span>{t.merchant}</span>
                      {t.sub && <span className="rm-txn-badge">Subscription</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="rm-txn-date">{t.date}</span>
                      <span className="rm-txn-amount">{fmt(t.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {view === "subscriptions" && (
          <>
            <p className="rm-eyebrow">Subscriptions</p>
            <p className="rm-hero-number" style={{ fontSize: 32 }}>{fmt(totalMonthly)}<span style={{fontSize: 14, color: "var(--muted)"}}> /mo active</span></p>
            <div style={{ marginTop: 24 }} />
            <div className="rm-filters">
              {["active", "cancelled", "all"].map((f) => (
                <button
                  key={f}
                  className={`rm-filter-btn ${subFilter === f ? "active" : ""}`}
                  onClick={() => setSubFilter(f)}
                >
                  {f === "active" ? "Active" : f === "cancelled" ? "Cancelled" : "All"}
                </button>
              ))}
            </div>

            {filteredSubs.map((s) => (
              <div className="rm-sub-row" key={s.id}>
                <div>
                  <div>
                    <span className="rm-sub-name">{s.name}</span>
                    {s.flagged && s.status === "active" && <span className="rm-flag-badge">Barely used</span>}
                  </div>
                  <div className="rm-sub-meta">{s.category} · {s.note}</div>
                </div>
                <div className="rm-sub-actions">
                  <div style={{ textAlign: "right" }}>
                    <div className="rm-sub-amount">{fmt(s.amount)}</div>
                    <div className="rm-sub-cycle">{s.cycle === "yearly" ? "billed yearly" : "billed monthly"}</div>
                  </div>
                  {s.status === "active" ? (
                    confirmId === s.id ? (
                      <>
                        <button className="rm-btn confirm" onClick={() => cancelSub(s.id)}>
                          <Check /> Confirm
                        </button>
                        <button className="rm-btn" onClick={() => setConfirmId(null)}>
                          <X /> Keep it
                        </button>
                      </>
                    ) : (
                      <button className="rm-btn danger" onClick={() => setConfirmId(s.id)}>
                        <X /> Cancel
                      </button>
                    )
                  ) : (
                    <button className="rm-btn" onClick={() => reactivateSub(s.id)}>
                      <RotateCcw /> Reactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredSubs.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 20 }}>Nothing here yet.</p>
            )}
          </>
        )}

        {view === "budgets" && (
          <>
            <p className="rm-eyebrow">Budgets</p>
            <p className="rm-hero-number" style={{ fontSize: 32 }}>This month</p>
            <p className="rm-hero-sub">Set a monthly limit per category and track where you stand</p>

            {budgets.map((b) => {
              const spent = b.standalone
                ? b.spentOverride
                : activeSubs.filter((s) => s.category === b.category).reduce((sum, s) => sum + monthly(s), 0);
              const pct = Math.min((spent / b.limit) * 100, 100);
              const over = spent > b.limit;
              const fillColor = over ? "var(--red)" : pct > 80 ? "var(--amber)" : "var(--accent)";
              return (
                <div className="rm-budget-row" key={b.category}>
                  <div className="rm-budget-top">
                    <span className="rm-budget-cat">{b.category}</span>
                    <span className="rm-budget-nums">
                      {fmt(spent)} of{" "}
                      <input
                        className="rm-limit-input"
                        type="number"
                        value={b.limit}
                        onChange={(e) => updateBudgetLimit(b.category, Number(e.target.value) || 0)}
                      />
                    </span>
                  </div>
                  <div className="rm-budget-track">
                    <div className="rm-budget-fill" style={{ width: `${pct}%`, background: fillColor }} />
                  </div>
                  <div className="rm-budget-foot">
                    <span className="rm-budget-status" style={{ color: fillColor }}>
                      {over ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <ArrowUpRight size={12} /> {fmt(spent - b.limit)} over
                        </span>
                      ) : (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <ArrowDownRight size={12} /> {fmt(b.limit - spent)} left
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {view === "loans" && (
          <>
            <p className="rm-eyebrow">Student loans</p>
            <p className="rm-hero-number">
              {fmt(totalLoanBalance)}
              <span style={{ fontSize: 16, color: "var(--muted)" }}> owed</span>
            </p>
            <p className="rm-hero-sub">
              {fmt(totalLoanMinPayment)}/mo minimum across {studentLoans.length} loans · {weightedRate.toFixed(2)}% avg. rate
            </p>

            {overdueLoanCount > 0 && (
              <div className="rm-callout">
                <AlertTriangle />
                <div>
                  <div className="rm-callout-text">
                    <b>{overdueLoanCount} loan{overdueLoanCount > 1 ? "s" : ""}</b> {overdueLoanCount > 1 ? "are" : "is"} past due. Catching up avoids added interest and servicer penalties.
                  </div>
                </div>
              </div>
            )}

            {studentLoans.map((loan) => {
              const paidPct = Math.min(
                ((loan.originalPrincipal - loan.principalBalance) / loan.originalPrincipal) * 100,
                100
              );
              return (
                <div className="rm-sub-row" key={loan.id} style={{ flexWrap: "wrap" }}>
                  <div>
                    <div>
                      <span className="rm-sub-name">{loan.loanName}</span>
                      {loan.status === "overdue" && <span className="rm-flag-badge" style={{ background: "var(--red-soft)", color: "var(--red)" }}>Past due</span>}
                    </div>
                    <div className="rm-sub-meta">
                      {loan.servicer} · {loan.interestRate}% APR · next payment {loan.nextPaymentDate}
                    </div>
                    <div className="rm-budget-track" style={{ width: 200, marginTop: 10 }}>
                      <div className="rm-budget-fill" style={{ width: `${paidPct}%`, background: "var(--accent)" }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 4 }}>
                      {paidPct.toFixed(0)}% paid off of {fmt(loan.originalPrincipal)} original
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="rm-sub-amount">{fmt(loan.principalBalance)}</div>
                    <div className="rm-sub-cycle">{fmt(loan.minimumPayment)}/mo min</div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </main>
    </div>
  );
}
