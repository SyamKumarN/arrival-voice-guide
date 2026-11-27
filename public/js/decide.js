// decide.js — the "Decide" layer: pick the fair counter and build the route.

// "unknown" = the rate hasn't been compared yet: after fair counters, before pricier ones
const QUALITY_RANK = { good: 0, fair: 1, unknown: 1.5, pricey: 2 };
export const DESTINATIONS = ['exchange', 'sim', 'taxi', 'exit'];
// Last step of "just guide me out" (the earlier steps are each airport's own)
const EXIT_STEP = {
  en: 'Follow the Exit signs into the public arrivals hall. Taxis, SIM counters and money exchange are signposted from there.',
  hi: 'Exit के बोर्ड देखते हुए बाहर अराइवल्स हॉल में आइए। टैक्सी, सिम काउंटर और एक्सचेंज के बोर्ड वहीं से दिखते हैं।',
  te: 'Exit బోర్డులు చూస్తూ బయట అరైవల్స్ హాల్‌లోకి రండి. టాక్సీ, సిమ్ కౌంటర్లు, ఎక్స్ఛేంజ్ బోర్డులు అక్కడి నుంచే కనిపిస్తాయి.',
  stage: 'arrivals',
};

/** Counters in one terminal, best first (better rate, then landside). */
export function rankCounters(airport, terminal) {
  return airport.counters
    .filter((c) => c.terminal === terminal)
    .sort((a, b) =>
      (QUALITY_RANK[a.quality] - QUALITY_RANK[b.quality]) ||
      ((a.side === 'landside' ? 0 : 1) - (b.side === 'landside' ? 0 : 1)));
}

/** Does this airport have a step-by-step route for the destination? */
export function hasRoute(data, code, dest = 'exchange') {
  const a = data.airports[code];
  if (!a || !dest) return false;
  return dest === 'exchange' || dest === 'exit' ? !!a.routes : !!(a[dest] && a[dest].routes);
}

/**
 * Build everything the guide needs for one airport + terminal + destination.
 * Returns null if there is no route for that combination.
 */
export function buildRoute(data, code, terminal, dest = 'exchange') {
  const airport = data.airports[code];
  if (!airport) return null;
  if (!dest) return null;
  const src = dest === 'exchange' || dest === 'exit' ? airport : airport[dest];
  const all = src && src.routes && src.routes[terminal];
  if (!all) return null;
  // The way out: the airport's steps through customs, then the exit
  const ids = dest === 'exit' ? all.filter((id) => airport.steps[id].stage !== 'arrivals') : all;
  const ranked = dest === 'exchange' ? rankCounters(airport, terminal) : [];
  return {
    code,
    terminal,
    dest,
    name: airport.name,
    currency: airport.currency,
    lastChecked: airport.lastChecked || null,
    pendingData: !!airport.pendingData,
    counter: ranked[0] || null,
    avoid: ranked.filter((c) => c.quality === 'pricey'),
    steps: ids.map((id) => ({ id, text: airport.steps[id], stage: airport.steps[id].stage }))
      .concat(dest === 'exit' ? [{ id: 'exit_hall', text: EXIT_STEP, stage: 'arrivals' }] : []),
    // Where the route finishes: at a counter (default) or at an ATM (e.g. Bengaluru T1, no counter)
    endsAt: dest === 'exit' ? 'exit' : airport.steps[ids[ids.length - 1]].endsAt || 'counter',
    warnings: dest === 'exchange' ? (airport.warnings || []) : [],
    fallback: src.fallback || airport.fallback,
  };
}

/** Terminals for an airport, e.g. ["T1","T2","T3"]. Single-terminal airports return ["MAIN"]. */
export function terminalsOf(data, code) {
  return (data.airports[code] && data.airports[code].terminals) || [];
}

const STAGE_ORDER = ['immigration', 'baggage', 'customs', 'arrivals'];

/**
 * "I'm lost" → "I can see baggage belts": the step to continue from.
 * Picks the first step at that stage, or the first one after it.
 */
export function stepForStage(route, stage) {
  const want = STAGE_ORDER.indexOf(stage);
  if (want < 0) return -1;
  const i = route.steps.findIndex((s) => STAGE_ORDER.indexOf(s.stage) >= want);
  return i;
}
