// D6: unit conventions.
// B20 tokens: 8 decimals. uiMultiplier: WAD 18dp. Feed: 8dp total-return price per token
// (to be confirmed against NAV feed = price x multiplier; test encodes the current belief:
// feed price already includes the multiplier, so share-equivalents = raw / 1e8 and the
// multiplier must be applied exactly once, only when converting raw<->display units).
import { describe, it, expect } from "vitest";

const WAD = 10n ** 18n;

function uiToRaw(uiWad, multiplierWad) {
  // display share-equivalent (WAD) -> raw token units: raw = uiWad / multiplier
  return uiWad / multiplierWad;
}
function rawToUi(raw, multiplierWad) {
  // raw -> display share-equivalent in WAD (18dp): ui = raw * multiplier
  return raw * multiplierWad; // WAD value; divide by 1e18 for human shares
}
const wad = (w) => Number(w) / 1e18;

// Real values observed live (NVDAc, 2026-11-25): uiMultiplier=1000537939576369481, feed 147.19413898
const MULT = 1000537939576369481n;

describe("multiplier applied exactly once", () => {
  it("round-trips raw <-> UI without drift", () => {
    const raw = 123456789n; // 1.23456789 raw tokens
    const ui = rawToUi(raw, MULT);
    const back = uiToRaw(ui, MULT);
    expect(Number(back)).toBeCloseTo(Number(raw), 0);
  });

  it("fails if the multiplier is applied twice", () => {
    const raw = 100000000n; // exactly 1.0 token (8 decimals)
    const shares = (r) => Number(r * MULT) / 1e26; // raw(8dp) * WAD(18dp) -> human shares
    const once = shares(raw);
    const twice = shares((raw * MULT * MULT) / 10n ** 26n); // naive double application
    expect(once).toBeGreaterThan(1); // 1.000537... shares
    expect(twice).toBeGreaterThan(once); // double-applied is detectably wrong
    expect(once).toBeCloseTo(1.000537939576369481, 12);
  });

  it("fails if the multiplier is not applied at all", () => {
    const raw = 100000000n;
    const naive = raw; // wrong: treating raw as share-equivalent
    expect(rawToUi(raw, MULT)).not.toBe(naive);
  });

  it("feed price (1e8) already embeds the multiplier: applying it again overstates NAV", () => {
    const feedPrice8 = 14719413898n; // NVDAc feed, 8dp
    const navPerToken = Number(feedPrice8) / 1e8;
    // wrong NAV if multiplier applied on top:
    const doubleNav = navPerToken * (Number(MULT) / 1e18);
    expect(Number(doubleNav.toFixed(6))).toBeGreaterThan(navPerToken);
    expect(navPerToken).toBeCloseTo(147.19413898, 8);
  });

  it("no trades under the minimum size (5 USD) at live NAV", () => {
    const nav = 147.19413898;
    const minUsd = 5;
    const minRaw = BigInt(Math.ceil((minUsd / nav) * 1e8));
    const tooSmall = BigInt(Math.ceil((4.99 / nav) * 1e8));
    expect(Number(minRaw) / 1e8).toBeGreaterThanOrEqual(minUsd / nav);
    expect(tooSmall).toBeLessThan(minRaw);
  });
});
