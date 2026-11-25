// D3 remainder: sanity-check the CL quote math against the pool's own mid price.
// If quote($tiny) doesn't reproduce the mid, the math is wrong -- fail loudly.
const sqrtP = 65258625546667351288175650324n;
const L = 33093483985583n;
const fee = 338n;

// mid: NVDAc per USDC = (sqrtP/2^96)^2 * 10^(dec0-dec1) = *1e-2  => USD per NVDAc
const nvdaPerUsdc = (Number(sqrtP) / 2 ** 96) ** 2 * 1e-2;
const mid = 1 / nvdaPerUsdc;

function quote(usd) {
  const aIn = BigInt(Math.round(usd * 1e6));
  const a = aIn - (aIn * fee) / 1000000n;
  // zeroForOne (USDC -> token): sqrtP decreases; sqrtP_new = L*sqrtP*2^96 / (L*2^96 + a*sqrtP)
  const sNew = (L * sqrtP * (1n << 96n)) / (L * (1n << 96n) + a * sqrtP);
  const out = (L * (sqrtP - sNew)) / (1n << 96n);
  return Number(out) / 1e8;
}

const tiny = quote(0.01);
console.log("mid from sqrtP:", mid.toFixed(4), "| tiny quote exec:", (0.01 / tiny).toFixed(4));
if (Math.abs(0.01 / tiny - mid) / mid > 0.01) {
  console.error("FAIL: quote math does not reproduce mid");
  process.exit(1);
}
for (const usd of [10, 100, 1000]) {
  const t = quote(usd);
  const exec = usd / t;
  const bps = (exec / mid - 1) * 1e4;
  console.log(`$${usd} buy: ${t.toFixed(4)} NVDAc, exec $${exec.toFixed(2)}, impact ${bps.toFixed(1)} bps`);
}
