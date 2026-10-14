# SEO runbook — investigatepro.app

Goal: rank #1 for the brand query within 6 weeks; page one for the category terms
("ICAM investigation software", "incident investigation software mining",
"ICAM root cause analysis tool") within 3 months. Audit baseline 14 Oct 2026:
domain absent from results for both.

Items are ordered by value per hour. Tick, date and initial each one.

## Week 1 — unblock indexing (Devon, ~2 h)

- [ ] **Search Console.** Add `investigatepro.app` as a *Domain* property (DNS TXT
      via Cloudflare). Pages → check indexed count against the 53 in the sitemap.
      Submit `https://investigatepro.app/sitemap.xml`. Request indexing for `/`,
      `/platform.html`, `/industries/mining-incident-investigation.html`,
      `/blog/icam-investigation-guide.html`.
- [ ] **Cloudflare bot rules.** Security → Events, filter last 7 days for
      `Googlebot` / ASN 15169. Any *Managed Challenge* or *Block* = Google is being
      turned away (the same 403 the audit's curl got). Fix: Security → Bots →
      *Verified bots: Allow*; and if Bot Fight Mode is on, create a WAF skip rule
      for `cf.client.bot`. Re-check Events after 24 h.
- [ ] **Merge PR #1** then re-submit the sitemap and run the Rich Results test
      (search.google.com/test/rich-results) on one post, one industry page, `/faq.html`.
- [ ] **Bing Webmaster Tools.** Import from Search Console (one click). Bing feeds
      DuckDuckGo and Copilot answers.

## Week 1–2 — directory listings (Devon, ~3 h, free tier)

Every category query is currently won by directory pages, not vendors. Listing
there puts InvestigatePro on page one via *their* authority and earns a link.

- [ ] Capterra / GetApp / Software Advice (one Gartner Digital Markets submission
      covers all three) — categories: *Incident Management*, *EHS*, *Safety
      Management*. Use the one-pager copy; screenshots from `/platform.html`.
- [ ] G2 — category *EHS Management*. Ask the first three pilot users for reviews;
      two reviews is enough to appear in category grids.
- [ ] Crunchbase company profile (links to site, LinkedIn; cheap authority).
- [ ] Product Hunt launch — low effort, permanent do-follow link; time it with a
      LinkedIn post.

Listing copy (reuse verbatim):
> **Tagline:** Every incident, understood.
> **Short:** AI-guided ICAM incident investigation for mining, oil and gas,
> construction and manufacturing. Evidence by PEEPO, all four ICAM levels
> prompted, actions on the hierarchy of controls, regulator-ready report.
> Sits alongside your EHS system of record.

## Weeks 2–8 — backlinks (Devon + outreach lane, ongoing)

Target 8–10 links from mining-safety domains. Hooks: the free tools
(`/checklist.html`, `/peepo-chart-builder.html`, `/icam-toolkit.html`) and the
State of Incident Investigation 2026 report.

- [ ] LinkedIn: company page *Website* field + personal profile *Featured* and
      *Contact info* both point to `https://investigatepro.app/`. (Nofollow, but
      Google uses them for entity confirmation.)
- [ ] ICAM training providers' resource pages (search "ICAM training" per
      country: AU, ZA, CA). Offer the checklist/toolkit as a free student resource.
- [ ] Mining safety associations: Minerals Council SA, SAIMM, AusIMM, MSHA-focused
      US bodies (NSSGA, NMA safety committees). Ask for inclusion in members'
      resources or a guest article.
- [ ] One guest article per month in a mining-safety publication (Mining Review
      Africa, Australian Mining, Mining Safety & Health, ISHN). Pitch: a worked
      ICAM example, not a product piece. Byline links to the matching blog guide.
- [ ] Wikipedia-style reference: the ICAM / PEEPO guides cite Reason (1990). Add
      proper references with external links so the pages read as authoritative.

## Content — fix cannibalisation, then expand (ongoing)

- [ ] `/blog/icam-investigation-guide.html` and `/blog/icam-methodology-guide.html`
      compete for the same query. Keep the investigation guide (3,400 words) as the
      pillar; refocus the methodology guide on "ICAM methodology vs other RCA
      methods" or 301 it to the pillar.
- [ ] One new page per exact-match phrase, 1,500+ words, with a worked example:
      `icam-investigation-software`, `peepo-analysis-tool`,
      `critical-control-verification-reporting`, `icam-vs-5-whys`,
      `mining-incident-report-template`. Each links to its industry page and the
      platform page; the SEO script will add the related block from `linkmap.json`.
- [ ] Add every new page to `scripts/seo/linkmap.json`, then run
      `python3 scripts/seo/apply.py` before committing.

## Measurement (monthly, 15 min)

- Search Console → Performance: impressions and average position for the brand
  query and the three category queries above. Record in the Apex dashboard.
- Pages → indexed count (target: all sitemap URLs).
- Links → top linking sites (target: +2 referring domains per month).

## Operating rules

- GitHub is the source of truth; the live site changes only by merged PR.
- `python3 scripts/seo/apply.py --check` must exit 0 before merge (add to CI
  when there is one).
- Never buy links, never spin AI blog volume, never promise "page one in 30 days".
