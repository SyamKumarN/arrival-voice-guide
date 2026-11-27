// resume.js — refresh-safe trips and short spoken answers.
import { handle, initialState, snapshot, restore } from '../public/js/dialog.js';
import { say } from '../public/js/phrases.js';

export function runResume(data, rates) {
  const out = [];
  const check = (group, name, ok, detail = '') => out.push({ group, name, ok: !!ok, detail });

  // A Telugu route at Dubai T3, step 3 → refresh → "Continuing from step 3"
  let st = initialState('te-IN');
  for (const t of ['దుబాయ్ టెర్మినల్ 3', 'అవును', 'తర్వాత', 'తర్వాత']) st = handle(st, t, data, rates).state;
  const saved = JSON.parse(JSON.stringify(snapshot(st)));
  const back = restore(saved, data);
  check('resume', 'refresh mid-route: same airport, terminal, step and language',
    back && back.state.airport === 'DXB' && back.state.terminal === 'T3' && back.state.step === 2 && back.state.mode === 'route' && back.state.lang === 'te-IN', JSON.stringify(back && back.state));
  check('resume', 'refresh mid-route: says "continuing from step 3" in Telugu', back && back.reply && back.reply.text.startsWith('3వ అడుగు నుంచి కొనసాగిస్తున్నాం.'), back && back.reply && back.reply.text);
  const next = handle(back.state, 'తర్వాత', data, rates);
  check('resume', 'after a refresh, "next" carries on', next.state.step === 3);
  const en = restore({ ...saved, lang: 'en-IN' }, data);
  check('resume', 'English: "Continuing from step 3."', en.reply.text.startsWith('Continuing from step 3.'));
  const hi = restore({ ...saved, lang: 'hi-IN' }, data);
  check('resume', 'Hindi: "कदम 3 से आगे बढ़ते हैं।"', hi.reply.text.startsWith('कदम 3 से आगे बढ़ते हैं।'));
  const over = handle(st, 'మళ్ళీ మొదలు', data, rates).state;
  check('resume', 'start over: nothing left to restore', restore(JSON.parse(JSON.stringify(snapshot(over))), data) === null);
  check('resume', 'older than 12 hours: start fresh', restore({ ...saved, at: Date.now() - 13 * 3600 * 1000 }, data) === null);
  check('resume', 'bad or empty data: start fresh', restore(null, data) === null && restore({ v: 1, airport: 'XXX', at: Date.now() }, data) === null);
  const asked = restore({ ...saved, mode: 'confirm', confirmed: false }, data);
  check('resume', 'saved before confirming: place kept, no step announced', asked && asked.state.airport === 'DXB' && asked.reply === null);

  // Spoken answers stay short: under 25 words in English, about 30 in Hindi and Telugu
  const keys = ['wifi', 'battery', 'nodata', 'carddecline', 'lostitem', 'missedflight', 'shortchanged', 'taxiissue', 'latenight', 'unsafe', 'wheelchair', 'trolley', 'visa'];
  for (const [lang, max] of [['en-IN', 25], ['hi-IN', 32], ['te-IN', 30]]) {
    const long = keys.filter((k) => say(lang, 'info')[k].split(/\s+/).length > max);
    check('short answers', `${lang}: every traveller answer ≤ ${max} words`, long.length === 0, long.join(', '));
  }
  check('short answers', 'greeting ≤ 25 words in every language', ['en-IN', 'hi-IN', 'te-IN'].every((l) => say(l, 'greet').split(/\s+/).length <= 25));
  return out;
}
