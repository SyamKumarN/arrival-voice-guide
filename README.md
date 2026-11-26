# JesTiny Arrival Guide (Voice)

**Live:** https://arrival-voice.vercel.app (Chrome, Android or desktop)

A voice guide for Indian travellers who have just landed. Say where you are, in English, Hindi/Hinglish or Telugu, and it walks you, one spoken step at a time, to a fair currency exchange counter, a SIM card counter or the taxi stand. It can also tell you whether a counter's rate is fair.

Built for the Scaler × Wispr Flow "India Runs on Voice" hackathon, Round 2.

## The problem

You land tired, with a bag in each hand. The first exchange counter you see, often inside the baggage hall, can give a much poorer rate than one a few minutes' walk away. Signs are in English and the local language. Typing a search on your phone while walking is hard. Asking in your own language is easy.

This guide lets you just speak:
- "दुबई टर्मिनल ३, पैसे बदलने हैं" gets you a step-by-step route to the fair counter.
- "500 dollar ke satrah sau dirham de rahe hain" tells you it's 7.4% below the mid-market rate, that you should get about 1,836 dirhams, and to ask for the final amount before you pay.
- "I'm lost" makes it ask what you can see (passport counters, baggage belts, customs, arrivals hall) and pick up the route from there.
- "Ask staff" shows a big card with the question in the local language (Arabic in Dubai, Thai in Bangkok), reads it out, and lets you show it to someone.

## Run it

```
docker compose up
```

Then open http://localhost:8080 in Chrome. It needs no keys and no `.env` file.

Without Docker (Node 20 or newer): `npm start`. To run the tests: `npm test`.

The microphone works on `localhost` and over `https`. Chrome blocks it on a plain `http://<your-pc-ip>:8080` address, so to test on a phone, use the live link.

## The 4 layers

| Layer | Files | What it does |
|---|---|---|
| **Hear** | `public/main.js` | Speech recognition in the chosen language. It keeps whichever of the recogniser's guesses it understands best. The mic is switched off while the guide is speaking, so it never hears itself. |
| **Understand** | `public/js/parser.js`, `numbers.js`, `text.js` | Rule-based, with no network. It reads airports, terminals ("टर्मिनल ३", "teen", "మూడో టెర్మినల్"), where you want to go (exchange, SIM, taxi), commands (next, repeat, back, can't find, I'm lost, ask staff, start over), what you can see, and amounts in digits or words ("satrah sau", "पाँच सौ", "ఐదువందలు"). |
| **Decide** | `public/js/dialog.js`, `decide.js`, `price.js`, `public/data/airports.json` | Picks the fair counter (better rate first, then landside) and builds the route. If something is missing, it asks one short question at a time. It also runs the price check against the mid-market rate. |
| **Speak back** | `public/main.js`, `public/js/phrases.js` | Speaks one step at a time in your language, highlighting the same step on screen. In hands-free mode it listens again after each step. |

## Languages

- **App languages:** English (`en-IN`), Hindi/Hinglish (`hi-IN`, the default) and Telugu (`te-IN`). Spoken replies need a voice for that language on the device. Chrome on Android usually has Hindi. If there's no voice, the text stays on screen and a note says so.
- **Ask-staff card:** Arabic + English (Dubai), Thai + English (Bangkok), English (Singapore), Hindi + English (Bengaluru, Delhi).

## Airports and what's covered

| Airport | Exchange counter | SIM counter, taxi stand | Last checked |
|---|---|---|---|
| Dubai (DXB), T1–T3 | Full step-by-step route | Full step-by-step route | 27 Nov 2026 |
| Bengaluru (BLR) | Safe general route: "ask at the info desk" (detailed data pending) | Short safe answer + ask-staff card | pending |
| Delhi (DEL) | Safe general route: "ask at the info desk" (detailed data pending) | Short safe answer + ask-staff card | pending |
| Singapore (SIN), T1–T4 | Route | Short safe answer + ask-staff card | 27 Nov 2026 |
| Bangkok (BKK) | Route | Short safe answer + ask-staff card | 27 Nov 2026 |

The data is plain text in `public/data/airports.json`. Where something isn't confirmed, the guide says to ask at the info desk instead of guessing. Signs change, so check them on the day.

## No-key behaviour

Everything above works with no keys:
- **Rates:** the server fetches mid-market rates from a free, no-key source every 30 minutes. If that fails, it silently uses the dated sample in `public/data/rates-sample.json`. The footer shows which one is in use.
- **Optional upgrades:** the footer shows "key not set" for both, and the app never depends on them.

## Optional keys

Copy `.env.example` to `.env` (never commit it), or for the live site, set them as Vercel environment variables.

- `SARVAM_API_KEY`: a more natural voice for spoken replies.
- `ANTHROPIC_API_KEY`: answers free-form questions the rules can't handle.

## Tests

`npm test` runs 294 checks:
- **Unit tests:** the parser (59 sentences in English, Hindi, Hinglish and Telugu), numbers (18), the price check (9) and conversation flows (8).
- **Scenario matrix:** 200 conversations, one for every airport × language style × scenario. The scenarios are exchange, SIM, taxi, price check, next/repeat/back, can't find, I'm lost, ask staff, unknown request, missing airport and missing terminal.

A one-page manual test for a phone is in [docs/phone-test-checklist.md](docs/phone-test-checklist.md).

## Project layout

```
public/            the app (static files)
  data/            airports.json, rates-sample.json
  js/              parser, numbers, dialog, decide, price, phrases
lib/core.js        API logic: config, rates, optional voice and Q&A
server.js          small Node server for Docker / npm start
api/index.js       the same API as a Vercel function
tests/             unit tests + scenario matrix
```

## Licence

MIT. See [LICENSE](LICENSE).
