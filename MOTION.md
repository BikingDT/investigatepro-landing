# MOTION.md — InvestigatePro homepage motion system (direction 3A)

**Scope:** `investigatepro.app/` only. **Implementation:** `lib/motion.ts` (bundled into `/assets/js/home.js` together with `src/client.ts`). **Spec:** build brief §4; this file documents what ships, including the few places where an implementation choice filled a gap the brief left open — each is marked *(choice)*.

## Contract

```ts
import { initScrollMotion, drawStaticFrame } from './lib/motion';
const handle = initScrollMotion(); // start
handle.destroy();                  // stop + restore the resolved page
```

`destroy()` removes every listener/observer/timer, cancels every rAF, removes every class the engine added and restores every inline style it wrote. Because the markup ships **resolved final states**, the page after `destroy()` is the same page a no-JS visitor gets.

## Boot policy (src/client.ts)

Motion runs only when `prefers-reduced-motion` is not set **and** the footer "Reduce motion" toggle (persisted as `localStorage["ip-reduce-motion"]`) is off. When motion is off, `drawStaticFrame()` paints one fully-converged constellation frame and nothing animates. The toggle applies live in both directions; the OS preference always wins. The engine gates on `html.motion-on`: pre-states exist only under that class.

## Helpers (§4.0)

```
clamp01(v)              → [0,1]
ease(x) = x·x·(3−2x)    → smoothstep
progressOf(el, s, span) → clamp01((vh·s − rect.top) / (el.offsetHeight·span))
```

One scroll listener, rAF-throttled; one resize listener; one `visibilitychange` listener. Only `transform`, `opacity`, small (≤6px) bar geometry and `mask-image` are animated. All scrub values are pure functions of scroll position — **scrolling up rewinds everything** except the three latched one-shots (hero entrance, beat streams, Now-card lift — the lift transitions back off when scrubbed below its gate).

## 1 · Progress hairline (§4.1)

Fixed, 3px, `z-index:9`. Fill width = `clamp01(scrollTop/(scrollHeight−clientHeight))×100%`, gradient `90deg apex-teal 0% → neural-blue 62% → signal-mint 100%` on an `rgba(17,45,60,.12)` track. **No transition** — 1:1 with the scroll position.

## 2 · Section rail (§4.2)

Fixed right, `z-index:8`, desktop ≥1024px. Fade-in `clamp01((scrollTop − heroH×0.5)/(heroH×0.22))`; multiplied by `1 − clamp01((scrollTop − (coachTop − vh×0.42))/(vh×0.2))` so it fades back out as the coach becomes active *(choice: the brief says "fade to 0 while coach active"; the vh×0.2 window makes that scroll-linked rather than a pop)*. Active stop = last section with `offsetTop − vh×0.42 ≤ scrollTop`. Ticks: active 26px apex-teal, passed apex-teal-300, upcoming 16px mist; labels 11px, active slate at 1, others graphite at 0.34. Labels are real anchor links.

## 3 · Hero entrance + parallax (§4.3)

One-shot on load, latched with `.in`; CSS transitions with per-element `--d/--dl`:
nav 420/0 · eyebrow 520/100 · H1 560/180 · body 560/280 · CTA row 560/380 · note 560/460 · role cards 520/540 · 520/620 · 520/700 (ms duration/delay, `--ease: cubic-bezier(0.2,0,0,1)`, 14px rise).

Parallax: the hero **copy layer** (the `.wrap` holding copy + role cards — one layer, so nothing collides internally; the canvas does not move) gets `translateY(min(scrollTop×0.14, heroH×0.12))`.

## 4 · Constellation canvas (§4.4)

- DPR capped at 2. Node count 46 / 24 (<768px) / 16 (<480px); rebuilt when the breakpoint changes (ResizeObserver).
- Deterministic field (seeded mulberry32) — same sky every load.
- Each node: a free position and a target near one of four clusters at `[[.62,.22],[.84,.34],[.64,.60],[.85,.72]]` (People / Task / Environment / Organisation). Position = `lerp(free, target, ease(p))` with `p = clamp01(scrollTop/(heroH×0.8))` *(choice: the convergence span)*. Idle drift (sin/cos, 4–10px) multiplied by `(1−ease(p))` so converged clusters hold still.
- Links between nodes closer than 148px: `rgba(100,255,218,(1−d/148)×0.26)`, 1px.
- Dots signal-mint α0.75; every `i%4===1` neural-blue α0.9; radii 1.6–3.2px.
- 12 evidence motes on quadratic Béziers between cluster centres (perpendicular control-point offset), α pulsing, scaled by `ease(p)` so they appear as the clusters form *(choice)*.
- Cluster labels are HTML (crisp text), opacity `clamp01((p−0.5)/0.35)` *(choice)*.
- The loop **pauses** when the hero leaves the viewport (IO) or `document.hidden`, and resumes on return.
- **Perf (§8):** the loop starts only after `window.load` + 250ms (the canvas fades in over 640ms), and the ambient phase draws at half cadence — full rate while scrolling (260ms hot window) or whenever `p` changed. This is what holds mobile TBT at ~30ms.
- Reduced motion: `drawStaticFrame()` = one converged frame (p=1, no motes), labels shown via CSS.

## 5 · Swap scrub (§4.5) — reversible

`t = progressOf(#what, 0.86, 0.72)`, `stage = t×4`, `e = ease(t)`:
- left row *i*: `opacity = 1 − 0.62×clamp01(stage−i)` → floor **0.38**
- right row *i*: `opacity = 0.22 + 0.78×ease(clamp01(stage−i))`, `translateY = (1−k)×10px`
- track fill width and marker left = `e×100%` (co-located)
- right accent edge `scaleY = max(0.04, e)`

Written inline every frame — no classes, fully reversible. Resolved state (no motion): the de-emphasis is carried by AA-compliant graphite at full opacity instead of the 0.38 opacity floor (§7).

## 6 · Lineage timeline (§4.6)

`t = ease(progressOf(#line, 0.78, 0.5))`. Fill `scaleX = t`. Nodes at 6% / 38% / 86% gate at `t ≥ 0.10 / 0.42 / 0.86`, each popping over an 0.08 window (opacity + scale 0.4→1, scrub-driven, reversible); the 1990/1990s entries follow gates 1–2 over an 0.12 window *(choice)*. The Now card gates at `t ≥ 0.72` by class: opacity 0.55→1, translateY 14→0, elev-1→elev-3, accent `scaleY` — all 460ms `--ease`, and the class comes **off** below the gate so the transition plays both ways.

## 7 · Coach (§4.7)

`t = progressOf(#coach, 0.82, 0.66)`, `stage = t×4`.

- Spine fill `scaleY = ease(t)`. Per-beat `p = clamp01(stage−i)`: node ring border at `p>0.12`, fill at `p>0.5`, `scale = 0.82+0.18p`; beats 1–3 neural-blue, beat 4 growth-green. Scrub-driven, reversible.
- **Text streaming** (one-shot per beat, IO threshold 0.34): typing dots (4px, blue, 1.1s loop, delays 0/160/320ms) for 350ms, then a mask-image wipe
  `linear-gradient(100deg, #000 0 X%, rgba(0,0,0,0.10) (X+15)%, transparent (X+30)%)` (+ `-webkit-` prefix), X 0→140 over 640ms, time-based (so a stalled rAF jumps to the right X). Latched `done`; failsafe timer forces completion 900ms after the stream should have ended; `visibilitychange`→hidden completes any in-flight stream; the scroll handler force-completes any beat whose moment fully passed (`p ≥ 1`) — **nothing can be left hidden**, including fast-scroll-to-bottom and background-tab arrivals.
- Beat 4's Accept / Edit / Reject row reveals on its `done` (320ms).
- Counters (`role="status" aria-live="off"`): `v = clamp01(stage/4)` → Evidence 4→9, Factors 0→3, Defences 0→2.
- Coverage bars interpolate 5-stop arrays on `stage` (stop *k* → *k+1* by `frac(stage)`):
  People .16/.58/.70/.72/.78 · Task .10/.30/.64/.68/.74 · Environment .06/.18/.28/.52/.60 (teal) · Organisation .02/.05/.10/.44/.86 (neural-blue). Bars are `role="img"` with final-coverage labels.
- The Organisation COACH flag fades in over `stage 2.6→2.85`.

## Accessibility (§7)

Markup ships resolved states: JS-disabled and reduced-motion visitors get the complete page (final counters 9/3/2, final bar widths, all beat text, actions row, Now card lifted, no fixed chrome). Beats are an ordered list; canvas has `role="img"` + label; skip link first in tab order; focus rings 3px neural-blue on light / signal-mint on dark; visible footer "Reduce motion" toggle (aria-pressed, persisted). axe-core: clean in the reduced-motion rendering with no exclusions, and clean in the motion rendering excluding only the transient §4.5/§4.6 scrub opacities.

Three token applications were shifted for WCAG AA (neural-blue is 2.99–3.1:1 on light surfaces at small sizes): the EVIDENCE track label uses apex-teal-hover, the Now kicker uses apex-teal-hover, and blue badges carry deep-ink text on the blue-tinted chip. Blue stays on every graphic element (nodes, edges, fills, marker, bars).

## Performance (§8)

Measured (Lighthouse 12, localhost, fonts/analytics blocked by the sandbox proxy — noted as environment artifacts): **desktop Perf 100 / SEO 100, LCP 0.3s, CLS 0, TBT 0ms · mobile Perf 100, LCP 1.4s, CLS 0, TBT 30ms**. `home.js` 11.2KB (4.7KB gzip) vs the 60KB budget; `home.css` 4.8KB gzip. A11y category reads 96 in the raw motion state (the transient scrub rows); the reduced-motion rendering scans clean.
