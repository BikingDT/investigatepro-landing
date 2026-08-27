/* InvestigatePro site system v2 — menu, capture forms, progress-reporting motion. */
(function () {
  'use strict';
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  if (!reduced) root.classList.add('motion-on');

  /* ---- mobile menu ---- */
  var mmBtn = document.querySelector('.mm-btn');
  if (mmBtn) {
    mmBtn.addEventListener('click', function () {
      var open = root.classList.toggle('mm-open');
      mmBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  /* ---- capture forms → existing leads endpoint ---- */
  var ENDPOINT = 'https://api.investigatepro.app/api/leads/capture';
  document.querySelectorAll('form[data-capture]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = { source: form.getAttribute('data-capture') || 'site' };
      form.querySelectorAll('input[name],textarea[name]').forEach(function (i) { if (i.value) data[i.name] = i.value; });
      var msg = form.querySelector('.form-msg');
      if (!msg) { msg = document.createElement('p'); msg.className = 'form-msg'; form.appendChild(msg); }
      var btn = form.querySelector('button[type="submit"],button:not([type])');
      if (btn) { btn.disabled = true; }
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r; })
        .then(function () {
          if (msg) { msg.textContent = form.getAttribute('data-success') || 'Done — check your inbox.'; msg.className = 'form-msg ok'; }
          form.querySelectorAll('input').forEach(function (i) { i.value = ''; });
        })
        .catch(function () {
          if (msg) { msg.textContent = 'That didn’t go through — email hello@investigatepro.app instead.'; msg.className = 'form-msg err'; }
        })
        .then(function () { if (btn) btn.disabled = false; });
    });
  });

  if (reduced) return; /* everything below is motion */

  /* ---- read-progress hairline ---- */
  var bar = document.getElementById('ip2-progress');
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  /* ---- section rail ---- */
  var rail = document.querySelector('.rail');
  if (rail && 'IntersectionObserver' in window) {
    var links = {}; rail.querySelectorAll('a[data-for]').forEach(function (a) { links[a.getAttribute('data-for')] = a; });
    var railIO = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove('on'); });
          var l = links[en.target.id]; if (l) l.classList.add('on');
          rail.classList.toggle('rail-hide', en.target.id === 'coach');
        }
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) railIO.observe(s); });
  }

  /* ---- generic rise reveals (with settle guard) ---- */
  var settle = function (el) { el.classList.add('in'); };
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { settle(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.18 });
    document.querySelectorAll('.rise,.tl-draw,.tl').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.rise,.tl-draw,.tl').forEach(settle);
  }

  /* ---- swap scrub ---- */
  var swap = document.getElementById('swap');
  if (swap) {
    var marker = swap.querySelector('.track-marker');
    var pair = swap.querySelector('.swap-pair');
    if (pair) pair.classList.add('swap-wait');
    var swapTick = function () {
      var r = swap.getBoundingClientRect();
      var p = Math.min(1, Math.max(0, (window.innerHeight * 0.75 - r.top) / (r.height * 0.9)));
      if (marker) marker.style.left = 'calc(' + (p * 100) + '% - 5px)';
      if (pair && p > 0.35) { pair.classList.remove('swap-wait'); pair.classList.add('swap-go'); }
    };
    window.addEventListener('scroll', swapTick, { passive: true }); swapTick();
    setTimeout(function () { if (pair && !pair.classList.contains('swap-go')) { var r = swap.getBoundingClientRect(); if (r.top < window.innerHeight) { pair.classList.remove('swap-wait'); pair.classList.add('swap-go'); } } }, 1400);
  }

  /* ---- coach: sequential beats + case meter ---- */
  var coach = document.getElementById('coach');
  if (coach) {
    var beats = [].slice.call(coach.querySelectorAll('.beat'));
    var panel = coach.querySelector('.case-panel');
    var counts = [].slice.call(coach.querySelectorAll('[data-count]'));
    var started = false;
    var runCoach = function () {
      if (started) return; started = true;
      beats.forEach(function (b, i) {
        var dots = b.querySelector('.dots');
        setTimeout(function () {
          b.classList.add('in');
          if (dots) setTimeout(function () { dots.style.display = 'none'; }, 700);
        }, 350 + i * 700);
      });
      if (panel) setTimeout(function () { panel.classList.add('in'); }, 500);
      counts.forEach(function (el) {
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        el.textContent = '0';
        var t0 = null;
        var step = function (ts) {
          if (!t0) t0 = ts;
          var k = Math.min(1, (ts - t0) / 900);
          el.textContent = Math.round(target * k);
          if (k < 1) requestAnimationFrame(step);
        };
        setTimeout(function () { requestAnimationFrame(step); }, 600);
      });
      /* guard: force final state if anything stalls */
      setTimeout(function () {
        beats.forEach(function (b) { b.classList.add('in'); var d = b.querySelector('.dots'); if (d) d.style.display = 'none'; });
        if (panel) panel.classList.add('in');
        counts.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      }, 350 + beats.length * 700 + 900);
    };
    if ('IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (es) {
        es.forEach(function (en) { if (en.isIntersecting) { runCoach(); cio.disconnect(); } });
      }, { threshold: 0.25 });
      cio.observe(coach);
      /* second net: scroll-position check */
      window.addEventListener('scroll', function () {
        var r = coach.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.7) runCoach();
      }, { passive: true });
    } else { runCoach(); }
  }

  /* ================================================================
     Shared motion language, matching the homepage:
       · one nav rail that follows attention and springs back
       · section resolve — the opening block rises out of a ghost as it
         enters, heading line by line, then subhead, then a support panel
       · phrase lighting — a lede resolves as you read down it
       · the PEEPO constellation, on pages that open with a dark band
     All of it is gated on motion-on, so reduced-motion and no-JS get the
     resolved state and no movement.
     ================================================================ */
  if (root.classList.contains('motion-on')) (function () {
    var clamp01 = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var ease = function (x) { return x * x * (3 - 2 * x); };
    var lerp = function (a, b, t) { return a + (b - a) * t; };

    /* ---- nav rail ---- */
    var wrap = document.querySelector('.ip2-links');
    var nrail = null, railItems = [];
    if (wrap) {
      nrail = document.createElement('span');
      nrail.className = 'nrail';
      nrail.setAttribute('aria-hidden', 'true');
      wrap.appendChild(nrail);
      railItems = Array.prototype.slice.call(wrap.querySelectorAll('a')).filter(function (a) {
        return !a.classList.contains('ip2-cta') && !a.classList.contains('ip2-login');
      });
      var railTo = function (el) {
        if (!el || !el.offsetWidth) { nrail.style.opacity = '0'; return; }
        nrail.style.opacity = '1';
        nrail.style.transform = 'translate(' + el.offsetLeft + 'px,' +
          (el.offsetTop + el.offsetHeight + 2) + 'px) scaleX(' + el.offsetWidth + ')';
      };
      var railReset = function () { railTo(null); };
      railItems.forEach(function (a) {
        a.addEventListener('mouseenter', function () { railTo(a); });
        a.addEventListener('focus', function () { railTo(a); });
      });
      wrap.addEventListener('mouseleave', railReset);
      wrap.addEventListener('focusout', function () { setTimeout(railReset, 0); });
    }

    /* ---- heading line splitting ---- */
    function splitLines(el) {
      if (el.dataset.sl === '1') return Array.prototype.slice.call(el.querySelectorAll('.ln'));
      var raw = el.dataset.raw || (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!raw) { el.dataset.sl = '1'; return []; }
      el.dataset.raw = raw;
      el.textContent = '';
      var words = raw.split(' ');
      words.forEach(function (w, i) {
        var sp = document.createElement('span');
        sp.className = 'wd'; sp.style.display = 'inline-block'; sp.textContent = w;
        el.appendChild(sp);
        if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
      });
      var spans = Array.prototype.slice.call(el.querySelectorAll('.wd'));
      var groups = [], cur = [], top = null;
      spans.forEach(function (sp) {
        var t = Math.round(sp.offsetTop);
        if (top === null) { top = t; cur.push(sp); }
        else if (Math.abs(t - top) <= 3) { cur.push(sp); }
        else { groups.push(cur); cur = [sp]; top = t; }
      });
      if (cur.length) groups.push(cur);
      el.textContent = '';
      var lines = groups.map(function (g) {
        var ln = document.createElement('span');
        ln.className = 'ln res';
        ln.textContent = g.map(function (x) { return x.textContent; }).join(' ');
        el.appendChild(ln);
        return ln;
      });
      el.dataset.sl = '1';
      return lines;
    }

    /* ---- phrase splitting ---- */
    function splitPhrases(el, per) {
      if (!el || el.dataset.lw === '1') return el ? Array.prototype.slice.call(el.querySelectorAll('.lw')) : [];
      var words = (el.textContent || '').trim().split(/\s+/).filter(Boolean);
      if (!words.length) return [];
      el.textContent = '';
      for (var i = 0; i < words.length; i += per) {
        var sp = document.createElement('span');
        sp.className = 'lw';
        sp.textContent = words.slice(i, i + per).join(' ');
        el.appendChild(sp);
        if (i + per < words.length) el.appendChild(document.createTextNode(' '));
      }
      el.dataset.lw = '1';
      el.classList.add('lit-text');
      return Array.prototype.slice.call(el.querySelectorAll('.lw'));
    }

    var items = [];
    /* Anchored on the headings themselves rather than a section wrapper, so
       this works on every page shape in the site — the newer sectioned
       templates and the older bare-<section> and .prose article pages. */
    function build() {
      items = [];
      var heads = Array.prototype.slice.call(document.querySelectorAll('h1, h2'))
        .filter(function (h) {
          if (h.closest('nav, footer, .ip2-nav, .ip2-footer, .mm-panel')) return false;
          return (h.textContent || '').trim().length > 0;
        })
        .slice(0, 12);
      heads.forEach(function (head) {
        var prev = head.previousElementSibling;
        var next = head.nextElementSibling;
        var eyebrow = prev && prev.classList.contains('eyebrow') ? prev : null;
        var lede = next && next.classList.contains('lede') ? next : null;
        var it = {
          sec: head,
          eyebrow: eyebrow,
          lines: splitLines(head),
          lede: lede,
          spans: splitPhrases(lede, 4)
        };
        if (it.eyebrow) { tones.set(it.eyebrow, readTone(it.eyebrow)); it.eyebrow.classList.add('res'); }
        it.lines.forEach(function (ln) { tones.set(ln, readTone(ln)); });
        if (it.lede) it.lede.classList.add('res');
        items.push(it);
      });
    }
    /* the ghost resolves by COLOUR, not opacity: graphite (5.6:1 on white)
       to the element's own tone, so every frame of it clears AA */
    var GHOST = [90, 107, 118];
    var tones = new WeakMap();
    function readTone(el) {
      /* clear any in-flight ghost first, or a re-split during the entry
         window bakes the ghost colour in as the natural tone */
      el.style.color = '';
      var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(el).color);
      return m ? [+m[1], +m[2], +m[3]] : [55, 71, 79];
    }
    function setRes(el, v, useTone) {
      if (!el) return;
      el.style.transform = v > 0.999 ? 'none' : 'translateY(' + ((1 - v) * 18).toFixed(2) + 'px)';
      if (useTone) {
        var t = tones.get(el) || [55, 71, 79];
        el.style.color = 'rgb(' + Math.round(lerp(GHOST[0], t[0], v)) + ',' +
          Math.round(lerp(GHOST[1], t[1], v)) + ',' + Math.round(lerp(GHOST[2], t[2], v)) + ')';
      }
      /* no opacity ghosting: text keeps full contrast the whole way in */
    }
    function drive() {
      var vh = window.innerHeight || 1;
      items.forEach(function (R) {
        var r = R.sec.getBoundingClientRect();
        var below = r.top > vh * 1.05;
        var q = below ? 1 : clamp01((vh * 0.94 - r.top) / (vh * 0.46));
        var k = 0;
        var at = function () { return below ? 1 : ease(clamp01((q - (k++) * 0.085) / 0.4)); };
        setRes(R.eyebrow, at(), true);
        R.lines.forEach(function (ln) { setRes(ln, at(), true); });
        setRes(R.lede, at());
        if (below) { R.spans.forEach(function (sp) { sp.classList.add('lit'); }); return; }
        var lq = clamp01((vh * 0.86 - r.top) / (vh * 0.55));
        var n = R.spans.length, upto = lq * (n + 0.8);
        for (var i = 0; i < n; i++) R.spans[i].classList.toggle('lit', i < upto);
      });
    }
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; drive(); });
    }
    build(); drive();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () {
      Array.prototype.slice.call(document.querySelectorAll('[data-sl]')).forEach(function (h) { h.dataset.sl = '0'; });
      build(); drive();
    });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        Array.prototype.slice.call(document.querySelectorAll('[data-sl]')).forEach(function (h) { h.dataset.sl = '0'; });
        build(); drive();
      }).catch(function () {});
    }
  })();
})();
