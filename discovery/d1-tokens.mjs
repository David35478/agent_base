// D1: pull all tokenized stocks (paginated) -> discovery/tokens.json
const BASE = "https://api.coinbase.com/v1/tokenized-stocks";
let out = [], page;
do {
  const url = BASE + (page ? `?next_page_token=${page}` : "");
  let j;
  for (let attempt = 1; ; attempt++) {
    const r = await fetch(url);
    if (r.ok) { j = await r.json(); break; }
    if (r.status === 429 && attempt <= 6) {
      const wait = 15000 * attempt;
      console.error(`429, waiting ${wait / 1000}s (attempt ${attempt})`);
      await new Promise(res => setTimeout(res, wait));
      continue;
    }
    throw new Error(`${r.status} ${await r.text()}`);
  }
  out.push(...j.tokens);
  console.error(`page: ${j.tokens.length} tokens (total ${out.length})`);
  page = j.next_page_token;
  if (page) await new Promise(res => setTimeout(res, 12000));
} while (page);
console.log("tokens:", out.length);
const fields = ["contract_address","symbol","name","decimals","multiplier","total_supply","isin","first_mint_date"];
console.table(out.map(t => {
  const o = {}; for (const f of fields) o[f] = t[f]; return o;
}));
await Bun.write("discovery/tokens.json", JSON.stringify(out, null, 2));
