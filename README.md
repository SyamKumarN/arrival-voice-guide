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
- Before it starts guiding, it confirms where you are: "Dubai, Terminal 3. Is that right?" You can answer by voice or with a tap.

Beyond the route, it handles the moments that cost travellers money:
- **Leftover currency and excess baggage:** short tips on changing leftover cash before you leave the city, and paying airline baggage fees by card.
- **Advice:** connecting flights (don't exit, follow the Transfer signs), a closed counter, how much to change (only the first day's needs), and the "rupees or local currency?" question (always local).
- **Cards and ATMs:** forex, credit and debit card advice, plus ATM tips.
- **Taxis and pickups:** official stands only, meters, pickup points, OTPs, luggage.
- **Tips and traps:** "tips" gives three short money tips, "traps" gives five traps to avoid. Both are read one at a time, and each tip is under 15 words.
- **Out of scope:** for toilets, food, shops, lounges, prayer rooms or a missing bag, it says politely what it does, then shows a staff card with that question in the local language. It never invents a location.

**Save for my trip** keeps everything on the phone: routes, counters, staff cards, language tips and the latest rates. The app can be added to the home screen and works offline with the buttons. Voice recognition needs a connection; offline, the app says so and points to the buttons. A **Speak slower** switch is in the footer.

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
| **Hear** | `public/js/listen.js`, `public/main.js` | Speech recognition in the chosen language. One tap starts a listening session: it waits up to 8 seconds for the first word and stops 2 seconds after the last one. A second tap stops it straight away. If the phone's speech engine stops early, which Chrome on Android does after about a second of silence, the session starts it again and joins the pieces. It keeps whichever of the recogniser's guesses it understands best. The mic is switched off while the guide is speaking, so it never hears itself. |
| **Understand** | `public/js/parser.js`, `numbers.js`, `text.js` | Rule-based, with no network. It reads airports, terminals ("टर्मिनल ३", "teen", "మూడో టెర్మినల్"), where you want to go (exchange, SIM, taxi), commands (next, repeat, back, can't find, I'm lost, ask staff, start over), what you can see, and amounts in digits or words ("satrah sau", "पाँच सौ", "ఐదువందలు"). |
| **Decide** | `public/js/dialog.js`, `decide.js`, `price.js`, `public/data/airports.json` | Picks the fair counter (better rate first, then landside) and builds the route. If something is missing, it asks one short question at a time. It also runs the price check against the mid-market rate. |
| **Speak back** | `public/main.js`, `public/js/phrases.js` | Speaks one step at a time in your language, highlighting the same step on screen. In hands-free mode it listens again after each step. |

## Languages

- **App languages:** English (`en-IN`), Hindi/Hinglish (`hi-IN`, the default) and Telugu (`te-IN`). Spoken replies need a voice for that language on the device. Chrome on Android usually has Hindi. If there's no voice, the text stays on screen and a note says so.
- **Ask-staff card:** Arabic + English (Dubai), Thai + English (Bangkok), English (Singapore), Hindi + English (Bengaluru, Delhi).

## Airports and what's covered

| Airport | Exchange route | SIM counter, taxi stand | Last checked |
|---|---|---|---|
| Dubai (DXB), T1–T3 | Step by step to Al Ansari (T1), the central corridor (T2) or past the Customs Hall exit (T3), with baggage belt numbers | Full step-by-step route | Oct 2026 |
| Bengaluru (BLR), T1–T2 | T2: the two Thomas Cook counters on Level 0. T1 has no listed counter, so it points to an ATM or T2 | Short safe answer + ask-staff card | Oct 2026 |
| Delhi (DEL), T1 and T3 | T3: EbixCash in International Arrivals. T1: Punjab National Bank | Short safe answer + ask-staff card | Oct 2026 |
| Singapore (SIN), T1–T4 | Travelex or Prosegur Change in the arrival hall of each terminal | Short safe answer + ask-staff card | Oct 2026 |
| Bangkok (BKK) | Down to Basement B by the 7-Eleven (SuperRich, Happy Rich, Value Plus) | Short safe answer + ask-staff card | Oct 2026 |

When you don't know your terminal, the question gives a hint, such as "Emirates uses Terminal 3". Counters whose rates haven't been compared yet are shown as "Exchange counter", not "Best option", with a note to check the board.

The data is plain text in `public/data/airports.json`. Where something isn't confirmed, the guide says to ask at the info desk instead of guessing. Signs change, so check them on the day.

## No-key behaviour

Everything above works with no keys:
- **Rates:** the server fetches mid-market rates from a free, no-key source every 30 minutes. If that fails, it silently uses the dated sample in `public/data/rates-sample.json`. The footer shows which one is in use.
- **Optional upgrades:** the footer shows "key not set" for both, and the app never depends on them.

## Optional keys

Copy `.env.example` to `.env` (never commit it), or for the live site, set them as Vercel environment variables.

- `SARVAM_API_KEY`: a more natural voice for spoken replies.
- `AI_API_KEY`: AI understanding (an Anthropic API key).
  - **What it does:** every sentence goes to the AI first, together with the conversation so far: airport, terminal, current step and all steps, the last thing the app said, and any amount said earlier. This is how free-form speech gets understood, such as "there's a long corridor, people are walking", "I've taken my bag" or "they're giving only 1500".
  - **What it can't do:** the AI only fills in a fixed form, choosing from the app's own lists. The app then answers from its own data, so the AI never writes the answer or names a place.
  - **Fallback:** with no key, offline, or no reply within 4 seconds, the rules answer.
  - **Speed:** the server is warmed up when the page loads, so the first sentence isn't slow.
  - **Limits and privacy:** 30 calls a minute per visitor, and nothing the person says is logged.
  - **Model:** `claude-haiku-5-5` by default; set `AI_MODEL` to use another.

## Tests

`npm test` runs 1,140 checks, all without keys or network:
- **Unit tests:**
  - **Parser (196 sentences in English, Hindi, Hinglish and Telugu):** off-topic requests, advice topics, yes/no, and spoken number variants (మూడ్, త్రీ, वन, टू).
  - **Numbers (18) and the price check (9).**
  - **Conversation flows (50):** includes the phone-test cases, such as switching from Dubai tips to "Bengaluru T1, where is the ATM?", "how many dirhams for 500 dollars?", "nobody is here" and flight-mode help.
- **Scenario matrix:** 700 conversations, one for every airport (5) × language style (4) × scenario (35). The scenarios cover:
  - **Routes:** exchange with confirm, missing airport, missing terminal, confirm "no", SIM, taxi, metro, the full route to the receipt step and the money tips.
  - **Commands:** next/repeat/back/can't find, the price check, I'm lost, ask staff.
  - **Off-topic:** toilet, missing bag.
  - **Advice:** transit, counter closed, how much to change, forex/credit/debit cards, leftover currency, excess baggage, "rupees or local currency?", ATM tips, pickup tips, money tips, traps.
  - **Changi T3 test:** your exact Telugu sentences, plus Hindi and English versions, as full conversations from landing to the counter. Also covered:
    - step progress ("taken", "done") and "I'm in the hall";
    - listing the counters;
    - free descriptions when you're lost, with no question asked a third time;
    - the airport's own currency;
    - a remembered amount ("they're giving only 1500").
  - **Phone-test fixes:** where is the ATM, nobody here, app help, a price check with no numbers, tea and chai, "how many … for 100 dollars", and switching airport from a tip list.
  - **Unknown requests.**
- **Microphone (13):** a simulated Chrome-on-Android recogniser that stops after short silences, throws "no-speech" and "aborted", and repeats earlier words. The tests check that one tap keeps listening and joins the pieces.
- **AI fallback (51), with no key and no network:** every intent on the fixed list maps to an answer from the app's own data. Off-list values, such as an invented airport, are dropped. With no key, the route says "key not set", and the rate limit holds.
- **Content checks:** money tips and traps stay under 15 words in every language, every tip list has the same length in every language, and there's a staff-card question for every topic in Arabic, Thai, Hindi, English and Telugu.

Offline support was checked in headless Chrome: the server was stopped mid-test and the whole flow still worked from the phone's storage.

A manual test checklist for a phone is in [docs/phone-test-checklist.md](docs/phone-test-checklist.md).

## Project layout

```
public/            the app (static files)
  data/            airports.json, rates-sample.json
  js/              parser, numbers, dialog, decide, price, phrases
  sw.js            offline support ("Save for my trip")
  manifest.webmanifest, icons/   installable app
lib/core.js        API logic: config, rates, optional voice and Q&A
server.js          small Node server for Docker / npm start
api/index.js       the same API as a Vercel function
tests/             unit tests + scenario matrix
```

## Licence

MIT. See [LICENSE](LICENSE).
