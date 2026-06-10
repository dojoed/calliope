# 🌷 Calliope

A calm, **research-based** speech-language and occupational-therapy app for very young
children — built first for a 2.5-year-old with a speech delay who is just beginning to
communicate, and designed to help other families too.

It's a no-install web app you open **fullscreen on an iPad**. It works offline, uses the
iPad's built-in voice (no audio files), and uses big friendly symbols.

---

## Running it

### On your Mac (to try it / develop)
```bash
cd /Users/estark/calliope
python3 -m http.server 8000
```
Open **http://localhost:8000** in Safari or Chrome.

### On the iPad (the real way to use it)
1. Make sure the Mac and iPad are on the **same Wi-Fi**.
2. Run the server command above. Find your Mac's IP: **System Settings → Wi-Fi → Details → IP address** (looks like `192.168.x.x`).
3. On the iPad, open Safari to `http://192.168.x.x:8000`.
4. Tap the **Share** button → **Add to Home Screen**. Now Calliope launches **fullscreen** like a real app and works **offline**.
5. Recommended: turn on **Guided Access** (Settings → Accessibility → Guided Access) so she can't accidentally leave the app — triple-click the side button to start it.

> The parent settings are hidden behind the ⚙️ on the home screen — **hold it for ~1.5 seconds** to open (a quick tap won't work, so little fingers can't get in).

---

## The five + four activities

**Talking & Learning**
| Activity | What it builds |
|---|---|
| 🫧 **Pop!** | Cause-and-effect / agency, attention, a moment to share (joint attention) |
| 🗣️ **First Words** | Vocabulary through modeling — big symbol + a clearly-spoken word |
| 🔎 **Find It** | *Receptive* language (understanding comes before speaking) |
| 💬 **Talk** | An AAC core-vocabulary board — gives her a voice to request *now* |
| 📅 **My Day** | A predictable visual routine |

**Moving & Making (occupational therapy)**
| Activity | What it builds |
|---|---|
| ✏️ **Trace** | Pre-writing & hand-eye coordination (scribble → lines → circle → shapes) |
| 🎨 **Color** | Grip, finger control, calming open-ended play |
| 🤸 **Move** | Gross-motor + self-regulation + **imitation** (itself a speech building block) |
| 🍎 **Feed** | Hand-eye coordination + motor planning via drag-and-drop |

---

## Why it's built this way — the evidence

The product's whole reason for existing is that it is **grounded in actual speech-language
pathology and occupational-therapy practice**, not gamified guesswork. The design choices:

- **Start *below* words.** For a child with no spoken vocabulary, the evidence base
  (Naturalistic Developmental Behavioral Interventions — JASPER, ESDM, etc.) targets the
  *prelinguistic foundations* first: joint attention, imitation, cause-and-effect, and
  requesting. → *Pop!*, *Move*, and *Talk*.
- **AAC does not delay speech — it tends to grow it.** A 2021 meta-analysis found ~89% of
  AAC users showed *increased* verbal output. We give her a **core-vocabulary** board
  (the high-frequency words that make up ~75–80% of everyday speech), color-coded with the
  standard "Fitzgerald key." → *Talk*.
- **Comprehension precedes production**, so receptive practice (*Find It*) starts at **2
  choices** with no-fail, errorless support.
- **Modeling, not drilling.** Words are spoken warmly and never demand imitation; the
  built-in coaching guide teaches the parent the **"time delay"** (offer, then pause and
  wait) — the highest-yield technique.
- **Autism-friendly sensory design:** soft muted palette (no neon), one task per screen,
  **no autoplay animation or sudden/loud sounds**, adjustable volume & voice speed, and a
  **reduce-motion** switch (auto-on if the OS asks for it).
- **Pre-writing in developmental order** (scribble → vertical → horizontal → circle →
  shapes), the actual OT progression for a 2.5–3-year-old.
- **Movement = regulation + imitation.** "Heavy work"/proprioceptive and vestibular
  movement supports a calm, regulated state, and copy-me imitation feeds language.
- **The parent is the intervention.** Parent-implemented therapy is the most evidence-backed
  delivery, so Settings includes a *How to use Calliope with your child* coaching guide.

### Sources
- ASHA — Early Intervention (practice portal); AAC evidence maps
- Clinical Effectiveness of AAC Intervention in Minimally Verbal Children with ASD (systematic review)
- NDBI / JASPER / ESDM overviews (Seattle Children's; Project AIM meta-analysis, PMC8862714)
- NDBI + aided AAC and language development (systematic review/meta-analysis, PMC12208088)
- Systematic review of core-vocabulary AAC interventions (Springer, 2023)
- Pre-writing developmental sequence (NSPT, NAPA Center, The OT Toolbox)
- Proprioceptive/vestibular input & self-regulation in autism (RCT, ScienceDirect; OT sources)
- Autism-friendly UX guidance (Smart Interface Design Patterns; neurodivergent UX)

> ⚠️ Calliope is a supportive practice tool, **not a diagnosis or a replacement for a
> speech-language pathologist or occupational therapist.** Early professional evaluation
> (e.g. your state's Early Intervention program) is the most important step.

---

## Editing the content
All vocabulary, the AAC board, and the daily routine live in **`js/data.js`** — easy to
add words, swap symbols, or change `say` text. Settings persist in the browser's
localStorage.

---

## Backlog
- **Branding:** replace placeholder icon/logo with a friendly **caricature mascot of the
  daughter** (the app's namesake — "like the Wendy's girl"). Photo to be provided.
- **Publish & distribute** for other parents — differentiate on quality + research depth.
- Custom photos for the AAC board / First Words (real family photos are powerful for
  autistic children).
- Record-your-own-voice option (familiar voices aid comprehension).
- Optional simple progress notes for parents/therapists.
- Per-child profiles & data export to share with a therapist.

## Project layout
```
calliope/
├── index.html
├── manifest.webmanifest      # installable PWA
├── sw.js                     # offline service worker
├── css/styles.css
├── js/
│   ├── data.js               # ← all words / board / routine
│   ├── store.js              # settings (localStorage)
│   ├── speech.js             # TTS + gentle sounds
│   ├── ui.js                 # shell, router, home, parent settings + coaching
│   ├── activities-speech.js  # Pop, First Words, Find It, Talk, My Day
│   ├── activities-ot.js      # Trace, Color, Move, Feed
│   └── main.js               # bootstrap
└── icons/
```
