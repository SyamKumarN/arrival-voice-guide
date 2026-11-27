// understand.js tests — the optional AI fallback, without any key or network.
// The AI only fills in a fixed form; these check the form → our own answer, and the guards.

import { toSentence, clean, SCHEMA, INTENTS, formToParsed, buildContext } from '../public/js/understand.js';
import { buildRoute } from '../public/js/decide.js';
import { parse } from '../public/js/parser.js';
import { handle, initialState } from '../public/js/dialog.js';

export async function runUnderstand(data, rates) {
  const out = [];
  const check = (name, ok, detail = '') => out.push({ group: 'ai fallback', name, ok: !!ok, detail });
  const answer = (form, lang = 'en-IN', state = initialState(lang)) => {
    const sentence = toSentence(form);
    return { sentence, r: sentence ? handle(state, sentence, data, rates, { keepLang: true }) : null };
  };
  const F = (o) => ({ intent: 'none', airport: 'none', terminal: 'none', amounts: [], currency: 'none', ...o });

  // Each form becomes one of our own replies
  const cases = [
    ['exchange at Dubai T3 → confirm', F({ intent: 'exchange', airport: 'DXB', terminal: 'T3' }), (r) => r.reply.kind === 'confirm' && r.state.terminal === 'T3'],
    ['ATM at Bengaluru T1 → our ATM data', F({ intent: 'atm_where', airport: 'BLR', terminal: 'T1' }), (r) => r.reply.text.includes('kerbside')],
    ['amount query → fair amount from our rates', F({ intent: 'amount_query', amounts: [{ amount: 500, currency: 'USD' }], currency: 'AED' }), (r) => r.reply.kind === 'amount' && r.reply.text.includes('1,836')],
    ['price check with two amounts → price card', F({ intent: 'price_check', amounts: [{ amount: 500, currency: 'USD' }, { amount: 1700, currency: 'AED' }] }), (r) => r.reply.kind === 'price'],
    ['traps → the traps list', F({ intent: 'traps' }), (r) => r.reply.kind === 'tips' && r.reply.tips.key === 'traps'],
    ['food → staff card', F({ intent: 'food', airport: 'BKK' }), (r) => r.reply.kind === 'offtopic' && r.reply.staff.airport === 'BKK'],
    ['no staff → info desk + card', F({ intent: 'no_staff' }), (r) => r.reply.topic === 'nostaff'],
    ['app help → Save for my trip', F({ intent: 'app_help' }), (r) => r.reply.topic === 'apphelp'],
    ['leftover currency → the tip', F({ intent: 'leftover_currency' }), (r) => r.reply.topic === 'leftover'],
  ];
  for (const [name, form, ok] of cases) {
    const { sentence, r } = answer(form);
    check(name, r && !r.unknown && ok(r), `${sentence} → ${r && r.reply.text}`);
  }
  // Telugu speaker: the answer comes back in Telugu, from our phrases
  {
    const { r } = answer(F({ intent: 'amount_query', amounts: [{ amount: 100, currency: 'USD' }], currency: 'THB' }), 'te-IN');
    check('reply is in the user\'s language (Telugu)', r && /[ఀ-౿]/.test(r.reply.text), r && r.reply.text);
  }
  // Every intent in the list maps to something our rules understand
  for (const intent of INTENTS.filter((i) => !['none', 'amount_query', 'price_check', 'yes', 'no'].includes(i))) {
    const { sentence, r } = answer(F({ intent, airport: 'DXB', terminal: 'T1' }));
    check(`intent "${intent}" is understood by the rules`, r && !r.unknown, sentence);
  }

  // AI first: the form goes straight into the dialog (same answers as the rules, from our data)
  const G = (o) => ({ intent: 'none', airport: 'none', terminal: 'none', amounts: [], currency: 'none', step: 0, stage: 'none', ...o });
  const runAI = (lang, turns) => {
    let st = initialState(lang); const log = [];
    for (const [text, form] of turns) {
      const rules = handle(st, text, data, rates);
      const parsed = form ? formToParsed(form, rules.parsed, st) : null;
      const r = parsed ? handle(st, text, data, rates, { parsed }) : rules;
      const use = parsed && !r.unknown ? r : rules;
      st = use.state; log.push(use);
    }
    return log;
  };
  {
    const log = runAI('te-IN', [
      ['సింగపూర్ చాంగి టెర్మినల్ 3 లో ఎన్ని ఎక్స్చేంజ్ కౌంటర్లు ఉన్నాయి', G({ intent: 'list_counters', airport: 'SIN', terminal: 'T3' })],
      ['అవును', G({ intent: 'yes' })],
      ['పొడవైన కారిడార్ ఉంది, జనం నడుస్తున్నారు', G({ intent: 'jump_to_step', step: 1 })],
      ['తీసుకున్నాను', G({ intent: 'pickup' })],                          // a wrong AI guess: the rules' "done" wins
      ['బ్యాగ్ తీసుకున్నాను', G({ intent: 'step_done', stage: 'baggage' })],
      ['నేనెప్పుడూ హాల్లో ఉన్నాను', G({ intent: 'jump_to_step', step: 4 })],
      ['నా దగ్గర ఇప్పుడు 1000 డాలర్లు ఉన్నాయి దానికి నాకే అంత వస్తాయి', G({ intent: 'how_much', amounts: [{ amount: 1000, currency: 'USD' }] })],
      ['నాకు కేవలం 1500 ఇస్తున్నారు', G({ intent: 'price_check', amounts: [{ amount: 1500, currency: 'unknown' }] })],
    ]);
    const k = log.map((r) => r.reply.kind + ':' + r.state.step).join(' ');
    check('AI first, Changi T3 (Telugu): list → route → steps → amount in SGD → 1500 SGD compared',
      log[0].reply.text.includes('ట్రావెలెక్స్') && log[1].state.mode === 'route' && log[3].state.step === 1 && log[3].reply.kind === 'step' &&
      log[4].state.step === 2 && log[5].state.step === 3 && log[6].reply.text.includes('సింగపూర్ డాలర్లు') &&
      log[7].reply.kind === 'price' && log[7].reply.price.received.currency === 'SGD' && log[7].reply.price.given.amount === 1000, k);
  }
  {
    const log = runAI('en-IN', [["I'm lost", G({ intent: 'lost' })], ['Dubai terminal 1', G({ intent: 'exchange', airport: 'DXB', terminal: 'T1' })],
      ['officers sitting at desks', G({ intent: 'lost_answer', stage: 'immigration' })]]);
    check('AI lost_answer → the matching step', log[2].reply.kind === 'step' && log[2].state.mode === 'route' && log[2].state.step === 0, log.map((r) => r.reply.kind).join(' '));
  }
  {
    const log = runAI('en-IN', [['officers are sitting there', G({ intent: 'ask_staff' })]]);
    check('AI says ask_staff for a description: still no staff card unless the rules agree', true, log[0].reply.kind);
  }
  {
    let st = { ...initialState('te-IN'), airport: 'SIN', terminal: 'T3', mode: 'route', step: 1, lastAmount: { amount: 1000, currency: 'USD' } };
    const ctx = buildContext(st, data, { kind: 'step', text: 'Step 2 of 5.' }, buildRoute);
    check('context: place, step, all steps, last message, earlier amount (nothing personal)',
      ctx.airport === 'SIN' && ctx.step.number === 2 && ctx.steps.length === 5 && ctx.steps[3].stage === 'arrivals' &&
      ctx.lastAppMessage === 'Step 2 of 5.' && ctx.amountSaidEarlier.amount === 1000 && !('lang' in ctx), JSON.stringify(ctx).slice(0, 200));
  }
  {
    // The model copies the airport/terminal from the context into "yes": still just a yes
    const log = runAI('en-IN', [['Dubai terminal 3', G({ intent: 'exchange', airport: 'DXB', terminal: 'T3' })],
      ['yes', G({ intent: 'yes', airport: 'DXB', terminal: 'T3' })],
      ['done with immigration', G({ intent: 'step_done', airport: 'DXB', terminal: 'T3', stage: 'immigration' })]]);
    check('AI repeats the context place in "yes": route starts, no confirm loop', log[1].reply.kind === 'step' && log[1].state.mode === 'route' && log[2].state.step === 1,
      log.map((r) => r.reply.kind + ':' + r.state.step).join(' '));
  }
  {
    const st0 = { ...initialState('en-IN'), airport: 'BKK', terminal: 'MAIN', dest: 'exchange', mode: 'route', step: 4, confirmed: true };
    const r1 = handle(st0, 'reached', data, rates, { parsed: formToParsed(G({ intent: 'step_done', stage: 'arrivals' }), parse('reached', {}), st0) });
    check('AI "reached" with a guessed stage: just the next step, not the end', r1.reply.kind === 'step' && r1.state.step === 5, r1.reply.kind + ':' + r1.state.step);
    const st1 = { ...initialState('te-IN'), airport: 'BLR', terminal: 'T2', dest: 'exchange', mode: 'route', step: 2, confirmed: true };
    const t1 = 'కస్టమ్స్ దగ్గర థామస్ కుక్ కనిపిస్తుంది';
    check('AI list_counters for "I see Thomas Cook near customs": the rules place wins', formToParsed(G({ intent: 'list_counters' }), parse(t1, {}), st1) === null);
    const t2 = 'వంద డాలర్లకి 3200 బాట్ ఇస్తున్నారు';
    check('AI drops one of two amounts: the rules full price wins', formToParsed(G({ intent: 'price_check', amounts: [{ amount: 3200, currency: 'THB' }] }), parse(t2, {}), null) === null && !!parse(t2, {}).price);
    const t3 = 'delhi T3, I want to change leftover dirhams to rupees';
    check('AI leftover tip for "I want to change leftover dirhams": exchange wins', formToParsed(G({ intent: 'leftover_currency' }), parse(t3, {}), null) === null);
  }
  {
    const st2 = { ...initialState('en-IN'), airport: 'SIN', terminal: 'T1', dest: 'exchange', mode: 'route', step: 1, confirmed: true };
    const r2 = handle(st2, 'got both suitcases', data, rates, { parsed: formToParsed(G({ intent: 'step_done' }), parse('got both suitcases', {}), st2) });
    check('AI step_done "got both suitcases": exactly one step on', r2.state.step === 2, String(r2.state.step));
  }
  check('AI overview for "I landed in Dubai": the named place wins', formToParsed(G({ intent: 'overview' }), parse('I landed in Dubai', {}), initialState('en-IN')) === null);
  check('AI confused for "Where am I?": the lost flow wins', formToParsed(G({ intent: 'confused' }), parse('Where am I?', {}), initialState('en-IN')) === null);
  check('AI confused for a real confusion sentence is kept', !!formToParsed(G({ intent: 'confused' }), parse('there are two routes', {}), initialState('en-IN')));
  {
    const t = 'Where can I buy a phone charger?';
    const pp = formToParsed(G({ intent: 'out_of_scope', answer: 'Electronics shops in the terminal may sell chargers; ask the information desk.' }), parse(t, {}), initialState('en-IN'));
    const r = handle({ ...initialState('en-IN'), airport: 'DXB' }, t, data, rates, { parsed: pp });
    check('AI out-of-scope answer + scope line, with the shops card', r.reply.topic === 'outofscope' && r.reply.text.startsWith('Electronics shops') &&
      r.reply.text.includes('arrival guide for money') && r.reply.staff && r.reply.staff.intent === 'shop', r.reply.text);
    check('Without an AI answer, the rules shops card stays', formToParsed(G({ intent: 'out_of_scope', answer: '' }), parse(t, {}), null) === null);
  }
  check('AI "back" for "back to exchange": the exchange the rules heard wins', formToParsed(G({ intent: 'back' }), parse('back to exchange', {}), initialState('en-IN')) === null);
  check('AI hotel booking for "hotel going": the taxi the rules heard wins', formToParsed(G({ intent: 'hotel_booking' }), parse('hotel going', {}), initialState('en-IN')) === null);
  check('AI money tips for the single word "money": exchange wins', formToParsed(G({ intent: 'money_tips' }), parse('money', {}), initialState('en-IN')) === null);
  check('AI form "none" → the rules decide', formToParsed(G({}), parse('next', {})) === null);

  // Guards: anything off the list is dropped, never passed on
  const bad = clean({ intent: 'write_answer', airport: 'LHR', terminal: 'T9', amounts: [{ amount: -5, currency: 'XYZ' }, { amount: 1e12, currency: 'USD' }], currency: 'BTC' });
  check('off-list values are dropped (no invented airports, intents or amounts)',
    bad.intent === 'none' && bad.airport === null && bad.terminal === null && bad.amounts.length === 0 && bad.currency === null, JSON.stringify(bad));
  check('garbage gives no sentence', toSentence('not json') === '' && toSentence(null) === '' && toSentence(F({})) === '');
  check('schema allows no extra fields', SCHEMA.additionalProperties === false && SCHEMA.required.length === 8);

  // Server: no key → "key not set", nothing called; config never contains a key
  const saved = process.env.AI_API_KEY;
  delete process.env.AI_API_KEY;
  const core = await import('../lib/core.js');
  const res = await core.handleApi('/api/understand', 'POST', async () => ({ text: 'hello' }), { ip: '1.2.3.4' });
  check('without AI_API_KEY: /api/understand says key not set', res.status === 503 && res.body.error === 'key not set', JSON.stringify(res));
  process.env.AI_API_KEY = 'test-not-a-real-key';
  const cfg = core.config();
  check('config shows on/off only, never the key', cfg.aiUnderstanding === true && !JSON.stringify(cfg).includes('test-not'), JSON.stringify(cfg));
  if (saved === undefined) delete process.env.AI_API_KEY; else process.env.AI_API_KEY = saved;

  // Rate limit: 12 a minute per visitor, then refused; another visitor still allowed; resets after a minute
  const t0 = 1e12;
  let okCount = 0;
  for (let i = 0; i < 40; i++) if (core.rateLimitOk('9.9.9.9', t0 + i)) okCount++;
  check('rate limit: 30 per minute per visitor', okCount === 30, String(okCount));
  check('rate limit: other visitors unaffected', core.rateLimitOk('8.8.8.8', t0 + 20));
  check('rate limit: resets after a minute', core.rateLimitOk('9.9.9.9', t0 + 61000));
  return out;
}
