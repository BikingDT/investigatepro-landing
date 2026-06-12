#!/usr/bin/env python3
"""InvestigatePro rebrand: dark navy/cyan -> light Cloud/Apex Teal (Brand v1.0).
Run from repo root. Idempotent-ish; operates on tracked HTML files."""
import json, re, sys
from pathlib import Path

ROOT = Path('.')
EXCLUDE = [
    'node_modules', 'index-backup-20260305.html', 'index.html.backup',
    'investigatepro-assets/linkedin-profile', 'assets/social',
]

def excluded(p: Path) -> bool:
    s = str(p)
    return any(e in s for e in EXCLUDE)

FILES = [p for p in ROOT.rglob('*.html') if not excluded(p)]

# ---------------- helpers ----------------
def sub(pattern, repl, text, flags=0):
    return re.sub(pattern, repl, text, flags=flags)

stats = {}

# ---------------- 1. targeted CSS rule rewrites (before hex maps) ----------------
RULE_REWRITES = [
    (r'(\.glass-dark\s*\{)[^}]*\}',
     r'\1background:rgba(255,255,255,.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(217,226,232,.8)}'),
    (r'(\.gradient-hero\s*\{)[^}]*\}',
     r'\1background:linear-gradient(180deg,#EBF1F0 0%,#F4F7F9 45%,#FFFFFF 100%)}'),
    (r'(\.trust-badge\s*\{)[^}]*\}',
     r'\1background:#FFFFFF;border:1px solid #D9E2E8;box-shadow:0 1px 3px rgba(17,45,60,.06)}'),
    (r'(\.gradient-text\s*\{[^}]*?background\s*:\s*)linear-gradient\([^)]*\)',
     r'\1linear-gradient(to right,#00695C,#004D40)'),
    (r'color-scheme\s*:\s*dark', 'color-scheme:light'),
]

# ---------------- 2. class-token map ----------------
CTA_BG = re.compile(r'\b(bg-cyan-500|bg-cyan-400|bg-white)\b')
CTA_TX = re.compile(r'\btext-navy-9\d\d\b')

def rewrite_cta(attr: str) -> str:
    """Buttons that were cyan/white with dark text -> Apex Teal with white text."""
    attr = re.sub(r'\bhover:bg-cyan-(400|300|200)\b', 'hover:bg-apex-700', attr)
    attr = re.sub(r'\bhover:bg-(gray|cyan)-100\b', 'hover:bg-apex-700', attr)
    attr = re.sub(r'\bhover:bg-white\b', 'hover:bg-apex-700', attr)
    attr = re.sub(r'\bbg-cyan-(500|400)\b', 'bg-apex-500', attr)
    attr = re.sub(r'\bbg-white\b', 'bg-apex-500', attr)
    attr = re.sub(r'\b(hover:)?text-navy-9\d\d\b', 'KEEPWHITE', attr)
    attr = re.sub(r'\btext-white\b', 'KEEPWHITE', attr)
    return attr

def class_attr_pass(html: str) -> str:
    def fix(m):
        attr = m.group(2)
        if CTA_BG.search(attr) and CTA_TX.search(attr):
            attr = rewrite_cta(attr)
        return m.group(1) + attr + m.group(3)
    return re.sub(r'(class=")([^"]*)(")', fix, html)

TOKEN_MAP = [
    # --- navy surfaces -> light ---
    (r'\bbg-navy-9\d\d/95\b', 'bg-white/95'),
    (r'\bbg-navy-9\d\d/\d+\b', 'bg-white/80'),
    (r'\bbg-navy-8\d\d/\d+\b', 'bg-white/70'),
    (r'\bbg-navy-7\d\d/\d+\b', 'bg-mist/50'),
    (r'\bhover:bg-navy-7\d\d\b', 'hover:bg-mist/60'),
    (r'\bhover:bg-navy-[89]\d\d\b', 'hover:bg-cloud'),
    (r'\bbg-navy-95\d\b', 'bg-cloud'),
    (r'\bbg-navy-900\b', 'bg-cloud'),
    (r'\bbg-navy-800\b', 'bg-white'),
    (r'\bbg-navy-700\b', 'bg-cloud'),
    (r'\bbg-navy-[65]\d\d\b', 'bg-mist'),
    (r'\bfrom-navy-9\d\d\b', 'from-cloud'),
    (r'\bfrom-navy-8\d\d\b', 'from-white'),
    (r'\bvia-navy-9\d\d\b', 'via-cloud'),
    (r'\bvia-navy-8\d\d\b', 'via-white'),
    (r'\bto-navy-9\d\d\b', 'to-white'),
    (r'\bto-navy-8\d\d\b', 'to-white'),
    (r'\bto-navy-7\d\d\b', 'to-cloud'),
    (r'\b(border|divide|ring)-navy-\d+(/\d+)?\b', r'\1-mist'),
    (r'\bshadow-navy-\d+(/\d+)?\b', 'shadow-mist'),
    (r'\btext-navy-\d+\b', 'text-ink'),
    # --- cyan accents -> apex teal ---
    (r'\bbg-cyan-(500|400)/(20|25|30)\b', 'bg-apex-500/10'),
    (r'\bbg-cyan-(500|400)/10\b', 'bg-apex-500/10'),
    (r'\bbg-cyan-(500|400)/5\b', 'bg-apex-500/5'),
    (r'\bhover:bg-cyan-(500|400)/\d+\b', 'hover:bg-apex-500/15'),
    (r'\bhover:bg-cyan-(400|300)\b', 'hover:bg-apex-700'),
    (r'\bbg-cyan-(500|400)\b', 'bg-apex-500'),
    (r'\bbg-cyan-300\b', 'bg-apex-300'),
    (r'\bbg-cyan-200\b', 'bg-apex-100'),
    (r'\bbg-cyan-100\b', 'bg-apex-50'),
    (r'\bhover:text-cyan-\d+\b', 'hover:text-apex-700'),
    (r'\btext-cyan-\d+(/\d+)?\b', 'text-apex-500'),
    (r'\bhover:border-cyan-\d+(/\d+)?\b', 'hover:border-apex-500'),
    (r'\bborder-cyan-\d+/\d+\b', 'border-apex-500/30'),
    (r'\bborder-cyan-\d+\b', 'border-apex-500'),
    (r'\b(ring|fill|stroke|accent|caret|outline)-cyan-\d+(/\d+)?\b', r'\1-apex-500'),
    (r'\bfrom-cyan-\d+/\d+\b', 'from-apex-500/10'),
    (r'\bfrom-cyan-\d+\b', 'from-apex-500'),
    (r'\bvia-cyan-\d+(/\d+)?\b', 'via-apex-300'),
    (r'\bto-cyan-\d+(/\d+)?\b', 'to-apex-300'),
    (r'\bshadow-cyan-\d+/\d+\b', 'shadow-apex-500/20'),
    (r'\bshadow-cyan-\d+\b', 'shadow-apex-500/20'),
    (r'\bplaceholder-cyan-\d+\b', 'placeholder-apex-300'),
    # --- text on dark -> ink/graphite (KEEPWHITE already protected) ---
    (r'\bhover:text-white\b', 'hover:text-ink'),
    (r'\btext-white(/\d+)?\b', 'text-ink'),
    (r'\btext-gray-[123]00\b', 'text-slate'),
    (r'\btext-gray-[456]00\b', 'text-graphite'),
    (r'\btext-gray-[789]00\b', 'text-ink'),
    (r'\btext-black\b', 'text-ink'),
    (r'\bplaceholder-gray-\d+\b', 'placeholder-graphite'),
    (r'\bbg-gray-100\b', 'bg-cloud'),
    (r'\bbg-gray-200\b', 'bg-mist'),
    (r'\bbg-gray-[6789]\d\d(/\d+)?\b', 'bg-mist'),
    (r'\b(border|divide)-gray-\d+(/\d+)?\b', r'\1-mist'),
    (r'\bhover:bg-gray-100\b', 'hover:bg-cloud'),
    # --- semantic colors -> brand semantics ---
    (r'\btext-(purple|violet|indigo|blue|sky)-[34]00\b', 'text-neural-500'),
    (r'\bbg-(purple|violet|indigo|blue|sky)-500/\d+\b', 'bg-neural-500/10'),
    (r'\bbg-(purple|violet|indigo|blue|sky)-(500|600)\b', 'bg-neural-500'),
    (r'\bborder-(purple|violet|indigo|blue|sky)-\d+(/\d+)?\b', 'border-neural-300'),
    (r'\btext-(green|emerald)-[34]00\b', 'text-growth-700'),
    (r'\bbg-(green|emerald)-500/\d+\b', 'bg-growth-500/10'),
    (r'\bbg-(green|emerald)-(500|600)\b', 'bg-growth-500'),
    (r'\bborder-(green|emerald)-\d+(/\d+)?\b', 'border-growth-300'),
    (r'\btext-red-[34]00\b', 'text-critical'),
    (r'\bbg-red-500/\d+\b', 'bg-critical/10'),
    (r'\bbg-red-(500|600)\b', 'bg-critical'),
    (r'\bborder-red-\d+(/\d+)?\b', 'border-critical/40'),
    (r'\btext-(amber|yellow)-[34]00\b', 'text-warning-700'),
    (r'\bbg-(amber|yellow)-500/\d+\b', 'bg-warning/10'),
    (r'\bbg-(amber|yellow)-(400|500)\b', 'bg-warning'),
    (r'\bborder-(amber|yellow)-\d+(/\d+)?\b', 'border-warning/40'),
]

# ---------------- 3. hex maps ----------------
DARK_NAVIES = '0C142E|080E1F|0A1228|0F1A3A|1A2744|1E2D4A|1A2544|0F1A2E|0F1E3A|2A3A5C|3D4F70|111827|1F2937|0F172A|1E293B'
COLOR_PRE = [  # color: <dark navy> stays dark ink; light grays as TEXT -> slate/graphite
    (rf'((?:^|[;{{\s])(?:color|-webkit-text-fill-color)\s*:\s*)#({DARK_NAVIES})\b', r'\1#112D3C'),
    (r'((?:^|[;{\s])(?:color|-webkit-text-fill-color)\s*:\s*)#(D1D5DB|E5E7EB|E2E8F0|F3F4F6|F9FAFB|F8FAFC|F1F5F9)\b', r'\1#37474F'),
    (r'((?:^|[;{\s])(?:color|-webkit-text-fill-color)\s*:\s*)#(9CA3AF|94A3B8|CBD5E1|6B7280)\b', r'\1#5A6B76'),
]
BORDER_PRE = [
    (r'(border[^:;{}]*:\s*[^;{}]*?)#(1A2744|1E2D4A|1A2544|2A3A5C|3D4F70|374151|4B5563)\b', r'\1#D9E2E8'),
]
HEX_MAP = [
    (r'#(080E1F|0A1228|0C142E|0F1A2E|0F1E3A)\b', '#F4F7F9'),
    (r'#(0F1A3A|1A2744|1E2D4A|1A2544)\b', '#FFFFFF'),
    (r'#(2A3A5C|3D4F70)\b', '#D9E2E8'),
    (r'#(111827|1F2937|0F172A|1E293B)\b', '#112D3C'),
    (r'#(76DCEC|88E0EE|A8EAF3|5BC4D4|06B6D4|22D3EE|67E8F9)\b', '#004D40'),
    (r'#(C8F1F8)\b', '#CCDBD9'),
    (r'#(E8F9FC)\b', '#EBF1F0'),
    (r'#(D1D5DB)\b', '#37474F'),
    (r'#(9CA3AF|94A3B8|64748B|6B7280)\b', '#5A6B76'),
    (r'#(4B5563|374151)\b', '#37474F'),
    (r'#(E5E7EB|E2E8F0|CBD5E1)\b', '#D9E2E8'),
    (r'#(F1F5F9|F8FAFC|F9FAFB|F3F4F6)\b', '#F4F7F9'),
    (r'#(F87171|EF4444|DC2626)\b', '#E53935'),
    (r'#(FCA5A5)\b', '#EF9A9A'),
    (r'#(B91C1C)\b', '#C62828'),
    (r'#(22C55E|10B981|34D399|4ADE80|16A34A)\b', '#4CAF50'),
    (r'#(6EE7B7|86EFAC)\b', '#9DD39F'),
    (r'#(F59E0B|FBBF24|FCD34D|EAB308)\b', '#FFB300'),
    (r'#(8B5CF6|A78BFA|7C3AED|9333EA)\b', '#2196F3'),
    (r'#(3B82F6|60A5FA|2563EB|0EA5E9|38BDF8|93C5FD)\b', '#2196F3'),
]

RGBA_CYAN = re.compile(r'rgba\(\s*118\s*,\s*220\s*,\s*236\s*,\s*([0-9.]+)\s*\)')
RGBA_DARK = re.compile(r'rgba\(\s*(?:8\s*,\s*14\s*,\s*31|12\s*,\s*20\s*,\s*46|10\s*,\s*18\s*,\s*40|15\s*,\s*26\s*,\s*58|26\s*,\s*39\s*,\s*68)\s*,\s*([0-9.]+)\s*\)')
RGBA_WHITE = re.compile(r'rgba\(\s*255\s*,\s*255\s*,\s*255\s*,\s*(0?\.[0-9]+|0)\s*\)')

def rgba_pass(text: str) -> str:
    text = RGBA_CYAN.sub(lambda m: f'rgba(0,77,64,{m.group(1)})', text)
    text = RGBA_DARK.sub(lambda m: f'rgba(244,247,249,{m.group(1)})', text)
    def white(m):
        a = float(m.group(1))
        if a <= 0.3:  # subtle white wash on dark -> subtle ink wash on light
            return f'rgba(17,45,60,{round(max(a*0.6,0.04),3)})'
        return m.group(0)
    return RGBA_WHITE.sub(white, text)

# ---------------- 4. fonts ----------------
def font_pass(text: str) -> str:
    text = re.sub(r'family=Lexend:wght@[0-9;]+', 'family=Montserrat:wght@600;700;800', text)
    text = re.sub(r'family=Lexend\b', 'family=Montserrat:wght@600;700;800', text)
    def add_mont(m):
        url = m.group(0)
        if 'Montserrat' in url:
            return url
        return url.replace('family=Inter', 'family=Montserrat:wght@600;700;800&family=Inter', 1)
    text = re.sub(r'https://fonts\.googleapis\.com/css2\?[^"\']*', add_mont, text)
    text = re.sub(r"(['\"])Lexend\1", r"\1Montserrat\1", text)
    text = text.replace('Lexend,', 'Montserrat,')
    return text

# ---------------- 5. meta / assets / schema ----------------
def asset_pass(text: str) -> str:
    # OG / twitter / schema absolute image URLs first
    text = re.sub(r'https://investigatepro\.app/[^"\']*logo-03[^"\']*\.(png|webp|jpg)',
                  'https://investigatepro.app/assets/brand/og-image.png', text)
    # favicon links
    text = re.sub(r'(rel="(?:shortcut )?icon"[^>]*href="[^"]*?)assets/logos/logo-03-icon-only-optimized\.png',
                  r'\1assets/brand/favicon-32.png', text)
    text = re.sub(r'(href="[^"]*?)assets/logos/logo-03-icon-only-optimized\.png("[^>]*rel="(?:shortcut )?icon")',
                  r'\1assets/brand/favicon-32.png\2', text)
    # apple touch
    text = re.sub(r'(rel="apple-touch-icon"[^>]*href="[^"]*?)assets/logos/[^"]*\.png',
                  r'\1assets/brand/favicon-180.png', text)
    # remaining logo refs (img/src/srcset) keep relative prefix
    text = text.replace('investigatepro-assets/logos/logo-03-horizontal.webp', 'assets/brand/logo-horizontal.svg')
    text = text.replace('investigatepro-assets/logos/logo-03-horizontal.png', 'assets/brand/logo-horizontal.svg')
    text = text.replace('investigatepro-assets/logos/logo-03-dark-bg.png', 'assets/brand/logo-horizontal.svg')
    text = text.replace('assets/logos/logo-03-on-dark.webp', 'assets/brand/logo-horizontal.svg')
    text = text.replace('assets/logos/logo-03-on-dark.png', 'assets/brand/logo-horizontal.svg')
    text = text.replace('assets/logos/logo-03-on-light.webp', 'assets/brand/logo-horizontal.svg')
    text = text.replace('assets/logos/logo-03-on-light.png', 'assets/brand/logo-horizontal.svg')
    text = text.replace('assets/logos/logo-03-lettermark-ip.png', 'assets/brand/icon-color.svg')
    text = text.replace('assets/logos/logo-03-icon-only-optimized.png', 'assets/brand/icon-color.svg')
    text = text.replace('assets/logos/email-logo.webp', 'assets/brand/logo-horizontal-1200w.png')
    text = text.replace('assets/logos/email-logo.png', 'assets/brand/logo-horizontal-1200w.png')
    # theme-color
    text = re.sub(r'(name="theme-color"\s+content=")#[0-9a-fA-F]{6}(")', r'\1#004D40\2', text)
    return text

def schema_pass(text: str) -> str:
    """Remove fabricated aggregateRating from JSON-LD; point logo at brand PNG."""
    def fix_block(m):
        raw = m.group(2)
        try:
            data = json.loads(raw)
        except Exception:
            return m.group(0)
        def strip(obj):
            if isinstance(obj, dict):
                obj.pop('aggregateRating', None)
                if 'logo' in obj and isinstance(obj['logo'], str) and 'logo-03' in obj['logo']:
                    obj['logo'] = 'https://investigatepro.app/assets/brand/logo-horizontal-1200w.png'
                for v in obj.values():
                    strip(v)
            elif isinstance(obj, list):
                for v in obj:
                    strip(v)
        strip(data)
        return m.group(1) + json.dumps(data, indent=4) + m.group(3)
    return re.sub(r'(<script type="application/ld\+json">)(.*?)(</script>)', fix_block, text, flags=re.S)

# ---------------- run ----------------
changed = 0
for f in FILES:
    orig = f.read_text(encoding='utf-8', errors='replace')
    t = orig
    for pat, repl in RULE_REWRITES:
        t = re.sub(pat, repl, t, flags=re.S | re.I)
    t = schema_pass(t)
    t = asset_pass(t)
    t = class_attr_pass(t)
    for pat, repl in TOKEN_MAP:
        t = re.sub(pat, repl, t)
    for pat, repl in COLOR_PRE + BORDER_PRE:
        t = re.sub(pat, repl, t, flags=re.I | re.M)
    for pat, repl in HEX_MAP:
        t = re.sub(pat, repl, t, flags=re.I)
    t = rgba_pass(t)
    t = font_pass(t)
    t = t.replace('KEEPWHITE', 'text-white')
    if t != orig:
        f.write_text(t, encoding='utf-8')
        changed += 1
print(f'transformed {changed}/{len(FILES)} html files')
