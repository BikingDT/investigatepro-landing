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
})();
