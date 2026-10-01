/* InvestigatePro site runtime (POC). No dependencies, no scroll listeners:
   IntersectionObserver, ResizeObserver, CSS scroll timelines and rAF only
   while something is visibly moving. */
(function () {
  'use strict';
  var d = document, html = d.documentElement, w = window;
  var KEY = 'ip-reduce-motion';
  var mq = w.matchMedia ? w.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false, addEventListener: function () {} };
  var listeners = [];

  function stored() { try { return w.localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function motion() { return !mq.matches && !stored(); }
  function applyMotion() {
    var on = motion();
    html.classList.toggle('motion-on', on);
    html.classList.toggle('motion-off', !on);
    listeners.forEach(function (fn) { try { fn(on); } catch (e) { /* keep going */ } });
  }
  function onMotion(fn) { listeners.push(fn); }
  if (mq.addEventListener) mq.addEventListener('change', applyMotion);

  var raf = w.requestAnimationFrame.bind(w);
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || d).querySelectorAll(s)); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(x) { return x * x * (3 - 2 * x); }
  function supports(q) { return !!(w.CSS && CSS.supports && CSS.supports(q)); }

  /* ---------- counters (tabular, eased) ---------- */
  function tick(el, to, dur) {
    if (!el) return;
    var from = parseFloat(el.getAttribute('data-v'));
    if (isNaN(from)) from = parseFloat(String(el.textContent).replace(/,/g, '')) || 0;
    el.setAttribute('data-v', to);
    var fmt = function (v) { return Math.round(v).toLocaleString('en-GB'); };
    if (from === to) { el.textContent = fmt(to); return; }
    if (!motion()) { el.textContent = fmt(to); return; }
    var t0 = performance.now(); dur = dur || 700;
    (function step(t) {
      var k = clamp01((t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (k < 1) raf(step);
    })(t0);
  }

  /* ---------- streamed text (mask wipe) ---------- */
  function stream(el) {
    if (!el || !motion()) return;
    el.classList.add('stream');
    el.classList.remove('is-streaming');
    void el.offsetWidth;
    el.classList.add('is-streaming');
  }

  /* ---------- nav: solid once the page moves ---------- */
  function initNav() {
    var nav = $('.nav'); if (!nav) return;
    var s = d.createElement('div');
    s.setAttribute('aria-hidden', 'true');
    s.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:12px;pointer-events:none';
    d.body.prepend(s);
    new IntersectionObserver(function (e) { nav.classList.toggle('is-solid', !e[0].isIntersecting); }).observe(s);

    $$('.nav__menu').forEach(function (m) {
      var btn = $('.nav__menu-btn', m);
      function set(open) { m.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
      btn.addEventListener('click', function () { set(!m.classList.contains('is-open')); });
      m.addEventListener('keydown', function (e) { if (e.key === 'Escape') { set(false); btn.focus(); } });
      d.addEventListener('click', function (e) { if (!m.contains(e.target)) set(false); });
      m.addEventListener('focusout', function (e) { if (!m.contains(e.relatedTarget)) set(false); });
    });

    var burger = $('.nav__burger'), menu = $('#mmenu');
    if (burger && menu) {
      var close = $('.mmenu__close', menu);
      var open = function () {
        menu.hidden = false; d.body.classList.add('menu-open'); burger.setAttribute('aria-expanded', 'true');
        var first = $('a, button', menu); if (first) first.focus();
      };
      var shut = function () {
        menu.hidden = true; d.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); burger.focus();
      };
      burger.addEventListener('click', open);
      if (close) close.addEventListener('click', shut);
      menu.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') shut();
        if (e.key === 'Tab') {
          var f = $$('a[href], button:not([disabled])', menu); if (!f.length) return;
          var a = f[0], z = f[f.length - 1];
          if (e.shiftKey && d.activeElement === a) { e.preventDefault(); z.focus(); }
          else if (!e.shiftKey && d.activeElement === z) { e.preventDefault(); a.focus(); }
        }
      });
      $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { menu.hidden = true; d.body.classList.remove('menu-open'); }); });
    }
  }

  /* ---------- footer: reduce-motion control (persisted, live both ways) ---------- */
  function initMotionToggle() {
    $$('.motion-toggle').forEach(function (b) {
      var sync = function () { b.setAttribute('aria-pressed', stored() || mq.matches ? 'true' : 'false'); };
      sync();
      b.addEventListener('click', function () {
        var next = !stored();
        try { next ? w.localStorage.setItem(KEY, '1') : w.localStorage.removeItem(KEY); } catch (e) {}
        applyMotion(); sync();
      });
      onMotion(sync);
    });
  }

  /* ---------- seeded field ---------- */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ==========================================================================
     HERO: evidence (PEEPO) converges into the four ICAM levels of the case
     ========================================================================== */
  function initHero() {
    var hero = $('.hero[data-case]'); if (!hero) return;
    var canvas = $('.hero__field', hero), labelBox = $('.hero__labels', hero);
    var frame = $('#case-frame', hero);
    var cols = $$('[data-col]', hero);
    var cards = $$('[data-at]', hero);
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, nodes = [], labels = [], visible = true, running = false, p = 0, shownP = -1;
    var seqStarted = false, fallbackStart = 0, restStart = 0;
    var scrubbed = supports('animation-timeline: scroll()');
    var PEEPO = ['People', 'Environment', 'Equipment', 'Procedures', 'Organisation'];
    var SEEDS = [[.58, .20], [.86, .14], [.72, .36], [.93, .40], [.63, .52]];

    function count() { var vw = w.innerWidth; return vw < 480 ? 16 : vw < 768 ? 24 : 46; }

    function build() {
      var rng = mulberry32(20260418), n = count(), out = [];
      for (var i = 0; i < n; i++) {
        var s = i % 5, seed = SEEDS[s];
        var ang = rng() * Math.PI * 2, rad = .02 + rng() * .11;
        out.push({
          s: s,
          fx: seed[0] + Math.cos(ang) * rad * 1.3,
          fy: seed[1] + Math.sin(ang) * rad,
          col: [3, 0, 1, 2, 1, 3, 0, 1][i % 8],      /* evidence mapped to a level */
          jx: rng() - .5, jy: rng() - .5,
          ph: rng() * Math.PI * 2, sp: .4 + rng() * .8,
          r: 1.5 + rng() * 1.8, blue: i % 4 === 1, ctl: .2 + rng() * .6
        });
      }
      return out;
    }

    function layout() {
      var hr = hero.getBoundingClientRect();
      dpr = Math.min(2, w.devicePixelRatio || 1);
      W = hr.width; H = hr.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      var ft = frame.getBoundingClientRect().top - hr.top;
      var fieldH = Math.max(160, ft - 16);
      /* on narrow screens the field keeps off the text: it lives in the band
         between the sample-report link and the case frame */
      var asideEl = $('.hero__aside', hero);
      var bandTop = asideEl ? asideEl.getBoundingClientRect().bottom - hr.top + 16 : fieldH * .6;
      var bandH = Math.max(40, ft - 12 - bandTop);
      var ab = asideEl ? asideEl.getBoundingClientRect() : null;
      var asideBox = ab ? { l: ab.left - hr.left - 32, t: ab.top - hr.top - 26, b: ab.bottom - hr.top + 18 } : null;
      var cp = $('.hero__copy', hero), cb = cp ? cp.getBoundingClientRect() : null;
      var copyBox = cb ? { r: cb.left - hr.left + Math.min(cb.width, 700) + 36, t: cb.top - hr.top - 24, b: cb.bottom - hr.top + 24 } : null;
      if (!nodes.length || nodes.length !== count()) nodes = build();
      var targets = cols.map(function (c) {
        var b = c.getBoundingClientRect();
        return { x: b.left - hr.left + b.width / 2, y: b.top - hr.top + Math.min(90, b.height / 2), w: b.width, h: Math.min(120, b.height) };
      });
      var narrow = W < 860;
      nodes.forEach(function (nd) {
        var fx = narrow ? .1 + (nd.fx - .5) * 1.6 : nd.fx;
        nd.x0 = Math.max(12, Math.min(W - 12, fx * W));
        nd.y0 = narrow ? bandTop + clamp01(nd.fy / .68) * bandH : Math.max(12, Math.min(fieldH - 8, nd.fy * fieldH * 1.55));
        /* keep the field clear of the sample-report link */
        if (!narrow && asideBox && nd.x0 > asideBox.l && nd.y0 > asideBox.t && nd.y0 < asideBox.b) nd.y0 = asideBox.t - 8 - Math.abs(nd.jy) * 70;
        /* and off the headline, lede and buttons */
        if (!narrow && copyBox && nd.x0 < copyBox.r && nd.y0 > copyBox.t && nd.y0 < copyBox.b) nd.x0 = Math.min(W - 16, copyBox.r + Math.abs(nd.jx) * 120);
        var t = targets[nd.col] || targets[0];
        nd.x1 = t.x + nd.jx * t.w * .5; nd.y1 = t.y + nd.jy * t.h * .5;
      });
      labels = PEEPO.map(function (name, i) {
        var s = SEEDS[i];
        return { name: name, x: (narrow ? .1 + (s[0] - .5) * 1.6 : s[0]) * W, y: narrow ? bandTop + clamp01(s[1] / .68) * bandH - 18 : Math.min(fieldH - 20, s[1] * fieldH * 1.55) - 18 };
      });
      renderLabels();
      if (scrubbed) {
        var end = Math.max(220, (frame.getBoundingClientRect().top + w.scrollY) - 120);
        hero.style.animationRange = '0px ' + Math.round(end) + 'px';
      }
    }

    function renderLabels() {
      if (!labelBox) return;
      labelBox.innerHTML = '';
      if (W < 560) return;
      labels.forEach(function (l) {
        var s = d.createElement('span'); s.textContent = l.name;
        s.style.left = Math.round(l.x) + 'px'; s.style.top = Math.round(l.y) + 'px';
        s.style.transform = 'translateX(-50%)';
        labelBox.appendChild(s);
      });
    }

    function draw(t, prog, mul) {
      if (mul == null) mul = 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var e = ease(prog), drift = 1 - e, pts = [];
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var k = clamp01((prog - n.ctl * .35) / (1 - n.ctl * .35)); k = ease(k);
        var cx = (n.x0 + n.x1) / 2 + (n.jx * 120), cy = n.y0 + (n.y1 - n.y0) * .15;
        var x = (1 - k) * (1 - k) * n.x0 + 2 * (1 - k) * k * cx + k * k * n.x1;
        var y = (1 - k) * (1 - k) * n.y0 + 2 * (1 - k) * k * cy + k * k * n.y1;
        x += Math.sin(t * .0006 * n.sp + n.ph) * 6 * drift;
        y += Math.cos(t * .0005 * n.sp + n.ph) * 5 * drift;
        var a = (1 - Math.max(0, (k - .82) / .18)) * (n.x0 < W * .45 && W >= 860 ? .45 : 1) * mul;
        pts.push([x, y, a, n]);
      }
      /* links: evidence that sits close together */
      ctx.lineWidth = 1;
      for (var a1 = 0; a1 < pts.length; a1++) {
        for (var b1 = a1 + 1; b1 < pts.length; b1++) {
          var dx = pts[a1][0] - pts[b1][0], dy = pts[a1][1] - pts[b1][1], dd = dx * dx + dy * dy;
          if (dd < 19600) {
            var al = (1 - Math.sqrt(dd) / 140) * .26 * Math.min(pts[a1][2], pts[b1][2]) * (1 - e * .6);
            if (al > .01) { ctx.strokeStyle = 'rgba(100,255,218,' + al.toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(pts[a1][0], pts[a1][1]); ctx.lineTo(pts[b1][0], pts[b1][1]); ctx.stroke(); }
          }
        }
      }
      for (var j = 0; j < pts.length; j++) {
        var q = pts[j]; if (q[2] <= .01) continue;
        ctx.fillStyle = q[3].blue ? 'rgba(133,197,248,' + (.9 * q[2]).toFixed(3) + ')' : 'rgba(100,255,218,' + (.78 * q[2]).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(q[0], q[1], q[3].r * (1 - e * .25), 0, 6.2832); ctx.fill();
      }
      if (labelBox) labelBox.style.opacity = ((1 - clamp01(prog * 2.2)) * mul).toFixed(3);
    }

    function setCards(prog) {
      cards.forEach(function (c) {
        var at = parseFloat(c.getAttribute('data-at'));
        var st = prog < at - .16 ? 'hidden' : prog < at ? 'ghost' : 'landed';
        if (c.getAttribute('data-state') !== st) c.setAttribute('data-state', st);
      });
      $$('[data-count-for]', hero).forEach(function (el) {
        var col = el.getAttribute('data-count-for');
        var n = $$('[data-col="' + col + '"] [data-at][data-state="landed"], [data-col="' + col + '"] .factor[data-accepted="true"]', hero).length;
        var txt = n + ' factor(s)'; if (el.textContent !== txt) el.textContent = txt;
      });
    }

    /* the evidence lands on its own a moment after load; scrolling toward the
       frame only brings the landing forward, it never holds the story back */
    function readP(now) {
      if (!motion()) return 1;
      if (!fallbackStart) fallbackStart = now + 1100;
      var auto = clamp01((now - fallbackStart) / 2600);
      if (scrubbed) { var v = parseFloat(getComputedStyle(hero).getPropertyValue('--hp')); return Math.max(isNaN(v) ? 0 : v, auto); }
      return auto;
    }

    function loop(now) {
      if (!running) return;
      p = readP(now);
      /* once the evidence has landed, the field re-forms at rest: the constellation stays */
      if (restStart && now >= restStart) draw(now, 0, ease(clamp01((now - restStart) / 1600)));
      else draw(now, p);
      if (Math.abs(p - shownP) > .002) { setCards(p); shownP = p; }
      if (p > .97 && !seqStarted) { seqStarted = true; restStart = now + 900; coach(); }
      raf(loop);
    }
    function start() { if (running || !visible || !motion()) return; running = true; raf(loop); }
    function stop() { running = false; }

    function staticFrame() {
      stop();
      draw(0, 0);                              /* the evidence field, still */
      cards.forEach(function (c) { c.setAttribute('data-state', 'landed'); });
      acceptNow();
    }

    /* ---- the coach at work: flag, suggest, accept ---- */
    var token = 0;
    var orgCol = $('[data-col="org"]', hero);
    var orgFactor = $('.factor[data-accepted]', hero);
    var orgZone = $('[data-col="org"] .dropzone', hero);
    var sugg = $('.suggest', hero), bar = $('.suggest .bar > i', hero);
    var sBtn = $('.app-btn--suggest', hero), addBtn = $('.suggest__add', hero);
    var sStatus = $('[data-suggest-status]', hero), sCount = $('[data-suggest-count]', hero), sCard = $('.suggest__card', hero);
    var replay = $('.replay', hero);

    function resetCoach() {
      token++;
      frame.classList.remove('is-coaching', 'is-zoomed');
      if (sugg) { sugg.classList.remove('is-open', 'is-done'); }
      if (sCard) sCard.hidden = true;
      if (bar) bar.parentNode.style.setProperty('--p', 0), bar.style.setProperty('--p', 0);
      if (orgFactor) { orgFactor.setAttribute('data-accepted', 'false'); orgFactor.hidden = true; orgFactor.classList.remove('is-new'); }
      if (orgZone) orgZone.hidden = false;
      if (orgCol) orgCol.classList.remove('is-flagged');
      if (replay) replay.classList.remove('is-ready');
      setCards(p);
    }
    function acceptNow() {
      token++;
      frame.classList.remove('is-coaching', 'is-zoomed');
      if (sugg) sugg.classList.remove('is-open');
      if (orgFactor) { orgFactor.hidden = false; orgFactor.setAttribute('data-accepted', 'true'); orgFactor.setAttribute('data-state', 'landed'); }
      if (orgZone) orgZone.hidden = true;
      if (orgCol) orgCol.classList.remove('is-flagged');
      setCards(1);
      if (replay && motion()) replay.classList.add('is-ready');
    }
    /* camera: push in until the suggestion fills the screen, then pull back */
    function zoomTo(els) {
      var sc = $('.frame__screen', frame).getBoundingClientRect(), r = null;
      els.forEach(function (el) { var b = el.getBoundingClientRect(); r = r ? { left: Math.min(r.left, b.left), top: Math.min(r.top, b.top), right: Math.max(r.right, b.right), bottom: Math.max(r.bottom, b.bottom) } : { left: b.left, top: b.top, right: b.right, bottom: b.bottom }; });
      if (!sc.width || !r) return;
      r.width = r.right - r.left; r.height = r.bottom - r.top;
      var cx = r.left - sc.left + r.width / 2, cy = r.top - sc.top + r.height / 2;
      /* size by what lands on screen: the factor sentence should read at display size (about 42px) */
      var fs = parseFloat(getComputedStyle($('.suggest__text', frame)).fontSize) || 14;
      var fit = Math.min(sc.width * .96 / r.width, sc.height * .8 / r.height);
      var s = Math.max(1.08, Math.min(3.6, Math.max(fit, Math.min(42 / fs, sc.width * .99 / r.width))));
      var tx = Math.min(0, Math.max(sc.width - s * sc.width, sc.width / 2 - s * cx));
      var ty = Math.min(0, Math.max(sc.height - s * sc.height, sc.height * .46 - s * cy));
      frame.style.setProperty('--zoom', 'translate(' + tx.toFixed(1) + 'px, ' + ty.toFixed(1) + 'px) scale(' + s.toFixed(3) + ')');
      frame.classList.add('is-zoomed');
    }
    async function coach() {
      resetCoach();
      var my = token, alive = function () { return my === token; };
      await sleep(250); if (!alive()) return;
      frame.classList.add('is-coaching');
      orgCol.classList.add('is-flagged');
      await sleep(900); if (!alive()) return;
      sBtn.classList.add('is-pressed'); await sleep(240); sBtn.classList.remove('is-pressed');
      sugg.classList.add('is-open');
      sStatus.textContent = 'Analysing the full investigation…';
      sCount.textContent = '0 factors · 0 gaps';
      bar.style.setProperty('--p', .18);
      await sleep(900); if (!alive()) return;
      bar.style.setProperty('--p', .52);
      await sleep(700); if (!alive()) return;
      sCard.hidden = false;
      zoomTo([$('.suggest__meta', sCard), $('.suggest__text', sCard), addBtn]);
      stream($('.suggest__text', sCard)); stream($('.suggest__why', sCard));
      sCount.textContent = '1 factor · 0 gaps';
      await sleep(1700); if (!alive()) return;
      bar.style.setProperty('--p', 1); sugg.classList.add('is-done');
      sStatus.textContent = 'Analysis complete. Nothing is added until you accept it.';
      await sleep(1800); if (!alive()) return;
      addBtn.classList.add('is-pressed'); await sleep(380); addBtn.classList.remove('is-pressed');
      frame.classList.remove('is-zoomed');
      await sleep(620); if (!alive()) return;
      sugg.classList.remove('is-open');
      await sleep(380); if (!alive()) return;
      orgZone.hidden = true; orgFactor.hidden = false; orgFactor.setAttribute('data-state', 'landed');
      orgFactor.setAttribute('data-accepted', 'true'); orgFactor.classList.add('is-new'); orgCol.classList.remove('is-flagged');
      setCards(1);
      await sleep(1400); if (!alive()) return;
      frame.classList.remove('is-coaching'); orgFactor.classList.remove('is-new');
      replay.classList.add('is-ready');
    }
    if (replay) replay.addEventListener('click', function () { if (motion()) coach(); });

    /* visibility: stop drawing when the hero is off screen or the tab is hidden */
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; visible ? start() : stop(); }, { rootMargin: '120px 0px' }).observe(hero);
    d.addEventListener('visibilitychange', function () { if (d.hidden) { stop(); if (seqStarted) acceptNow(); } else start(); });
    var ro = new ResizeObserver(function () { layout(); if (!motion()) staticFrame(); else shownP = -1; });
    ro.observe(hero);

    if (scrubbed) hero.classList.add('is-scrubbed');
    layout(); resetCoach();
    if (motion()) start(); else staticFrame();
    onMotion(function (on) { if (on) { resetCoach(); seqStarted = false; fallbackStart = 0; restStart = 0; shownP = -1; start(); } else staticFrame(); });
    w.addEventListener('beforeprint', staticFrame);
  }

  /* ==========================================================================
     THE COACH AT WORK: a pinned narrator follows the canvas in focus
     ========================================================================== */
  function initNarrator() {
    var root = $('[data-narrator]'); if (!root) return;
    var grid = $('.narr__grid', root), beats = $$('.beat', root), panel = $('.panel', root);
    if (!panel || !beats.length) return;
    grid.classList.add('is-narrated');
    var counts = $$('[data-count]', panel), bars = $$('.pcov__bar i', panel), rows = $$('.pcov__row', panel);
    var kind = $('.feed__kind', panel), msg = $('.feed__msg', panel), reply = $('.feed__reply', panel), reading = $('.reading', panel);
    var active = -1, tok = 0;

    async function render(i) {
      var beat = beats[i], card = $('.coach-card', beat); if (!card) return;
      var my = ++tok;
      if (beat.hasAttribute('data-counts')) {
        var c = beat.getAttribute('data-counts').split(',');
        counts.forEach(function (el, k) { tick(el, +c[k] || 0); });
      }
      var v = (beat.getAttribute('data-cov') || '').split(',');
      bars.forEach(function (b, k) { b.style.setProperty('--v', v[k] || 0); });
      var flag = beat.getAttribute('data-flag');
      rows.forEach(function (r) { r.classList.toggle('is-flag', r.getAttribute('data-level') === flag); });
      $$('[data-step]', panel).forEach(function (el, k) { el.classList.toggle('is-active', k === i); el.classList.toggle('is-done', k < i); });
      panel.classList.add('is-coaching');
      var ck = $('.feed__kind', card); kind.innerHTML = ck.innerHTML; kind.className = ck.className;
      msg.hidden = true; reply.hidden = true;
      if (reading) reading.hidden = false;
      await sleep(motion() ? 520 : 0); if (my !== tok) return;
      if (reading) reading.hidden = true;
      msg.innerHTML = $('.feed__msg', card).innerHTML; msg.hidden = false; stream(msg);
      await sleep(motion() ? 900 : 0); if (my !== tok) return;
      reply.innerHTML = $('.feed__reply', card).innerHTML; reply.hidden = false;
      if (motion()) { reply.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' }); }
      await sleep(motion() ? 700 : 0); if (my !== tok) return;
      panel.classList.remove('is-coaching');
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = beats.indexOf(e.target);
        if (i !== active) { active = i; render(i); }
      });
    }, { rootMargin: '-46% 0px -46% 0px' });
    beats.forEach(function (b) { io.observe(b); });
    render(0); active = 0;
  }

  /* ---------- bento: each cell plays once when it arrives ---------- */
  function initCells() {
    var cells = $$('[data-cell]'); if (!cells.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var c = e.target; c.classList.add('is-in'); io.unobserve(c);
        $$('[data-to]', c).forEach(function (el) { tick(el, +el.getAttribute('data-to'), 900); });
      });
    }, { threshold: .35 });
    cells.forEach(function (c) {
      if (!motion()) { c.classList.add('is-in'); return; }
      $$('[data-to]', c).forEach(function (el) { el.setAttribute('data-v', el.getAttribute('data-from') || 0); el.textContent = el.getAttribute('data-from') || 0; });
      io.observe(c);
    });
    onMotion(function (on) { if (!on) cells.forEach(function (c) { c.classList.add('is-in'); $$('[data-to]', c).forEach(function (el) { el.textContent = el.getAttribute('data-to'); }); }); });
    w.addEventListener('beforeprint', function () { cells.forEach(function (c) { c.classList.add('is-in'); }); });
  }

  /* ---------- closing prompt: typewriter + example questions ---------- */
  var QS = {
    isolation: ['Which lock points were verified, by whom, and where is that recorded?', 'At what point did the worker believe the equipment was dead, and what told them so?', 'Has the same isolation step appeared in earlier events on this line?'],
    vehicle: ['Where were the traffic-management controls at the moment of contact, and were they in use?', 'What could each operator see from their seat at that point?', 'Which defences separate light vehicles from haul trucks on this route, and which were absent?'],
    height: ['What was the anchor point, and who last inspected it?', 'How was the task planned, and where did the work as done depart from the plan?', 'Which organisational factors set the conditions for working at height on this shift?'],
    dropped: ['What was the exclusion zone, and who controlled it at the time?', 'What secured the object, and when was that last checked?', 'Have there been earlier dropped-object events at this location?'],
    general: ['What evidence should exist by now that is not yet in the case?', 'Which witness saw the conditions just before the event, and what would open them up?', 'Which ICAM level is still empty, and what would fill it?']
  };
  function classify(t) {
    t = (t || '').toLowerCase();
    if (/isolat|lock|guard|energ|pulley|conveyor|loto|drive/.test(t)) return 'isolation';
    if (/truck|vehicle|revers|haul|forklift|ute|collision/.test(t)) return 'vehicle';
    if (/fell|fall|height|scaffold|ladder|harness|edge/.test(t)) return 'height';
    if (/drop|dropped|rod|load|crane|struck/.test(t)) return 'dropped';
    return 'general';
  }
  function initPrompt() {
    var box = $('[data-prompt]'); if (!box) return;
    var ta = $('textarea', box), out = $('.prompt__out ol', box), chips = $$('.prompt__chips button', box), frame = box.closest('.frame');
    var hint = $('.prompt__hint', box);
    var EX = [
      'Fitter’s hand caught at a tail pulley during clean-up; the guard was off after a belt change on the previous shift.',
      'Haul truck reversed into a light vehicle at the crusher pad during shift change.',
      'Contractor fell 2.4 m from a mobile scaffold while fitting pipe supports.',
      'Drill rod dropped from the mast while a crew member was inside the exclusion zone.'
    ];
    var KINDS = ['isolation', 'vehicle', 'height', 'dropped'];
    var typing = false, stopType = false, inView = false, atok = 0;
    var halted = function () { return stopType || !inView || !!ta.value; };
    /* the demo types an incident, then the coach's first questions for it stream in */
    async function typeLoop() {
      if (typing) return; typing = true;
      var i = 1;                                  /* the page opens on example one, already answered */
      await sleep(2600);
      while (!halted() && motion()) {
        var s = EX[i % EX.length];
        for (var c2 = ta.getAttribute('placeholder').length; c2 >= 0; c2 -= 3) { if (halted()) break; ta.setAttribute('placeholder', ta.getAttribute('placeholder').slice(0, c2)); await sleep(12); }
        for (var c = 1; c <= s.length; c++) { if (halted()) break; ta.setAttribute('placeholder', s.slice(0, c)); await sleep(30); }
        if (halted()) break;
        await answer(KINDS[i % KINDS.length], true);
        await sleep(3200);
        i++;
      }
      if (!ta.value && stopType) ta.setAttribute('placeholder', EX[0]);
      typing = false;
    }
    new IntersectionObserver(function (e) { inView = e[0].isIntersecting; if (inView && !stopType) typeLoop(); }, { threshold: .3 }).observe(box);
    ta.addEventListener('focus', function () { stopType = true; ta.setAttribute('placeholder', EX[0]); });

    async function answer(key, auto) {
      var my = ++atok;
      if (!auto) chips.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-kind') === key ? 'true' : 'false'); });
      out.innerHTML = '';
      if (frame) frame.classList.add('is-coaching');
      var qs = QS[key] || QS.general;
      for (var i = 0; i < qs.length; i++) {
        if (my !== atok) return;
        var li = d.createElement('li'); li.textContent = qs[i]; out.appendChild(li); stream(li);
        await sleep(motion() ? 520 : 0);
      }
      if (my !== atok) return;
      if (hint) hint.hidden = false;
      await sleep(motion() ? 900 : 0);
      if (frame && my === atok) frame.classList.remove('is-coaching');
    }
    chips.forEach(function (b) { b.addEventListener('click', function () { stopType = true; ta.value = ''; ta.setAttribute('placeholder', EX[['isolation', 'vehicle', 'height', 'dropped'].indexOf(b.getAttribute('data-kind'))] || EX[0]); answer(b.getAttribute('data-kind')); }); });
    box.addEventListener('submit', function (e) { e.preventDefault(); stopType = true; answer(classify(ta.value || ta.getAttribute('placeholder'))); });
  }

  /* ---------- forms: validate, confirm; the prototype sends nothing ---------- */
  /* ---------- capture forms: post to the leads endpoint the build was given.
     Without one (this prototype) the form says plainly that nothing was sent. ---------- */
  /* ---------- capture forms ----------
     The payload matches the live site's forms field for field, so lead routing does not change:
     { source, ...every named field that has a value }, plus timestamp where the live form sent one.
     data-gate="id" also unlocks a tool section after the send, whatever the result, as the live tools did.
     With no endpoint (a review build) nothing is sent, and the form says so. */
  function initForms() {
    $$('form[data-capture]').forEach(function (f) {
      var ep = f.getAttribute('data-endpoint') || '';
      var m = $('.form__msg', f), b = $('button[type="submit"]', f), label = b ? b.innerHTML : '';
      var gate = f.getAttribute('data-gate');
      function say(kind) {
        if (!m) return;
        $('span', m).textContent = m.getAttribute('data-' + kind) || '';
        m.setAttribute('data-kind', kind); m.hidden = false; m.setAttribute('tabindex', '-1'); m.focus();
      }
      function unlock() {
        if (!gate) return;
        var sec = d.getElementById(gate); if (!sec) return;
        sec.hidden = false;
        f.setAttribute('data-unlocked', '');
        var h = $('h2, h3', sec); if (h) { h.setAttribute('tabindex', '-1'); setTimeout(function () { h.focus({ preventScroll: true }); sec.scrollIntoView({ behavior: motion() ? 'smooth' : 'auto', block: 'start' }); }, 250); }
        d.dispatchEvent(new CustomEvent('ip:unlock', { detail: { id: gate } }));
      }
      f.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!f.checkValidity()) { f.reportValidity(); return; }
        if (!ep) { say('proto'); unlock(); return; }
        var data = { source: f.getAttribute('data-source') || 'site' };
        new FormData(f).forEach(function (v, k) { v = String(v).trim(); if (v) data[k] = v; });
        if (f.hasAttribute('data-timestamp')) data.timestamp = new Date().toISOString();
        if (b) { b.disabled = true; b.textContent = 'Sending…'; }
        try {
          var r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          if (!r.ok) throw new Error('HTTP ' + r.status);
          say('ok'); if (b) b.textContent = gate ? 'Unlocked' : 'Sent';
        } catch (err) {
          say('err'); if (b) { b.disabled = false; b.innerHTML = label; }
        }
        unlock();
      });
    });
  }

  /* ---------- pricing: monthly / annual ---------- */
  function initPricing() {
    var sw = $('[data-billing]'); if (!sw) return;
    var btns = $$('button', sw);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var annual = b.getAttribute('data-period') === 'annual';
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        $$('[data-monthly]').forEach(function (el) {
          var to = annual ? Math.round(+el.getAttribute('data-monthly') * .85) : +el.getAttribute('data-monthly');
          tick(el, to, 500);
        });
        $$('[data-period-label]').forEach(function (el) { el.textContent = annual ? '/month, billed yearly' : '/month'; });
      });
    });
  }

  /* ---------- checklist tool: progress follows the ticks ---------- */
  function initChecklist() {
    var list = $('[data-checklist]'); if (!list) return;
    var boxes = $$('input[type="checkbox"]', list), meter = $('[data-check-meter]'), num = $('[data-check-count]');
    var KEYC = 'ip-checklist-v1';
    try { var saved = JSON.parse(w.localStorage.getItem(KEYC) || '[]'); boxes.forEach(function (b, i) { b.checked = saved.indexOf(i) > -1; }); } catch (e) {}
    function upd() {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      if (num) tick(num, n, 300);
      if (meter) meter.style.setProperty('--v', (n / boxes.length).toFixed(3));
      $$('[data-group]', list).forEach(function (g) {
        var bs = $$('input', g), k = bs.filter(function (b) { return b.checked; }).length, out = $('[data-group-count]', g);
        if (out) out.textContent = k + ' of ' + bs.length;
      });
      try { w.localStorage.setItem(KEYC, JSON.stringify(boxes.map(function (b, i) { return b.checked ? i : -1; }).filter(function (i) { return i > -1; }))); } catch (e) {}
    }
    boxes.forEach(function (b) { b.addEventListener('change', upd); });
    var reset = $('[data-check-reset]'); if (reset) reset.addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); upd(); });
    upd();
  }

  /* ---------- article: contents follow the reader ---------- */
  function initToc() {
    var toc = $('[data-toc]'); if (!toc) return;
    var links = $$('a[href^="#"]', toc), map = {};
    links.forEach(function (a) { var t = d.getElementById(a.getAttribute('href').slice(1)); if (t) map[t.id] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && map[e.target.id]) { links.forEach(function (a) { a.removeAttribute('aria-current'); }); map[e.target.id].setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(d.getElementById(id)); });
    var bar = $('.readbar i');
    if (bar && !supports('animation-timeline: scroll()')) bar.parentNode.hidden = true;
  }

  /* ---------- blog: filter by topic ---------- */
  function initFilter() {
    var f = $('[data-filter]'); if (!f) return;
    var btns = $$('button', f), items = $$('[data-topic]');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var t = b.getAttribute('data-t');
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        var shown = 0;
        items.forEach(function (it) { var ok = t === 'all' || it.getAttribute('data-topic').split(' ').indexOf(t) > -1; it.hidden = !ok; if (ok) shown++; });
        var c = $('[data-filter-count]'); if (c) c.textContent = shown;
      });
    });
  }

  /* ---------- copy buttons ---------- */
  function initCopy() {
    $$('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var txt = b.getAttribute('data-copy'), label = b.querySelector('span') || b, old = label.textContent;
        var say = function (t) { label.textContent = t; setTimeout(function () { label.textContent = old; }, 2200); };
        /* if the browser refuses the clipboard, select the address so it can be copied by hand */
        var fallback = function () { label.textContent = old; var r = d.createRange(); r.selectNodeContents(label); var sel = w.getSelection(); sel.removeAllRanges(); sel.addRange(r); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(function () { say('Copied'); }, fallback);
        else fallback();
      });
    });
  }

  /* ---------- worksheets: rows, prompt chips, clear, print, the PEEPO summary ----------
     Everything a tool page does happens in the browser; nothing is stored or sent. */
  function initSheets() {
    var sheets = $$('[data-sheet]');
    if (!sheets.length) return;
    var initial = new Map();
    $$('[data-rows]').forEach(function (list) { initial.set(list, list.innerHTML); });

    function renumber(list) { $$('[data-n]', list).forEach(function (b, i) { b.textContent = i + 1; }); }
    function addRow(list, text) {
      var tpl = list.id ? d.getElementById(list.id + '-tpl') : null;   /* each list's row lives in <template id="list-tpl"> */
      if (!tpl) return null;
      var node = tpl.content.firstElementChild.cloneNode(true);
      list.appendChild(node);
      renumber(list);
      var f = $('input, textarea', node);
      if (f && text != null) f.value = text;
      return f;
    }
    d.addEventListener('click', function (e) {
      var add = e.target.closest('[data-add]');
      if (add) { var l = d.getElementById(add.getAttribute('data-add')); var f = l && addRow(l); if (f) f.focus(); return; }
      var rm = e.target.closest('[data-remove]');
      if (rm) {
        var row = rm.closest('[data-row]'), list = row && row.parentNode;
        if (row) { row.remove(); if (list) renumber(list); }
        return;
      }
      var chip = e.target.closest('[data-chip]');
      if (chip && chip.getAttribute('aria-pressed') !== 'true') {
        var target = d.getElementById(chip.getAttribute('data-chip'));
        if (target) {
          /* fill the first empty row if there is one, otherwise add a row */
          var empty = $$('[data-row] textarea, [data-row] input', target).filter(function (x) { return !x.value.trim(); })[0];
          if (empty) empty.value = chip.getAttribute('data-text'); else addRow(target, chip.getAttribute('data-text'));
          chip.setAttribute('aria-pressed', 'true');
        }
        return;
      }
      var pr = e.target.closest('[data-print]');
      if (pr) { try { w.print(); } catch (x) { /* a frame without print */ } return; }
      var cl = e.target.closest('[data-clear]');
      if (cl) {
        /* two steps, no confirm dialog: the first press arms it, the second clears */
        if (!cl.hasAttribute('data-armed')) {
          cl.setAttribute('data-armed', ''); cl.setAttribute('data-label', cl.innerHTML);
          cl.textContent = 'Press again to clear everything';
          setTimeout(function () { if (cl.hasAttribute('data-armed')) { cl.removeAttribute('data-armed'); cl.innerHTML = cl.getAttribute('data-label'); } }, 4000);
          return;
        }
        cl.removeAttribute('data-armed'); cl.innerHTML = cl.getAttribute('data-label');
        var sh = d.getElementById(cl.getAttribute('data-clear'));
        if (!sh) return;
        $$('[data-rows]', sh).forEach(function (list) { if (initial.has(list)) { list.innerHTML = initial.get(list); renumber(list); } });
        $$('input, textarea, select', sh).forEach(function (x) {
          if (x.type === 'radio' || x.type === 'checkbox') x.checked = false;
          else if (x.tagName === 'SELECT') x.selectedIndex = 0;
          else x.value = '';
        });
        $$('[data-chip]', sh).forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        $$('[data-summary-out]', sh).forEach(function (o) { o.hidden = true; });
        return;
      }
      var sum = e.target.closest('[data-summarise]');
      if (sum) { summarise(d.getElementById(sum.getAttribute('data-summarise'))); }
    });

    /* PEEPO: count and list the factors per element, from the entries, as text (never as markup) */
    function summarise(sh) {
      if (!sh) return;
      var out = $('[data-summary-out]', sh); if (!out) return;
      var cats = $$('[data-cat]', sh), total = 0, counts = $('.summary__counts', out), lists = $('.summary__cats', out);
      counts.innerHTML = ''; lists.innerHTML = '';
      var rows = cats.map(function (c) {
        var items = $$('textarea, input', c).map(function (x) { return x.value.trim(); }).filter(Boolean);
        total += items.length;
        return { name: c.getAttribute('data-cat'), items: items };
      });
      function count(n, label) { var dv = d.createElement('div'), b = d.createElement('b'), sp = d.createElement('span'); b.textContent = n; sp.textContent = label; dv.appendChild(b); dv.appendChild(sp); counts.appendChild(dv); }
      count(total, 'Factors in total');
      rows.forEach(function (r) { count(r.items.length, r.name); });
      rows.forEach(function (r) {
        var s = d.createElement('section'), h = d.createElement('h3'), ul = d.createElement('ul');
        h.textContent = r.name;
        if (r.items.length) r.items.forEach(function (t) { var li = d.createElement('li'); li.textContent = t; ul.appendChild(li); });
        else { var li = d.createElement('li'); li.className = 'empty'; li.textContent = 'No factors recorded'; ul.appendChild(li); }
        s.appendChild(h); s.appendChild(ul); lists.appendChild(s);
      });
      var meta = $('.summary__meta', out);
      if (meta) {
        meta.textContent = '';
        var t = d.createElement('strong'); t.textContent = ($('[data-meta="title"]', sh) || {}).value || 'Untitled incident'; meta.appendChild(t);
        var bits = ['date', 'location', 'investigator'].map(function (k) { var el = $('[data-meta="' + k + '"]', sh); return el && el.value ? (k === 'investigator' ? 'Investigator: ' : '') + el.value : ''; }).filter(Boolean);
        meta.appendChild(d.createTextNode(bits.join(' · ')));
      }
      out.hidden = false;
      out.scrollIntoView({ behavior: motion() ? 'smooth' : 'auto', block: 'start' });
    }

    /* on unlock: today's date and the gate's name, where the sheet asks for them */
    d.addEventListener('ip:unlock', function () {
      var today = new Date().toISOString().slice(0, 10);
      $$('[data-today]').forEach(function (x) { if (!x.value) x.value = today; });
      $$('[data-from]').forEach(function (x) { var src = d.getElementById(x.getAttribute('data-from')); if (src && !x.value) x.value = src.value; });
    });
  }

  /* ---------- app pages: a sample pSIF scenario ---------- */
  function initScenario() {
    $$('[data-scenario]').forEach(function (sc) {
      var btns = $$('button[data-answer]', sc), why = $('[data-why]', sc), verdict = $('[data-verdict]', sc);
      btns.forEach(function (b) {
        b.addEventListener('click', function () {
          btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          var right = b.getAttribute('data-answer') === sc.getAttribute('data-correct');
          if (verdict) verdict.textContent = right ? 'That matches the assessment.' : 'The assessment says otherwise.';
          if (why) why.hidden = false;
        });
      });
    });
  }

  /* a page that is a document in its own right (the sales deck) prints from a button */
  function initPrintPage() {
    $$('[data-print-page]').forEach(function (b) {
      b.addEventListener('click', function () { try { w.print(); } catch (x) { /* a frame without print */ } });
    });
  }

  function boot() {
    applyMotion();
    initNav(); initMotionToggle(); initHero(); initNarrator(); initCells();
    initPrompt(); initForms(); initPricing(); initChecklist(); initToc(); initFilter(); initCopy(); initSheets(); initScenario(); initPrintPage();
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', boot); else boot();
})();
