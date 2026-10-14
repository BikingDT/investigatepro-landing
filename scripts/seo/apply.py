#!/usr/bin/env python3
"""
InvestigatePro landing: SEO pass. Idempotent — safe to run on every change.

What it does (all in-place, static HTML):
  1. Blog posts: completes the BlogPosting JSON-LD (dates from git, description,
     image, mainEntityOfPage, author/publisher URLs) and adds a visible
     <time> in the byline. Fixes ", InvestigatePro | InvestigatePro" titles.
  2. Industry pages: adds WebPage + BreadcrumbList JSON-LD.
  3. platform.html: adds WebPage JSON-LD pointing at the SoftwareApplication.
  4. faq.html: generates FAQPage JSON-LD from the <details>/<summary> markup.
  5. Footer: <h2> column headings become <p class="foot__h"> on every page
     (keeps the page outline to real content headings).
  6. Related reading: appends a "Related reading" block to posts and a
     "Further reading" block to industry pages, from scripts/seo/linkmap.json.
  7. Regulators: links the first plain-text mention of MSHA/OSHA/RIDDOR/MHSA
     etc. in article bodies to the official site.
  8. sitemap.xml: lastmod per URL from the file's last git commit.

Usage:  python3 scripts/seo/apply.py [--check]
  --check  report what would change, write nothing, exit 1 if anything would.
"""
import json, os, re, subprocess, sys, html
from datetime import date

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SITE = "https://investigatepro.app"
CHECK = "--check" in sys.argv
LINKMAP = json.load(open(os.path.join(ROOT, "scripts/seo/linkmap.json")))
changed = []

ORG = {"@type": "Organization", "@id": SITE + "/#org", "name": "InvestigatePro", "url": SITE + "/",
       "logo": {"@type": "ImageObject", "url": SITE + "/assets/brand/logo-horizontal-1200w.png"}}
AUTHOR = {"@type": "Person", "@id": SITE + "/#devon", "name": "Devon Turner", "jobTitle": "Founder",
          "url": SITE + "/", "worksFor": {"@id": SITE + "/#org"}}


def rd(p): return open(os.path.join(ROOT, p), encoding="utf-8").read()
def wr(p, s):
    if rd(p) == s: return
    changed.append(p)
    if not CHECK: open(os.path.join(ROOT, p), "w", encoding="utf-8").write(s)


def git_dates(p):
    first = subprocess.run(["git", "log", "--diff-filter=A", "--format=%as", "--", p], cwd=ROOT,
                           capture_output=True, text=True).stdout.split()
    last = subprocess.run(["git", "log", "-1", "--format=%as", "--", p], cwd=ROOT,
                          capture_output=True, text=True).stdout.strip()
    return (first[-1] if first else last or date.today().isoformat()), (last or date.today().isoformat())


def meta(s, name):
    m = re.search(r'<meta (?:name|property)="%s" content="([^"]*)"' % re.escape(name), s)
    return html.unescape(m.group(1)) if m else ""

def tag(s, t):
    m = re.search(r"<%s[^>]*>(.*?)</%s>" % (t, t), s, re.S)
    return html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip().rstrip(".") if m else ""

def canonical(s):
    m = re.search(r'<link rel="canonical" href="([^"]+)"', s); return m.group(1) if m else ""

def h1_of(path):
    p = path.lstrip("/"); p = p + "index.html" if p.endswith("/") or p == "" else p
    if not os.path.exists(os.path.join(ROOT, p)): raise SystemExit("linkmap target missing: " + path)
    return tag(rd(p), "h1")

def ld(obj): return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "</script>"

def replace_or_insert_ld(s, marker, obj):
    """Replace an existing data-seo=marker block or insert before </head>."""
    block = ld(obj).replace('<script type="application/ld+json">', '<script type="application/ld+json" data-seo="%s">' % marker)
    pat = re.compile(r'<script type="application/ld\+json" data-seo="%s">.*?</script>\n?' % marker, re.S)
    if pat.search(s): return pat.sub(lambda _: block + "\n", s)
    return s.replace("</head>", block + "\n</head>", 1)

def pretty(d):
    y, m, dd = d.split("-"); return "%d %s %s" % (int(dd), ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][int(m)-1], y)


# ---------- 5. footer headings ----------
def fix_footer(s):
    return re.sub(r"<h2>(Product|Free tools|Industries|Company)</h2>", r'<p class="foot__h">\1</p>', s)


# ---------- 6. related blocks ----------
def related_block(title, targets, cls):
    items = "".join('<li><a href="%s">%s</a></li>' % (t, html.escape(h1_of(t))) for t in targets)
    return '<nav class="%s" data-seo="related" aria-label="%s"><p class="%s__h">%s</p><ul>%s</ul></nav>' % (cls, title, cls, title, items)

def put_related(s, block):
    pat = re.compile(r'<nav class="[^"]+" data-seo="related".*?</nav>', re.S)
    if pat.search(s): return pat.sub(lambda _: block, s)
    return s


# ---------- 7. regulator links ----------
def link_regulators(s):
    m = re.search(r"<article.*?</article>|<main.*?</main>", s, re.S)
    if not m: return s
    body = m.group(0)
    for name, url in LINKMAP["regulators"].items():
        if 'href="%s"' % url in body: continue
        # first mention not already inside a tag or an <a>…</a>
        pat = re.compile(r'(?<![\w/"=-])%s(?![\w-])(?![^<]*</a>)(?![^<]*>)' % re.escape(name))
        body, n = pat.subn('<a href="%s" rel="noopener" target="_blank">%s</a>' % (url, name), body, count=1)
    return s[:m.start()] + body + s[m.end():]


# ---------- 1. blog posts ----------
for f in sorted(os.listdir(os.path.join(ROOT, "blog"))):
    if not f.endswith(".html") or f == "index.html": continue
    p = "blog/" + f; s = rd(p); orig = s
    pub, mod = git_dates(p)
    s = s.replace(", InvestigatePro | InvestigatePro</title>", " | InvestigatePro</title>")
    obj = {"@context": "https://schema.org", "@type": "BlogPosting",
           "@id": canonical(s) + "#article", "mainEntityOfPage": canonical(s),
           "headline": tag(s, "h1"), "description": meta(s, "description"),
           "image": meta(s, "og:image") or SITE + "/assets/img/og-article.png",
           "datePublished": pub, "dateModified": mod, "inLanguage": "en-GB",
           "author": AUTHOR, "publisher": ORG}
    # drop the old bare BlogPosting block, replace with marked one
    s = re.sub(r'<script type="application/ld\+json">\{"@context":"https://schema.org","@type":"BlogPosting".*?</script>\n?', "", s, count=1, flags=re.S)
    s = replace_or_insert_ld(s, "article", obj)
    # visible date in byline
    tm = '<time datetime="%s" data-seo="published">Published %s</time>' % (pub, pretty(pub))
    if 'data-seo="published"' in s:
        s = re.sub(r'<time datetime="[^"]*" data-seo="published">[^<]*</time>', tm, s)
    else:
        s = s.replace("</span></div>\n  </div>\n</section>", " · " + tm + "</span></div>\n  </div>\n</section>", 1)
    # related reading, before the closing author card
    key = "/" + p
    if key in LINKMAP["posts"]:
        blk = related_block("Related reading", LINKMAP["posts"][key], "related")
        if 'data-seo="related"' in s: s = put_related(s, blk)
        else: s = s.replace('      <div class="author">', blk + '\n      <div class="author">', 1)
    s = link_regulators(s)
    s = fix_footer(s)
    wr(p, s)

# ---------- 2. industry pages ----------
for f in sorted(os.listdir(os.path.join(ROOT, "industries"))):
    if not f.endswith(".html"): continue
    p = "industries/" + f; s = rd(p)
    crumbs = {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Industries", "item": SITE + "/#industries"},
        {"@type": "ListItem", "position": 3, "name": tag(s, "h1"), "item": canonical(s)}]}
    page = {"@type": "WebPage", "@id": canonical(s), "url": canonical(s), "name": tag(s, "title"),
            "description": meta(s, "description"), "inLanguage": "en-GB", "isPartOf": {"@id": SITE + "/#website"},
            "about": {"@id": SITE + "/#app"}, "publisher": ORG, "breadcrumb": crumbs}
    s = replace_or_insert_ld(s, "page", {"@context": "https://schema.org", "@graph": [page, crumbs]})
    key = "/" + p
    if key in LINKMAP["industries"]:
        blk = related_block("Further reading", LINKMAP["industries"][key], "related")
        if 'data-seo="related"' in s: s = put_related(s, blk)
        else: s = s.replace("</main>", '<section class="sec sec--tight"><div class="wrap">' + blk + "</div></section>\n</main>", 1)
    s = link_regulators(s)
    s = fix_footer(s)
    wr(p, s)

# ---------- 3. platform ----------
p = "platform.html"; s = rd(p)
page = {"@context": "https://schema.org", "@type": "WebPage", "@id": canonical(s), "url": canonical(s),
        "name": tag(s, "title"), "description": meta(s, "description"), "inLanguage": "en-GB",
        "about": {"@id": SITE + "/#app"}, "publisher": ORG}
wr(p, fix_footer(replace_or_insert_ld(s, "page", page)))

# ---------- 4. FAQ ----------
p = "faq.html"; s = rd(p)
qa = []
for m in re.finditer(r"<details[^>]*><summary>(.*?)</summary><div class=\"ans\">(.*?)</div></details>", s, re.S):
    q = html.unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip()
    a = html.unescape(re.sub(r"<span class=\"verify\">.*?</span>", "", m.group(2), flags=re.S))
    a = re.sub(r"<[^>]+>", "", a).strip()
    qa.append({"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}})
faq = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": qa}
wr(p, fix_footer(replace_or_insert_ld(s, "faq", faq)))

# ---------- 5. footer on all remaining pages ----------
for dp, _, fs in os.walk(ROOT):
    if any(x in dp for x in (".git", "node_modules", "sales-deck", "investigatepro-assets")): continue
    for f in fs:
        if f.endswith(".html"):
            p = os.path.relpath(os.path.join(dp, f), ROOT); wr(p, fix_footer(rd(p)))

# ---------- 8. sitemap lastmod ----------
p = "sitemap.xml"; s = rd(p)
def fix_url(m):
    url = m.group(1); path = url[len(SITE):].lstrip("/") or "index.html"
    if path.endswith("/"): path += "index.html"
    if not os.path.exists(os.path.join(ROOT, path)): return m.group(0)
    return "<loc>%s</loc>\n    <lastmod>%s</lastmod>" % (url, git_dates(path)[1])
s = re.sub(r"<loc>([^<]+)</loc>\s*<lastmod>[^<]*</lastmod>", fix_url, s)
wr(p, s)

# ---------- home: add WebSite + @id anchors so other pages can reference them ----------
p = "index.html"; s = rd(p)
if '"@id":"%s/#app"' % SITE not in s:
    s = s.replace('{"@type":"SoftwareApplication","name":"InvestigatePro"', '{"@type":"SoftwareApplication","@id":"%s/#app","name":"InvestigatePro"' % SITE, 1)
site = {"@context": "https://schema.org", "@type": "WebSite", "@id": SITE + "/#website", "url": SITE + "/",
        "name": "InvestigatePro", "publisher": ORG, "inLanguage": "en-GB"}
wr(p, fix_footer(replace_or_insert_ld(s, "website", site)))

print(("WOULD CHANGE" if CHECK else "CHANGED") + " %d files" % len(changed))
for c in changed: print("  " + c)
if CHECK and changed: sys.exit(1)
