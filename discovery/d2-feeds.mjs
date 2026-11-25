// D2: map tokens to nav feeds, read latestRoundData ages via cast
import { readFileSync, writeFileSync } from "node:fs";
const tokens = JSON.parse(readFileSync("discovery/tokens.json", "utf8"));
const RPC = process.env.BASE_RPC_URL || "https://mainnet.base.org";

// nav-feeds pulls one ticker at a time, spaced to respect 429s
async function get(url, tries = 6) {
  for (let a = 1; ; a++) {
    const r = await fetch(url);
    if (r.ok) return r.json();
    if (r.status === 429 && a <= tries) {
      await new Promise(res => setTimeout(res, 15000 * a));
      continue;
    }
    throw new Error(`${r.status} ${url}`);
  }
}

const rows = [];
for (const t of tokens) {
  const ticker = t.symbol;
  try {
    const j = await get(`https://api.coinbase.com/v1/tokenized-stocks/nav-feeds?ticker=${encodeURIComponent(ticker)}`);
    rows.push({ symbol: ticker, address: t.contract_address, feeds: j });
    console.log(ticker, JSON.stringify(j).slice(0, 300));
  } catch (e) {
    rows.push({ symbol: ticker, address: t.contract_address, error: String(e) });
    console.error(ticker, "ERR", e.message);
  }
  await new Promise(res => setTimeout(res, 12000));
}
writeFileSync("discovery/nav-feeds.json", JSON.stringify(rows, null, 2));
console.log("done", rows.length);
