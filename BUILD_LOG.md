# BUILD_LOG.md — AfterHours

Market-hours-aware, agent-managed rebalancer for Coinbase tokenized stocks (B20) on Base.
Track: Agentic Stock Finance, Base Stocks Maxxing Season. Submit by Dec 4, 2026.

---

## Session 1 — 2026-11-25 — Discovery (D1–D6)

**Done**
- Read https://docs.base.org/llms.txt; confirmed Coinbase tokenized-stocks REST surface.
- Cloned https://github.com/base/base-std (cast 1.10.0 installed). Verified from source (`src/interfaces/IERC8056.sol`, `IB20Asset.sol`):
  - `uiMultiplier()` is an 18-decimal WAD (1e18 = 1.0) that rescales the *displayed* balance; `balanceOfUI(account)` returns the share-equivalent balance.
  - `IB20Asset` has scheduled multiplier changes: `updateUIMultiplier(newMultiplier, effectiveAt)` (future effectiveAt required; single live pending update), `cancelUIMultiplierUpdate()`; events `MultiplierUpdated` (legacy, emitted alongside), `UIMultiplierUpdateCancelled`, `Announcement(caller,id,description,uri)`, `EndAnnouncement(id)`.
  - Base `IB20` pausing: `pausedFeatures()`, `isPaused(feature)`, events `Paused/Unpaused`; transfer policies via `policyId(TRANSFER_SENDER_POLICY|TRANSFER_RECEIVER_POLICY|TRANSFER_EXECUTOR_POLICY)`.
  - Note: approval is NOT policy-gated; transfer is.
- D1 token pull in progress (API rate-limits aggressively: 429s; script retries with backoff, 12s between pages).

**Next**
- D2: nav-feeds mapping + latestRoundData ages onchain.
- D3: DEX pool discovery vs USDC on Aerodrome.
- D4–D6: universe selection, policy/pause read verification, unit-convention test.

**Blockers**
- Coinbase API rate limiting (429) — pacing to ~12s/request; full pull is slow.

**Postable line**
"Discovery day for AfterHours: verified the B20 multiplier interface straight from base-std source and mapped the tokenized-stocks API — the Guardian will read share-equivalent balances from chain, never a hardcoded 1:1."
