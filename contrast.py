#!/usr/bin/env python3
"""Contrast pass: dark Deep Ink nav/footer site-wide, dark accent sections on index,
solid cards, visible borders, dead-token fixes. Brand v1.0 dark-zone deployment."""
import re, glob, sys

SKIP = ('node_modules', 'index-backup', '.backup', 'linkedin-profile', 'assets/social')
FILES = [p for p in glob.glob('**/*.html', recursive=True) if not any(s in p for s in SKIP)]

NAV_TAG = [
    ('<nav class="fixed w-full bg-white/95 backdrop-blur-sm z-50 border-b border-mist"',
     '<nav class="fixed w-full bg-ink/95 backdrop-blur-md z-50 border-b border-white/10"'),
    ('<nav class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-mist"',
     '<nav class="fixed top-0 left-0 right-0 z-50 bg-ink/95 backdrop-blur-md border-b border-white/10"'),
    ('<nav class="fixed w-full glass-dark z-50"',
     '<nav class="fixed w-full bg-ink/95 backdrop-blur-md z-50 border-b border-white/10"'),
    ('<nav class="fixed w-full bg-navy-900/95 backdrop-blur-sm z-50 border-b border-navy-700"',
     '<nav class="fixed w-full bg-ink/95 backdrop-blur-md z-50 border-b border-white/10"'),
]

def rewrite_nav_inner(block: str) -> str:
    block = block.replace('assets/brand/logo-horizontal.svg', 'assets/brand/logo-horizontal-white.svg')
    block = block.replace('text-slate hover:text-ink', 'text-mist hover:text-white')
    block = block.replace('hover:text-ink', 'hover:text-white')
    block = block.replace('text-slate', 'text-mist')
    block = block.replace('text-graphite', 'text-mist/80')
    block = block.replace('text-ink hover:text-white', 'text-mist hover:text-white')
    block = block.replace('bg-apex-500 hover:bg-apex-700 text-white', 'bg-mint hover:bg-mint-600 text-ink')
    block = block.replace('bg-apex-500 text-white', 'bg-mint text-ink')
    block = block.replace('border-mist', 'border-white/10')
    block = block.replace('>Start Free Trial<', '>Book Demo<')
    return block

def rewrite_footer_inner(block: str) -> str:
    block = block.replace('assets/brand/logo-horizontal.svg', 'assets/brand/logo-horizontal-white.svg')
    block = block.replace('hover:text-ink', 'hover:text-mint')
    block = block.replace('hover:text-apex-700', 'hover:text-mint')
    block = block.replace('text-apex-500', 'text-mint')
    block = block.replace('text-ink', 'text-white')
    block = block.replace('text-slate', 'text-mist/90')
    block = block.replace('text-graphite', 'text-mist/70')
    block = block.replace('border-mist', 'border-white/10')
    block = block.replace('bg-white ', 'bg-white/5 ')
    block = block.replace('bg-cloud', 'bg-white/5')
    return block

FOOT_TAG = re.compile(r'<footer class="(?:py-\d+ )?bg-(?:cloud|white|navy-900|primary)[^"]*"')

def foot_repl(m):
    cls = m.group(0)
    py = re.search(r'py-\d+', cls)
    return f'<footer class="bg-ink {py.group(0) if py else "py-12"} border-t border-white/10"'

NAV_BLOCK = re.compile(r'(<nav class="fixed[^"]*"[^>]*>)(.*?)(</nav>)', re.S)
FOOT_BLOCK = re.compile(r'(<footer[^>]*>)(.*?)(</footer>)', re.S)

changed = 0
for f in FILES:
    s = open(f, encoding='utf-8', errors='replace').read(); o = s
    for a, b in NAV_TAG:
        s = s.replace(a, b)
    # nav inner: only fixed navs (now bg-ink)
    def nav_fix(m):
        if 'bg-ink' in m.group(1):
            return m.group(1) + rewrite_nav_inner(m.group(2)) + m.group(3)
        return m.group(0)
    s = NAV_BLOCK.sub(nav_fix, s)
    # footer tag + inner
    s = FOOT_TAG.sub(foot_repl, s)
    def foot_fix(m):
        if 'bg-ink' in m.group(1):
            return m.group(1) + rewrite_footer_inner(m.group(2)) + m.group(3)
        return m.group(0)
    s = FOOT_BLOCK.sub(foot_fix, s)
    # global: translucent cards -> solid, theme-color -> ink
    s = s.replace('bg-white/70', 'bg-white shadow-sm')
    s = s.replace('bg-white/80', 'bg-white')
    s = re.sub(r'(name="theme-color"\s+content=")#004D40(")', r'\g<1>#112D3C\g<2>', s)
    # mobile menu styles (index/pricing/demo share the block)
    s = s.replace('.mm-btn{display:none;background:none;border:0;color:#37474F;',
                  '.mm-btn{display:none;background:none;border:0;color:#C9D6DD;')
    s = s.replace('.mm-btn:hover{color:#112D3C;background:rgba(17,45,60,0.048)}',
                  '.mm-btn:hover{color:#FFFFFF;background:rgba(255,255,255,0.08)}')
    s = s.replace('background:rgba(244,247,249,.98);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-bottom:1px solid rgba(0,77,64,.25)',
                  'background:rgba(17,45,60,.98);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);border-bottom:1px solid rgba(255,255,255,.1)')
    s = s.replace('.mm-panel a{display:block;padding:14px 8px;color:#37474F;font-size:18px;font-weight:500;border-bottom:1px solid rgba(17,45,60,0.04);',
                  '.mm-panel a{display:block;padding:14px 8px;color:#C9D6DD;font-size:18px;font-weight:500;border-bottom:1px solid rgba(255,255,255,0.08);')
    s = s.replace('.mm-panel a.mm-cta{margin-top:16px;background:#004D40;color:#FFFFFF;',
                  '.mm-panel a.mm-cta{margin-top:16px;background:#64FFDA;color:#112D3C;')
    s = s.replace('.mm-panel a:hover{color:#FFFFFF;', '.mm-panel a:hover{color:#64FFDA;')
    if s != o:
        open(f, 'w', encoding='utf-8').write(s); changed += 1
print(f'site-wide pass: {changed} files')

# ---------------- index.html surgical ----------------
f = 'index.html'
s = open(f, encoding='utf-8').read()

# dead token: safety-orange -> warning
s = s.replace('bg-safety-orange/20', 'bg-warning/15')
s = s.replace('text-safety-orange', 'text-warning-700')
s = s.replace('bg-safety-orange', 'bg-warning')

# section rhythm
s = s.replace('<section class="py-20 bg-cloud">', '<section class="py-20 bg-white">')  # problem + roles
s = s.replace('<section id="pricing" class="py-20 bg-cloud">', '<section id="pricing" class="py-20 bg-white">')
s = s.replace('<section class="py-12 bg-gradient-to-b from-cloud to-white">', '<section class="py-12 bg-cloud border-y border-mist">')

# checklist band -> dark
s = s.replace('<section class="py-8 bg-gradient-to-r from-apex-500/10 to-apex-300 border-y border-apex-500/30">',
              '<section class="py-8 bg-ink border-y border-white/10">')
band = re.search(r'<section class="py-8 bg-ink[^>]*>.*?</section>', s, re.S)
if band:
    b = band.group(0)
    nb = b.replace('bg-apex-500/10 rounded-lg', 'bg-mint/10 rounded-lg')
    nb = nb.replace('text-apex-500', 'text-mint')
    nb = nb.replace('text-ink font-semibold', 'text-white font-semibold')
    nb = nb.replace('text-graphite text-sm', 'text-mist/80 text-sm')
    nb = nb.replace('bg-apex-500 hover:bg-apex-700 text-white', 'bg-mint hover:bg-mint-600 text-ink')
    s = s.replace(b, nb)

# founder quote -> dark
s = s.replace('<section class="py-16 bg-cloud relative overflow-hidden">',
              '<section class="py-16 bg-ink relative overflow-hidden">')
fq = re.search(r'<section class="py-16 bg-ink relative overflow-hidden">.*?</section>', s, re.S)
if fq:
    b = fq.group(0)
    nb = b.replace('text-apex-500 text-sm font-semibold uppercase', 'text-mint text-sm font-semibold uppercase')
    nb = nb.replace('blockquote class="text-xl md:text-2xl font-medium', 'blockquote class="text-white text-xl md:text-2xl font-medium')
    nb = nb.replace('gap-2 text-graphite', 'gap-2 text-mist/80')
    nb = nb.replace('font-semibold text-ink', 'font-semibold text-white')
    nb = nb.replace('to-apex-300 rounded-full flex items-center justify-center text-ink', 'to-apex-300 rounded-full flex items-center justify-center text-white')
    s = s.replace(b, nb)

# final CTA -> dark
s = s.replace('<section id="demo" class="py-20 bg-cloud">', '<section id="demo" class="py-20 bg-ink">')
cta = re.search(r'<section id="demo" class="py-20 bg-ink">.*?</section>', s, re.S)
if cta:
    b = cta.group(0)
    nb = b.replace('font-heading text-3xl sm:text-4xl font-bold mb-6', 'font-heading text-3xl sm:text-4xl font-bold mb-6 text-white')
    nb = nb.replace('<span class="text-apex-500">Smarter</span>', '<span class="text-mint">Smarter</span>')
    nb = nb.replace('text-xl text-slate mb-8', 'text-xl text-mist/85 mb-8')
    nb = nb.replace('bg-apex-500 hover:bg-apex-700 text-white', 'bg-mint hover:bg-mint-600 text-ink')
    nb = nb.replace('glass-light hover:bg-mist/40 text-ink', 'border border-white/25 hover:border-mint text-white hover:text-mint')
    nb = nb.replace('mt-4 text-graphite text-sm', 'mt-4 text-mist/70 text-sm')
    nb = nb.replace('gap-6 text-graphite text-sm', 'gap-6 text-mist/75 text-sm')
    s = s.replace(b, nb)

# glass system -> solid cards
CARD = 'background:#FFFFFF;border:1px solid #C9D6DD;box-shadow:0 1px 3px rgba(17,45,60,.08),0 8px 24px rgba(17,45,60,.05)'
s = re.sub(r'\.glass\s*\{[^}]*\}', '.glass{'+CARD+'}', s, flags=re.S)
s = re.sub(r'\.glass-cyan\s*\{[^}]*\}', '.glass-cyan{'+CARD+';border-color:#739D96}', s, flags=re.S)
s = re.sub(r'\.glass-card\s*\{[^}]*\}', '.glass-card{'+CARD+';position:relative;overflow:hidden}', s, flags=re.S)
s = re.sub(r'\.glass-card::before\s*\{[^}]*\}', '.glass-card::before{content:none}', s, flags=re.S)
s = re.sub(r'\.glass-card:hover::before\s*\{[^}]*\}', '.glass-card:hover::before{content:none}', s, flags=re.S)
s = re.sub(r'\.glass-light\s*\{[^}]*\}', '.glass-light{background:#FFFFFF;border:1px solid #C9D6DD;box-shadow:0 1px 3px rgba(17,45,60,.08)}', s, flags=re.S)
s = re.sub(r'\.glass-frosted\s*\{[^}]*\}', '.glass-frosted{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.14);box-shadow:0 8px 32px rgba(0,0,0,.25)}', s, flags=re.S)
s = re.sub(r'\.glass-hover:hover\s*\{[^}]*\}', '.glass-hover:hover{border-color:#739D96;box-shadow:0 4px 14px rgba(17,45,60,.14);transform:translateY(-2px)}', s, flags=re.S)
# trust badge: stronger border
s = s.replace('background:#FFFFFF;border:1px solid #D9E2E8;box-shadow:0 1px 3px rgba(17,45,60,.06)',
              'background:#FFFFFF;border:1px solid #C9D6DD;box-shadow:0 1px 3px rgba(17,45,60,.1)')
# industry tabs: solid base + solid active
s = s.replace('rounded-lg border border-mist text-slate font-medium', 'rounded-lg bg-white border border-mist text-slate font-medium')
s = re.sub(r'\.industry-tab\.active\s*\{[^}]*\}',
           '.industry-tab.active{background:#004D40;border-color:#004D40;color:#FFFFFF}', s, flags=re.S)
open(f, 'w', encoding='utf-8').write(s)
print('index surgical done')
