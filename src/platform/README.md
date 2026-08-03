# platform.html — source

`/platform.html` is **generated**. Do not hand-edit it; edit the source here and rebuild.

```bash
cd src/platform
python3 assemble.py --target web       # -> ../../platform.html
python3 assemble.py --target offline   # -> InvestigatePro-Marketing-Kit.html (email attachment build)
```

Two targets, one content source and one CSS block:

| | web (`platform.html`) | offline (marketing kit) |
|---|---|---|
| Fonts | site's Google Fonts preload | base64-embedded woff2 |
| Chrome | site nav + footer + mobile menu | the kit's own nav/footer |
| Analytics | `/analytics.js` | none |

**All kit CSS is scoped under `.mk`.** On the web target the site nav and footer sit *outside*
`<main class="mk">`, so no kit rule can reach them. Three things that matter if you touch the CSS:

1. `.mk h1..h6 { color: inherit }` is load-bearing. `src/input.css` compiles an **unlayered**
   `h1..h6{color:var(--color-ink)}`, which otherwise repaints every white heading on a dark
   section navy-on-navy.
2. `assets/css/styles.min.css` is a **purged** Tailwind v4 build (~603 classes) and the Tailwind
   CLI is not installed. Utilities not already used on the site do not exist and fail silently.
   That is why this page carries its own CSS rather than using utilities.
3. `.mk section[id] { scroll-margin-top: 92px }` keeps deep links (`#capabilities`, `#compare`)
   clear of the 72px fixed nav.

The offline target additionally needs `assets/fonts.css` (~250 KB of base64, gitignored).
Regenerate it from the `@fontsource/montserrat` and `@fontsource/inter` packages.
