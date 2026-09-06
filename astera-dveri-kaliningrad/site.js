/* ==========================================================================
   Астера · общее поведение всех страниц
   ========================================================================== */
(function () {
  'use strict';
  var A  = window.ASTERA;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var slow = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* меню на телефоне */
  var burger = $('.burger'), mnav = $('.mnav');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = mnav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () {
      mnav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
    }); });
  }

  /* корзина в localStorage */
  var KEY = 'astera_cart_v2';
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} badge(); }
  function badge() { var n = read().length; $$('.cart-count').forEach(function (el) { el.textContent = n; el.hidden = n === 0; }); }
  window.CART = {
    all: read,
    add: function (item) { var v = read(); v.push(item); write(v); },
    remove: function (i) { var v = read(); v.splice(i, 1); write(v); },
    clear: function () { write([]); },
    total: function () { return read().reduce(function (s, x) { return s + (+x.price || 0); }, 0); }
  };
  badge();

  /* карточка модели */
  function cardHTML(m) {
    var cover = m.brand === 'lord';   /* у LORD превью — фото в интерьере, у Burkovsky — рендер на прозрачном */
    return '<a class="pcard" href="dver.html?id=' + m.id + '">' +
      (m.hit ? '<span class="tag">хит</span>' : '') +
      '<div class="pcard__ph' + (cover ? ' pcard__ph--cover' : '') + '"><img loading="lazy" decoding="async" alt="' + m.t + '"' +
        ' src="' + A.prev(m, 900) + '" srcset="' + A.prev(m, 440) + ' 440w, ' + A.prev(m, 900) + ' 900w"' +
        ' sizes="(max-width:760px) 46vw, (max-width:1100px) 31vw, 24vw">' +
        (m.heroM ? '<img class="pcard__alt" data-src="' + A.heroM(m) + '" alt="">' : '') + '</div>' +
      '<div class="pcard__b"><span class="pcard__coll">' + (m.brand === 'lord' ? 'LORD · ' + styleName(m.style) : 'Burkovsky · ' + m.coll) + '</span>' +
        '<h3>' + m.t + '</h3><p class="pcard__d">' + (m.d || '') + '</p>' +
        '<div class="pcard__price"><b>' + A.priceText(m) + '</b><span>' + (m.brand === 'lord' ? 'полотно' : 'дверь') + '</span></div>' +
      '</div></a>';
  }
  function styleName(s) { return { modern:'Современные', classic:'Классика', neo:'Неоклассика', minimal:'Минимализм', design:'Дизайн' }[s] || s; }
  window.styleName = styleName;
  window.renderCards = function (box, list) {
    if (!box) return;
    box.innerHTML = list.length ? list.map(cardHTML).join('')
      : '<p class="muted">В этом разделе пока нет моделей. Позвоните — подберём под задачу.</p>';
    rise(box);
    /* сцена модели подгружается только при наведении */
    $$('.pcard__alt', box).forEach(function (im) {
      im.closest('.pcard').addEventListener('mouseenter', function () { if (!im.src) im.src = im.dataset.src; }, { once: true });
    });
  };

  /* фильтры каталога: подраздел · стиль · коллекция */
  window.initFilter = function (opts) {
    var box = $(opts.grid), bar = $(opts.bar);
    if (!box || !bar) return;
    var q = new URLSearchParams(location.search);
    var state = { sub: q.get('sub') || opts.sub || '', style: q.get('style') || '', coll: q.get('coll') || '' };
    var apply = function () {
      var list = A.MODELS.filter(function (m) {
        if (m.cat !== opts.cat) return false;
        if (state.sub && m.sub !== state.sub) return false;
        if (state.style && m.style !== state.style) return false;
        if (state.coll && m.coll !== state.coll) return false;
        return true;
      });
      window.renderCards(box, list);
      var c = $(opts.count); if (c) c.textContent = list.length + ' ' + plural(list.length, 'модель', 'модели', 'моделей');
      $$('[data-f]', bar).forEach(function (x) { x.classList.toggle('is-on', x.dataset.v === state[x.dataset.f]); });
      var p = new URLSearchParams(); ['sub','style','coll'].forEach(function (k) { if (state[k]) p.set(k, state[k]); });
      history.replaceState(null, '', p.toString() ? '?' + p.toString() : location.pathname);
    };
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-f]'); if (!b) return;
      e.preventDefault();
      var g = b.dataset.f, v = b.dataset.v;
      state[g] = state[g] === v ? '' : v;
      apply();
    });
    apply();
  };
  function plural(n, a, b, c) { var d = n % 100, e = n % 10; return d > 4 && d < 21 ? c : e === 1 ? a : e > 1 && e < 5 ? b : c; }
  window.plural = plural;

  /* появление блоков */
  function rise(root) {
    if (!('IntersectionObserver' in window) || slow) return;
    var els = $$('.head, .pcard, .ptile, .brand, .incl li, .steps li, .rev, .about, .calc, .form, .tile, .sub', root || document);
    var obs = new IntersectionObserver(function (rows) {
      rows.forEach(function (r) { if (!r.isIntersecting) return; r.target.classList.add('in'); obs.unobserve(r.target); });
    }, { rootMargin: '0px 0px -6% 0px', threshold: .05 });
    els.forEach(function (el, i) {
      if (el.hasAttribute('data-rise')) return;
      el.setAttribute('data-rise', ''); el.style.transitionDelay = (Math.min(i % 5, 4) * 50) + 'ms'; obs.observe(el);
    });
  }
  window.rise = rise; rise();

  /* формы */
  window.maskPhone = function (input) {
    if (!input) return;
    input.addEventListener('input', function () {
      var d = input.value.replace(/\D/g, '');
      if (d[0] === '8') d = '7' + d.slice(1);
      if (d[0] !== '7') d = '7' + d;
      d = d.slice(0, 11);
      var out = '+7';
      if (d.length > 1) out += ' (' + d.slice(1, 4);
      if (d.length >= 5) out += ') ' + d.slice(4, 7);
      if (d.length >= 8) out += '-' + d.slice(7, 9);
      if (d.length >= 10) out += '-' + d.slice(9, 11);
      input.value = out;
    });
  };
  window.bindForm = function (form, okBox, after) {
    if (!form) return;
    var name = $('input[type="text"]', form), phone = $('input[type="tel"]', form);
    window.maskPhone(phone);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      [[name, !name || name.value.trim().length >= 2], [phone, phone && phone.value.replace(/\D/g, '').length === 11]]
        .forEach(function (p) { if (!p[0]) return; var bad = !p[1]; p[0].closest('.field').classList.toggle('is-bad', bad); if (bad && ok) { p[0].focus(); ok = false; } });
      if (!ok) return;
      /* TODO: отправка заявки — Telegram-бот, почта или CRM. См. README.md */
      $$('.field, .form__foot', form).forEach(function (el) { el.hidden = true; });
      if (okBox) okBox.hidden = false;
      if (after) after();
    });
  };
  $$('form[data-simple]').forEach(function (f) { window.bindForm(f, f.querySelector('.form__ok')); });
})();
