/* ============================================================
   Илья — хранение и продажа авто
   ============================================================ */

/*  ЗАЯВКИ.
    Форма пока НЕ отправляет данные на сервер — показывает успех локально.
    Чтобы заявки реально приходили, впишите URL сервиса (Web3Forms, Formspree,
    свой бэкенд / Telegram-бот) в FORM_ENDPOINT. Инструкция — в README.md. */
const FORM_ENDPOINT = ''; // напр. 'https://api.web3forms.com/submit'
const WEB3FORMS_KEY  = ''; // access_key, если Web3Forms

(function () {
  'use strict';

  var doc = document;

  /* ---------- год ---------- */
  var y = doc.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- шапка: фон при скролле ---------- */
  var header = doc.getElementById('header');
  var onScroll = function () {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- мобильное меню ---------- */
  var burger = doc.getElementById('burger');
  var overlay = doc.getElementById('menuOverlay');
  function closeMenu() {
    burger.classList.remove('open'); overlay.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false'); doc.body.style.overflow = '';
  }
  if (burger && overlay) {
    burger.addEventListener('click', function () {
      var open = overlay.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      doc.body.style.overflow = open ? 'hidden' : '';
    });
    overlay.addEventListener('click', function (e) { if (e.target.tagName === 'A') closeMenu(); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- стаггер для групп ---------- */
  ['.care li', '.stat', '.step', '.bento figure', '.trust-points li'].forEach(function (sel) {
    doc.querySelectorAll(sel).forEach(function (el, i) { el.style.setProperty('--i', i % 6); });
  });

  /* ---------- появление при скролле ---------- */
  var reveals = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- счётчики ---------- */
  var counters = doc.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, target = parseInt(el.getAttribute('data-count'), 10), t0 = null, dur = 1100;
        function tick(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ---------- выбор услуги переносим в форму ---------- */
  var intentInputs = doc.querySelectorAll('input[name="intent"]');
  doc.querySelectorAll('[data-intent]').forEach(function (el) {
    el.addEventListener('click', function () {
      var val = el.getAttribute('data-intent');
      intentInputs.forEach(function (inp) { inp.checked = (inp.value === val); });
    });
  });

  /* ---------- маска телефона ---------- */
  var phone = doc.getElementById('phone');
  if (phone) {
    phone.addEventListener('input', function () {
      var d = phone.value.replace(/\D/g, '');
      if (d[0] === '8') d = '7' + d.slice(1);
      if (d[0] !== '7') d = '7' + d;
      d = d.slice(0, 11);
      var out = '+7';
      if (d.length > 1) out += ' (' + d.slice(1, 4);
      if (d.length >= 4) out += ') ' + d.slice(4, 7);
      if (d.length >= 7) out += '-' + d.slice(7, 9);
      if (d.length >= 9) out += '-' + d.slice(9, 11);
      phone.value = out;
    });
  }

  /* ---------- форма ---------- */
  var form = doc.getElementById('leadForm');
  var status = doc.getElementById('formStatus');
  function setStatus(msg, type) { if (status) { status.textContent = msg; status.className = 'form-status' + (type ? ' ' + type : ''); } }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('', '');
      var name = form.name, tel = form.phone, ok = true;
      [name, tel].forEach(function (f) { f.classList.remove('invalid'); });
      if (!name.value.trim()) { name.classList.add('invalid'); ok = false; }
      if (tel.value.replace(/\D/g, '').length < 11) { tel.classList.add('invalid'); ok = false; }
      if (!ok) { setStatus('Проверьте имя и телефон.', 'err'); return; }

      var intentEl = form.querySelector('input[name="intent"]:checked');
      var payload = { name: name.value.trim(), phone: tel.value.trim(), intent: intentEl ? intentEl.value : '', comment: form.comment.value.trim() };

      if (!FORM_ENDPOINT) {
        console.log('Заявка (демо, не отправлена):', payload);
        form.reset(); setStatus('Заявка принята. Свяжусь с вами в ближайшее время.', 'ok'); return;
      }

      var btn = form.querySelector('button[type="submit"]'), prev = btn.textContent;
      btn.disabled = true; btn.textContent = 'Отправляю…';
      var body = Object.assign({}, payload);
      if (WEB3FORMS_KEY) { body.access_key = WEB3FORMS_KEY; body.subject = 'Заявка с сайта: ' + payload.intent; }

      fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(body) })
        .then(function (r) { if (!r.ok) throw new Error('bad'); return r.json().catch(function () { return {}; }); })
        .then(function () { form.reset(); setStatus('Заявка отправлена. Свяжусь с вами в ближайшее время.', 'ok'); })
        .catch(function () { setStatus('Не удалось отправить. Позвоните, пожалуйста, по телефону.', 'err'); })
        .finally(function () { btn.disabled = false; btn.textContent = prev; });
    });
  }
})();
