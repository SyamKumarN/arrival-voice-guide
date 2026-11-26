// price.js — compare a counter's offer with the mid-market rate.

/** Mid-market rate: how many `to` you get for one `from`. Rates are per 1 USD. */
export function midRate(rates, from, to) {
  const r = rates && rates.rates;
  if (!r || !r[from] || !r[to]) return null;
  return r[to] / r[from];
}

/**
 * offer = { given: {amount, currency}, received: {amount, currency} }
 * Returns the fair amount, the % difference and a verdict:
 *   fair  — within 1.5% of mid-market
 *   ok    — 1.5–4% below (a normal airport margin)
 *   high  — 4–8% below (pricey)
 *   bad   — more than 8% below
 *   check — noticeably MORE than mid-market (usually a misheard number or hidden fee)
 */
export function comparePrice(offer, rates) {
  const { given, received } = offer;
  const rate = midRate(rates, given.currency, received.currency);
  if (!rate || !given.amount) return null;
  const fair = given.amount * rate;
  const diffPct = ((received.amount - fair) / fair) * 100;
  let verdict;
  if (diffPct > 2) verdict = 'check';
  else if (diffPct >= -1.5) verdict = 'fair';
  else if (diffPct >= -4) verdict = 'ok';
  else if (diffPct >= -8) verdict = 'high';
  else verdict = 'bad';
  return {
    given, received,
    fair,
    offered: received.amount,
    diffPct,
    marketRate: rate,                               // 1 given = x received
    offeredRate: received.amount / given.amount,
    verdict,
  };
}

/** Round money for speaking: whole numbers above 100, two decimals below. */
export function roundMoney(n) {
  return Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 100) / 100;
}

/** "1,836" in Indian-style grouping, which reads well in all three languages. */
export function formatMoney(n) {
  return roundMoney(n).toLocaleString('en-IN');
}
