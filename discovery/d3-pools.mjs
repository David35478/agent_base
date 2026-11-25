// D3: pool discovery for feed-backed tokens via DexScreener
import { readFileSync, writeFileSync } from "node:fs";
const tokens = JSON.parse(readFileSync("discovery/tokens.json", "utf8"));
const feeds = JSON.parse(readFileSync("/tmp/feeds.json", "utf8")).nav_feeds;
const feedMap = new Map(feeds.map(f => [f.contract_address.toLowerCase(), f.nav_feed_address]));
const rows = [];
for (const t of tokens) {
  const addr = t.contract_address;
  if (!feedMap.has(addr.toLowerCase())) continue;
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addr}`);
    const j = await r.json();
    const pairs = (j.pairs || []).filter(p => p.quoteToken?.symbol === "USDC");
    pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
    const top = pairs.slice(0, 3).map(p => ({
      dex: p.dexId, pool: p.pairAddress, liq_usd: Math.round(p.liquidity?.usd || 0),
      price: Number(p.priceUsd), txns24h: p.txns?.h24 ? (p.txns.h24.buys + p.txns.h24.sells) : 0,
      vol24h: Math.round(p.volume?.h24 || 0),
    }));
    rows.push({ symbol: t.symbol, address: addr, nav_feed: feedMap.get(addr.toLowerCase()), pools: top });
    console.log(t.symbol, JSON.stringify(top));
  } catch (e) { console.error(t.symbol, "ERR", String(e)); }
  await new Promise(res => setTimeout(res, 1500));
}
writeFileSync("discovery/pools.json", JSON.stringify(rows, null, 2));
console.log("done", rows.length);
