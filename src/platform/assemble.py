#!/usr/bin/env python3
"""Build the InvestigatePro platform page from one source, for two targets.

  python3 assemble.py --target offline   -> InvestigatePro-Marketing-Kit.html
                                            (self-contained: base64 fonts, own nav/footer,
                                             works offline as an email attachment)
  python3 assemble.py --target web       -> platform.html
                                            (site nav/footer + head, Google Fonts, analytics)

Both targets share ONE content source and ONE CSS block. All kit CSS is scoped under
`.mk`, so on the web target it provably cannot reach the site's nav, footer or globals.
"""
import argparse, base64, pathlib, re, sys

ROOT = pathlib.Path(__file__).parent

# ── content data ──────────────────────────────────────────────────────────────
L = lambda live: '<span class="pill live">Live</span>' if live else '<span class="pill build">In build</span>'

MODULES = [
    ("01", "Capture the event", "from the first hour, before anyone decides how serious it is", [
        (1, "One event record, three states",
         "Logged &rarr; Under Investigation &rarr; Closed. Reference number, severity, type, date and time occurred, "
         "date reported, location with coordinates, and the description — one record everything else hangs from."),
        (1, "Narrative quality gate",
         "Event and immediate-action narratives are scored on capture. A two-line description doesn't proceed to "
         "analysis, because an investigation built on one is not worth running."),
        (1, "Injured-person detail",
         "Injury type, body part, nature and classification; days away, restricted and transferred; return-to-work "
         "date; treatment type, facility and physician — the detail statutory forms demand and spreadsheets lose."),
        (1, "Exposure and experience context",
         "Job title, department, supervisor, employment start, and total, company and job-specific experience in "
         "months. The factors that turn &ldquo;an operator made a mistake&rdquo; into a question worth asking."),
        (1, "Reportability flags on the record",
         "OSHA-recordable, OSHA-reportable and MSHA-reportable are properties of the event, decided when it is "
         "logged — not remembered later."),
        (1, "Sites, employees and org structure",
         "Multi-site organisations with a site register and an employee register behind the event."),
    ]),
    ("02", "Build the evidence base", "PEEPO — People, Environment, Equipment, Procedures, Organisation", [
        (1, "Every item classified and sourced",
         "Each evidence item carries a PEEPO category and subcategory, a title and description, its source and a "
         "source reference — so the report shows not just what was concluded but where it came from."),
        (1, "Evidence quality is scored",
         "Items receive a quality score and written feedback, and are marked as contributing or not. Completeness "
         "across the five PEEPO categories is tracked at investigation level."),
        (1, "Files with a real evidence register",
         "Photographs, documents and records attach to the investigation and are carried into the report as a "
         "numbered register — the appendix a regulator or a lawyer looks for first."),
        (1, "Witness accounts",
         "Witness records with contact detail and statements, held against the event."),
        (1, "Sequence of events",
         "A timestamped chronology — each entry categorised, sourced and orderable, with key events flagged. "
         "Reconstructing this from memory weeks later is where most investigations quietly fail."),
        (1, "Task analysis — planned versus actual",
         "Step by step: what the procedure specified, what actually happened, and the variance named — matched, "
         "minor deviation, major deviation or skipped — with an explanation and a contributing-factor flag. "
         "Work-as-imagined against work-as-done, in a table."),
    ]),
    ("03", "Analyse the causes", "guided, scored, and never autonomous", [
        (1, "The four ICAM levels, all four",
         "Absent or failed defences · individual and team actions · task and environmental conditions · "
         "organisational factors. Each factor carries a category, subcategory and description."),
        (1, "Factors carry specificity and evidence strength",
         "Every contributing factor is rated for how specific it is and how strongly the evidence supports it, and "
         "links back to the PEEPO items behind it. A vague factor cannot hide among precise ones."),
        (1, "5-Whys with depth and quality scoring",
         "Problem statement, the chain, and the resulting cause with its category — plus a depth score, a quality "
         "score and a validation pass. A chain that terminates at a person does not score well."),
        (1, "AI Root Cause Coach — grounded, and accountable to a human",
         "Grounded in Human and Organisational Performance and occupational-health practice, and given the whole "
         "investigation record rather than the single field in front of it. AI suggestions are marked as "
         "AI-suggested and carry a confidence value. The investigator accepts, edits or rejects, and signs off."),
        (1, "Investigation scored while it is open",
         "PEEPO completeness, ICAM quality and an overall quality score, alongside progress — visible in the app "
         "while there is still time to act on them, and kept off the client-facing report by design."),
    ]),
    ("04", "Turn causes into controls that hold", "the part most systems treat as a to-do list", [
        (1, "Every action answers a named cause",
         "Recommendations link to the ICAM factors and the 5-Whys chains they address. An action with nothing "
         "behind it is visible, and so is a factor nobody did anything about."),
        (1, "Rated on the hierarchy of controls",
         "Elimination through to PPE, recorded per action — so a finding closed with a toolbox talk is not quietly "
         "equivalent to one closed by a design change."),
        (1, "SMART tested, not SMART claimed",
         "Specific, measurable, achievable, relevant and time-bound are each assessed and rolled into a score. "
         "&ldquo;Improve awareness of the procedure&rdquo; does not survive the test."),
        (1, "Verification is evidence, not a tick",
         "Verification method, the evidence relied on, who verified it and when — recorded against the action."),
        (1, "Effectiveness checked later, separately",
         "A dated effectiveness check with a result and notes, distinct from completion. Whether the control "
         "actually worked is a different question from whether somebody did the task."),
        (1, "Tracked the way the team works",
         "Owner, department, due date, priority and status, in tile, list or kanban views with drag-to-status."),
    ]),
    ("05", "Produce the documents", "the thing you actually hand up", [
        (1, "Full investigation report",
         "Cover page, document control, contents, people involved, sequence of events, evidence register, ICAM "
         "findings with evidence strength, risk assessment, witness accounts, recommendations and a sign-off block "
         "— with page numbering and a running confidentiality mark on every page."),
        (1, "Board and management outputs",
         "Executive summary written for a board rather than a file, lessons-learned, and an action tracker. "
         "PDF and PowerPoint."),
        (1, "Statutory forms across four jurisdiction groups",
         "OSHA 301 · MSHA 7000-1 · RIDDOR F2508 · MHSA section 23 · COIDA WCL-2 · Australian state notification, "
         "with the correct state regulator derived from your organisation. Deadlines are stated on the output."),
        (1, "Trend analytics",
         "Patterns across investigations rather than one incident at a time — which is where repeat contributing "
         "factors become visible."),
    ]),
    ("06", "Security, access and administration", "what your IT team will ask about", [
        (1, "SAML 2.0 single sign-on",
         "Identity-provider metadata and certificate, domain verification, just-in-time provisioning, a default "
         "role for new users, and enforced-SSO as an option."),
        (1, "Multi-factor authentication", "MFA with backup codes, per user."),
        (1, "Roles and permissions", "Role-based access with a per-user permission set."),
        (1, "Audit log", "An append-only record of who did what and when, across the investigation."),
        (1, "Tenant isolation",
         "Row-level security across the application tables — an organisation's investigations are reachable only "
         "by that organisation."),
        (1, "Recoverable records",
         "Soft deletion throughout. An investigation record is not destroyed by a misclick."),
        (1, "Organisation profile built for reporting",
         "Legal entity and registration, NAICS and SIC, employee and contractor counts, average hours worked, "
         "regulatory identifiers, insurer and policy, and a named regulatory contact."),
        (0, "Data exchange",
         "There is no self-serve public API today. Exchange with an existing EHS platform is a scoped export and "
         "import contract, built per integration. Not SOC&nbsp;2 or ISO&nbsp;27001 certified."),
        (0, "Mobile field capture",
         "Companion apps for field capture are in build and not in service today. The web application is "
         "responsive and works on a phone browser; anything beyond that is roadmap, not product."),
    ]),
]


def accordions() -> str:
    out = []
    for num, title, tag, items in MODULES:
        live = sum(1 for i in items if i[0])
        cover = f"{live} live" + (f" · {len(items)-live} in build" if len(items) - live else "")
        body = "".join(
            f'<div class="item"><div class="hd"><h5>{t}</h5>{L(ok)}</div><p>{d}</p></div>'
            for ok, t, d in items)
        out.append(
            f'<div class="acc"><button type="button" aria-expanded="false"><span class="num">{num}</span>'
            f'<span class="ttl">{title}</span><span class="cv">{cover}</span><span class="ar"></span></button>'
            f'<div class="body">{body}</div></div>')
    return "\n    ".join(out)


# ── CSS scoping ───────────────────────────────────────────────────────────────
# Every kit rule is rewritten to live under `.mk`. On the web target the site's
# nav/footer sit OUTSIDE `<main class="mk">`, so `.mk nav {}` cannot reach them.
SPECIAL = {
    ":root": ".mk",
    "body": ".mk",
    "*":    ".mk *,.mk *::before,.mk *::after",
}
DROP_SELECTORS = {"html"}  # site already sets scroll-behavior; print-color-adjust moved to @media print


def scope_selector(sel: str) -> str | None:
    sel = sel.strip()
    if not sel:
        return None
    parts = []
    for part in sel.split(","):
        p = part.strip()
        if p in DROP_SELECTORS:
            continue
        if p in SPECIAL:
            parts.append(SPECIAL[p])
        elif p.startswith("@") or p.startswith("from") or p.startswith("to") or re.match(r"^\d+%$", p):
            parts.append(p)
        elif p.startswith(".mk"):
            parts.append(p)
        else:
            parts.append(f".mk {p}")
    return ", ".join(parts) if parts else None


def scope_css(css: str) -> str:
    """Prefix every top-level selector with .mk, preserving at-rule nesting."""
    out, i, n = [], 0, len(css)
    buf = ""
    while i < n:
        ch = css[i]
        if ch == "{":
            sel = buf.strip()
            buf = ""
            if sel.startswith("@"):
                # at-rule: recurse into its body
                depth, j = 1, i + 1
                while j < n and depth:
                    if css[j] == "{": depth += 1
                    elif css[j] == "}": depth -= 1
                    j += 1
                inner = css[i + 1:j - 1]
                if re.match(r"@(media|supports)", sel):
                    out.append(f"{sel}{{{scope_css(inner)}}}")
                else:  # @font-face, @keyframes, @page — emit untouched
                    out.append(f"{sel}{{{inner}}}")
                i = j
                continue
            # plain rule
            depth, j = 1, i + 1
            while j < n and depth:
                if css[j] == "{": depth += 1
                elif css[j] == "}": depth -= 1
                j += 1
            body = css[i + 1:j - 1]
            scoped = scope_selector(sel)
            if scoped:
                out.append(f"{scoped}{{{body}}}")
            i = j
            continue
        buf += ch
        i += 1
    return "".join(out)


HEADING_FIX = (
    "\n/* the site's own unlayered `h1..h6{color:var(--color-ink)}` would otherwise\n"
    "   repaint every white heading on a dark section navy-on-navy */\n"
    ".mk h1,.mk h2,.mk h3,.mk h4,.mk h5,.mk h6{color:inherit}\n"
    ".mk{print-color-adjust:exact;-webkit-print-color-adjust:exact}\n"
)


# ── source parsing ────────────────────────────────────────────────────────────
def parse_source():
    s = (ROOT / "kit-page.src.html").read_text()
    css = re.search(r"<style>(.*?)</style>", s, re.S).group(1)
    css = css.replace("__FONTS__", "").strip()
    nav = re.search(r"(<nav>.*?</nav>)", s, re.S).group(1)
    footer = re.search(r"(<footer>.*?</footer>)", s, re.S).group(1)
    middle = s[s.index("</nav>") + len("</nav>"): s.index("<footer>")].strip()
    script = re.search(r"(<script>.*?</script>)", s, re.S).group(1)
    return css, nav, footer, middle, script


SITE_NAV = '''<style id="ip-chrome">
nav.ip-nav{position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(17,45,60,.95);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.1);font-family:'Inter',ui-sans-serif,system-ui,sans-serif;margin:0;padding:0;box-shadow:none}
.ip-nav-in{max-width:80rem;margin:0 auto;padding:0 1rem}
@media(min-width:640px){.ip-nav-in{padding:0 1.5rem}}
@media(min-width:1024px){.ip-nav-in{padding:0 2rem}}
.ip-nav-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0}
nav.ip-nav a{text-decoration:none}
.ip-logo{display:flex;align-items:center;padding:0}
.ip-logo img,.ip-fbrand img{height:48px;width:auto;display:block}
.ip-links{display:none;align-items:center;gap:2rem}
@media(min-width:768px){.ip-links{display:flex}}
nav.ip-nav .ip-links a{color:#C9D6DD;font-size:16px;font-weight:400;transition:color .2s;padding:2px 0}
nav.ip-nav .ip-links a:hover{color:#FFFFFF}
nav.ip-nav .ip-links a[aria-current="page"]{color:#FFFFFF;font-weight:600;box-shadow:inset 0 -2px 0 #64FFDA}
.ip-right{display:flex;align-items:center;gap:1rem}
nav.ip-nav .ip-login{display:none;color:#C9D6DD;transition:color .2s}
nav.ip-nav .ip-login:hover{color:#FFFFFF}
@media(min-width:640px){nav.ip-nav .ip-login{display:inline}}
nav.ip-nav .ip-cta{background:#64FFDA;color:#112D3C;padding:10px 20px;border-radius:8px;font-weight:600;transition:background .2s;white-space:nowrap}
nav.ip-nav .ip-cta:hover{background:#2BD9B5}
body.ip-pad{padding-top:72px}
.mm-btn{display:none;background:none;border:0;color:#C9D6DD;padding:10px;margin-left:4px;cursor:pointer;border-radius:8px}
.mm-btn:hover{color:#FFFFFF;background:rgba(255,255,255,0.08)}
.mm-panel{display:none;position:fixed;top:0;left:0;right:0;z-index:40;background:rgba(17,45,60,.98);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.1);padding:96px 24px 24px;max-height:100vh;overflow-y:auto}
.mm-panel a{display:block;padding:14px 8px;color:#C9D6DD;font-size:18px;font-weight:500;border-bottom:1px solid rgba(255,255,255,0.08);text-decoration:none}
.mm-panel a:hover{color:#FFFFFF}
.mm-panel a[aria-current="page"]{color:#64FFDA}
.mm-panel a.mm-cta{margin-top:16px;background:#64FFDA;color:#112D3C;text-align:center;border-radius:10px;font-weight:700;border-bottom:0;padding:14px}
.mm-open .mm-panel{display:block}
@media(max-width:767px){.mm-btn{display:inline-flex;align-items:center}}
body.mm-noscroll{overflow:hidden}
footer.ip-footer{background:#112D3C;border-top:1px solid rgba(255,255,255,.1);padding:48px 0 32px;font-family:'Inter',ui-sans-serif,system-ui,sans-serif;margin-top:0}
.ip-foot-in{max-width:80rem;margin:0 auto;padding:0 1rem}
@media(min-width:640px){.ip-foot-in{padding:0 1.5rem}}
@media(min-width:1024px){.ip-foot-in{padding:0 2rem}}
.ip-fgrid{display:grid;grid-template-columns:1fr 1fr;gap:2rem}
@media(min-width:768px){.ip-fgrid{grid-template-columns:2fr 1fr 1fr 1fr}}
.ip-fbrand img{margin-bottom:12px}
.ip-fbrand p{color:rgba(201,214,221,.7);font-size:14px;margin:0;max-width:280px;line-height:1.6}
.ip-fh{color:#FFFFFF;font-weight:600;font-size:13px;letter-spacing:.06em;text-transform:uppercase;margin:0 0 12px;font-family:'Montserrat','Inter',sans-serif}
footer.ip-footer a{display:block;color:rgba(201,214,221,.7);font-size:14px;padding:5px 0;text-decoration:none;transition:color .2s}
footer.ip-footer a:hover{color:#64FFDA}
.ip-fbot{margin-top:40px;padding-top:24px;border-top:1px solid rgba(255,255,255,.08);color:rgba(201,214,221,.7);font-size:13px;display:flex;flex-wrap:wrap;gap:8px 24px;justify-content:space-between}
.ip-fbot a{display:inline;padding:0}
@media print{nav.ip-nav,footer.ip-footer,.mm-btn,.mm-panel{display:none!important}body.ip-pad{padding-top:0}}
</style>
<!-- Site chrome: unified navigation -->
<nav class="ip-nav">
  <div class="ip-nav-in">
    <div class="ip-nav-row">
      <a href="/" class="ip-logo" aria-label="InvestigatePro home"><img src="/assets/brand/logo-horizontal-white.svg" alt="InvestigatePro" width="826" height="168" style="height:48px;width:auto"></a>
      <div class="ip-links">
        <a href="/#solutions">Solutions</a>
        <a href="/#features">Features</a>
        <a href="/platform.html" aria-current="page">Platform</a>
        <a href="/pricing.html">Pricing</a>
        <a href="/apps/">Apps</a>
        <a href="/blog/">Blog</a>
      </div>
      <div class="ip-right">
        <a href="https://app.investigatepro.app/login" class="ip-login">Login</a>
        <a href="https://cal.com/investigatepro/15min" class="ip-cta">Book Demo</a>
      </div>
    </div>
  </div>
</nav>
'''

SITE_FOOTER = '''<footer class="ip-footer">
  <div class="ip-foot-in">
    <div class="ip-fgrid">
      <div class="ip-fbrand">
        <a href="/" aria-label="InvestigatePro home" style="display:inline-block;padding:0"><img src="/assets/brand/logo-horizontal-white.svg" alt="InvestigatePro" loading="lazy" width="826" height="168" style="height:48px;width:auto"></a>
        <p>AI-driven event analysis. Incident investigation software built on real ICAM methodology.</p>
      </div>
      <div>
        <h4 class="ip-fh">Product</h4>
        <a href="/platform.html">Platform</a>
        <a href="/pricing.html">Pricing</a>
        <a href="/demo.html">Book a Demo</a>
        <a href="/apps/">Apps</a>
        <a href="/faq.html">FAQ</a>
        <a href="/security.html">Security</a>
        <a href="/changelog.html">Changelog</a>
      </div>
      <div>
        <h4 class="ip-fh">Free resources</h4>
        <a href="/checklist.html">ICAM Checklist</a>
        <a href="/icam-template.html">ICAM Template</a>
        <a href="/icam-toolkit.html">ICAM Toolkit</a>
        <a href="/peepo-chart-builder.html">PEEPO Chart Builder</a>
        <a href="/peepo-cheatsheet.html">PEEPO Cheat Sheet</a>
        <a href="/5-whys-worksheet.html">5-Whys Worksheet</a>
        <a href="/incident-report-template.html">Incident Report Template</a>
        <a href="/rca-template-pack.html">RCA Template Pack</a>
        <a href="/state-of-incident-investigation-2026.html">State of Incident Investigation 2026</a>
      </div>
      <div>
        <h4 class="ip-fh">Company</h4>
        <a href="/blog/">Blog</a>
        <a href="/status.html">Status</a>
        <a href="mailto:hello@investigatepro.app">Contact</a>
        <a href="https://app.investigatepro.app/login">Login</a>
        <h4 class="ip-fh" style="margin-top:20px">Legal</h4>
        <a href="/privacy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
        <a href="/cookie.html">Cookies</a>
        <a href="/dpa.html">DPA</a>
      </div>
    </div>
    <div class="ip-fbot"><span>© 2026 InvestigatePro. All rights reserved.</span><span>Every incident, understood.</span></div>
  </div>
</footer>
'''

MOBILE_MENU = '''<script>
(function(){
  var nav=document.querySelector('nav.ip-nav'); if(!nav) return;
  var links=nav.querySelector('.ip-links');
  var cal=nav.querySelector('.ip-cta');
  if(!links||!cal) return;
  var ICONS={open:'<svg width="26" height="26" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>',close:'<svg width="26" height="26" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>'};
  var btn=document.createElement('button');
  btn.className='mm-btn'; btn.type='button';
  btn.setAttribute('aria-label','Open menu'); btn.setAttribute('aria-expanded','false'); btn.setAttribute('aria-controls','mm-panel');
  btn.innerHTML=ICONS.open;
  cal.parentNode.appendChild(btn);
  var panel=document.createElement('div');
  panel.id='mm-panel'; panel.className='mm-panel';
  links.querySelectorAll('a').forEach(function(a){panel.appendChild(a.cloneNode(true));});
  var login=nav.querySelector('.ip-login');
  if(login){var l=login.cloneNode(true); l.removeAttribute('class'); panel.appendChild(l);}
  var cta=cal.cloneNode(true); cta.className='mm-cta'; panel.appendChild(cta);
  nav.appendChild(panel);
  function setOpen(o){
    document.documentElement.classList.toggle('mm-open',o);
    document.body.classList.toggle('mm-noscroll',o);
    btn.setAttribute('aria-expanded',String(o));
    btn.setAttribute('aria-label',o?'Close menu':'Open menu');
    btn.innerHTML=o?ICONS.close:ICONS.open;
  }
  btn.addEventListener('click',function(){setOpen(!document.documentElement.classList.contains('mm-open'));});
  panel.addEventListener('click',function(e){if(e.target.closest('a'))setOpen(false);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')setOpen(false);});
  window.addEventListener('resize',function(){if(window.innerWidth>=768)setOpen(false);});
})();
</script>
'''


def web_head(css: str) -> str:
    return f'''<!DOCTYPE html>
<!--
    GENERATED FILE — do not hand-edit.
    Source:  src/platform/kit-page.src.html  +  src/platform/assemble.py
    Rebuild: cd src/platform && python3 assemble.py --target web
-->
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Platform — ICAM Incident Investigation Software | InvestigatePro</title>
    <meta name="description" content="How InvestigatePro runs an investigation end to end: PEEPO evidence, the four ICAM levels, scored 5-Whys, hierarchy-of-controls actions, verification and effectiveness, and board and statutory reports across OSHA, MSHA, RIDDOR and MHSA.">
    <link rel="canonical" href="https://investigatepro.app/platform.html">
    <link rel="icon" type="image/png" href="assets/brand/favicon-32.png">

    <!-- Open Graph / Social -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://investigatepro.app/platform.html">
    <meta property="og:title" content="Platform — InvestigatePro">
    <meta property="og:description" content="Investigations that finish sooner and hold up better. The full capability inventory, with what is live and what is still being built.">
    <meta property="og:image" content="https://investigatepro.app/assets/brand/og-image.png">
    <meta name="twitter:card" content="summary_large_image">

    <!-- SoftwareApplication Schema -->
    <script type="application/ld+json">{{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "InvestigatePro",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "AI-guided incident investigation software built on the ICAM methodology, for safety teams in high-hazard industries.",
    "url": "https://investigatepro.app/platform.html",
    "image": "https://investigatepro.app/assets/brand/og-image.png",
    "offers": [
        {{"@type": "Offer", "name": "Starter", "price": "149", "priceCurrency": "USD", "availability": "https://schema.org/InStock"}},
        {{"@type": "Offer", "name": "Professional", "price": "349", "priceCurrency": "USD", "availability": "https://schema.org/InStock"}},
        {{"@type": "Offer", "name": "Business", "price": "749", "priceCurrency": "USD", "availability": "https://schema.org/InStock"}},
        {{"@type": "Offer", "name": "Enterprise", "price": "1500", "priceCurrency": "USD", "availability": "https://schema.org/InStock"}}
    ]
}}</script>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">

    <!-- Tailwind CSS (built) -->
    <link rel="preload" href="assets/css/styles.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="assets/css/styles.min.css"></noscript>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></noscript>

    <style>
{css}
    </style>

    <!-- Structured Data: Breadcrumb -->
    <script type="application/ld+json">{{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        {{"@type": "ListItem", "position": 1, "name": "Home", "item": "https://investigatepro.app/"}},
        {{"@type": "ListItem", "position": 2, "name": "Platform", "item": "https://investigatepro.app/platform.html"}}
    ]
}}</script>
</head>
<body class="font-sans antialiased bg-cloud text-ink">
'''


def build(target: str) -> pathlib.Path:
    css, kit_nav, kit_footer, middle, script = parse_source()
    scoped = scope_css(css) + HEADING_FIX
    body = middle.replace("__ACCORDIONS__", accordions())

    if target == "web":
        # the hero must clear the site's fixed nav (py-3 + h-12 = 72px)
        scoped += ("\n.mk .hero{padding-top:150px}"
                   # deep links (#capabilities, #compare) must clear the 72px fixed nav
                   "\n.mk section[id]{scroll-margin-top:92px}"
                   "\n@media print{nav,footer{display:none}}\n")
        # Keep the accordion handler; drop the scroll-spy — its document-wide
        # querySelectorAll('nav a') would light up the SITE nav on this page.
        script = '''    <script>
    document.querySelectorAll('.mk .acc > button').forEach(function (b) {
        b.addEventListener('click', function () {
            var open = b.parentElement.classList.toggle('open');
            b.setAttribute('aria-expanded', String(open));
        });
    });
    </script>
'''
        html = (web_head(scoped) + "\n" + SITE_NAV + '\n<main class="mk">\n' + body +
                '\n</main>\n\n' + SITE_FOOTER + "\n" + MOBILE_MENU + script +
                '    <script src="/analytics.js"></script>\n</body>\n</html>\n')
        dest = ROOT / "platform.html"
    else:
        fonts_path = ROOT / "assets" / "fonts.css"
        if not fonts_path.exists():
            sys.exit("assets/fonts.css missing — regenerate it from the @fontsource packages "
                     "(see README) before building the offline target.")
        fonts = fonts_path.read_text()
        logo = "data:image/svg+xml;base64," + base64.b64encode(
            (ROOT / "assets" / "logo-horizontal-white.svg").read_bytes()).decode()
        # scope the kit's own chrome too, so one CSS block serves both targets
        html = ('<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8">\n'
                '<meta name="viewport" content="width=device-width,initial-scale=1">\n'
                '<title>InvestigatePro — Marketing Kit</title>\n<style>\n'
                + fonts + "\n" + scoped +
                "\n</style>\n</head><body>\n"
                '<div class="mk">\n' + kit_nav + "\n" + body + "\n" + kit_footer + "\n</div>\n"
                + script + "\n</body></html>\n")
        html = html.replace("__LOGO_WHITE__", logo)
        dest = ROOT / "InvestigatePro-Marketing-Kit.html"

    for token in ("__FONTS__", "__LOGO_WHITE__", "__ACCORDIONS__"):
        if token in html:
            sys.exit(f"unsubstituted placeholder {token} in {target} build")
    dest.write_text(html)
    print(f"{dest.name}  {dest.stat().st_size/1024:.0f} KB  ({target})")
    return dest


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--target", choices=["web", "offline", "both"], default="both")
    a = ap.parse_args()
    for t in (["web", "offline"] if a.target == "both" else [a.target]):
        build(t)
