/* ============================================================
   БАЛТАВТОПРОКАТ — интерактив
   ============================================================ */
(function () {
  'use strict';
  var WA_NUMBER = '79062170047'; // WhatsApp / телефон

  /* ---------- Sticky header ---------- */
  var header = document.querySelector('.site-header');
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var burger = document.querySelector('.burger');
  var closeMenu = function () { document.body.classList.remove('menu-open'); };
  if (burger) {
    burger.addEventListener('click', function () {
      document.body.classList.toggle('menu-open');
    });
    document.querySelectorAll('.mobile-nav a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Count-up stats ---------- */
  var counted = false;
  var runCount = function () {
    if (counted) return; counted = true;
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var suffix = el.getAttribute('data-suffix') || '';
      var dec = (target % 1 !== 0) ? 1 : 0;
      var start = null, dur = 1400;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(dec) + suffix;
      };
      requestAnimationFrame(step);
    });
  };
  var statZone = document.querySelector('[data-count]');
  if (statZone && 'IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { runCount(); sio.disconnect(); }
    }, { threshold: 0.4 });
    sio.observe(statZone);
  } else { runCount(); }

  /* ---------- Gallery filter ---------- */
  var filters = document.querySelectorAll('.filter');
  var items = document.querySelectorAll('.gitem');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filters.forEach(function (f) { f.classList.remove('active'); });
      btn.classList.add('active');
      var cat = btn.getAttribute('data-filter');
      items.forEach(function (it) {
        var show = cat === 'all' || it.getAttribute('data-cat') === cat;
        it.classList.toggle('hide', !show);
      });
    });
  });

  /* ---------- Lightbox ---------- */
  var lb = document.querySelector('.lightbox');
  if (lb) {
    var lbImg = lb.querySelector('img');
    var lbCap = lb.querySelector('.lightbox__cap');
    var gitems = Array.prototype.slice.call(document.querySelectorAll('.gitem'));
    var current = 0;
    var visibleItems = function () { return gitems.filter(function (g) { return !g.classList.contains('hide'); }); };
    var show = function (idx) {
      var vis = visibleItems();
      if (!vis.length) return;
      current = (idx + vis.length) % vis.length;
      var el = vis[current];
      var img = el.querySelector('img');
      lbImg.src = img.getAttribute('data-full') || img.src;
      lbImg.alt = img.alt || '';
      lbCap.textContent = (el.getAttribute('data-caption') || img.alt || '');
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    gitems.forEach(function (el) {
      el.addEventListener('click', function () {
        show(visibleItems().indexOf(el));
      });
    });
    var close = function () { lb.classList.remove('open'); document.body.style.overflow = ''; };
    lb.querySelector('.lightbox__close').addEventListener('click', close);
    lb.querySelector('.prev').addEventListener('click', function (e) { e.stopPropagation(); show(current - 1); });
    lb.querySelector('.next').addEventListener('click', function (e) { e.stopPropagation(); show(current + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  /* ---------- Lead form -> WhatsApp ---------- */
  document.querySelectorAll('form[data-lead]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.querySelector('[name=name]') || {}).value || '';
      var phone = (form.querySelector('[name=phone]') || {}).value || '';
      var service = (form.querySelector('[name=service]') || {}).value || '';
      var msg = (form.querySelector('[name=message]') || {}).value || '';
      var text = 'Здравствуйте! Заявка с сайта Балтавтопрокат.%0A';
      if (name) text += '%0AИмя: ' + encodeURIComponent(name);
      if (phone) text += '%0AТелефон: ' + encodeURIComponent(phone);
      if (service) text += '%0AУслуга: ' + encodeURIComponent(service);
      if (msg) text += '%0AКомментарий: ' + encodeURIComponent(msg);
      var ok = form.querySelector('.form__ok');
      if (ok) { ok.style.display = 'block'; }
      window.open('https://wa.me/' + WA_NUMBER + '?text=' + text, '_blank');
      form.reset();
      setTimeout(function () { if (ok) ok.style.display = 'none'; }, 6000);
    });
  });

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
