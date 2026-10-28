/* ==========================================================================
   Астера · общее поведение всех страниц
   ========================================================================== */
(function () {
  'use strict';
  var A  = window.ASTERA;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var slow = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* шапка: над первым экраном прозрачная, при прокрутке — тёмная */
  var top = $('#top');
  if (top && top.classList.contains('top--over')) {
    var solid = function () { top.classList.toggle('is-solid', window.scrollY > 30); };
    window.addEventListener('scroll', solid, { passive: true }); solid();
  }

  /* меню (как у LORD) и поиск */
  var menu = $('#menu'), menuBtn = $('#menuBtn'), srch = $('#srch'), srchBtn = $('#srchBtn'), q = $('#srchQ'), res = $('#srchRes');
  function setMenu(open) {
    if (!menu) return;
    if (open) setSearch(false);
    menu.hidden = !open; document.body.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); menuBtn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Меню');
  }
  function setSearch(open) {
    if (!srch) return;
    if (open) setMenu(false);
    srch.hidden = !open; document.body.classList.toggle('srch-open', open);
    srchBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) { find(); setTimeout(function () { q.focus(); }, 30); }
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
  if (srchBtn) srchBtn.addEventListener('click', function () { setSearch(srch.hidden); });
  if (menu) $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); setSearch(false); } });
  var PAGES = [['Входные двери', 'vhodnye.html'], ['Двери для дома', 'vhodnye.html#dom'], ['Межкомнатные двери', 'mezhkomnatnye.html'],
               ['Перегородки', 'interer.html#peregorodki'], ['Стеновые панели', 'interer.html#reyki'], ['Зеркала', 'interer.html#zerkala'],
               ['Напольные покрытия', 'interer.html#pol'], ['Замки и петли', 'interer.html#furnitura'], ['Акции', 'akcii.html'],
               ['Где купить', 'gde-kupit.html'], ['Контакты', 'kontakty.html'], ['Замер и консультация', 'kontakty.html#zayavka']];
  function norm(t) { return String(t).toLowerCase().replace(/ё/g, 'е').replace(/[«»"]/g, ''); }
  function find() {
    if (!res) return;
    var t = norm(q.value.trim()), out = [];
    if (!t) { res.innerHTML = PAGES.slice(0, 8).map(function (p) { return '<a href="' + p[1] + '">' + p[0] + '</a>'; }).join(''); return; }
    PAGES.forEach(function (p) { if (norm(p[0]).indexOf(t) > -1) out.push('<a href="' + p[1] + '">' + p[0] + '</a>'); });
    A.MODELS.forEach(function (m) {
      var hay = norm(m.t + ' ' + m.coll + ' ' + (m.brand === 'mid' ? 'межкомнатная ' + styleName(m.style) : 'входная ' + (m.sub === 'ulica' ? 'для дома' : 'в квартиру')));
      if (hay.indexOf(t) > -1) out.push('<a href="dver.html?id=' + m.id + '"><img src="' + A.prev(m, 400) + '" alt="" loading="lazy"><b>' + m.t + '<span>' + m.coll + '</span></b></a>');
    });
    res.innerHTML = out.length ? out.slice(0, 24).join('') : '<p class="srch__none">Ничего не нашли. Позвоните — подберём: <a href="tel:+79637386555">+7 963 738 65 55</a></p>';
  }
  if (q) q.addEventListener('input', find);

  /* слайдеры: главная и баннеры разделов */
  $$('.sl').forEach(function (sl) {
    var slides = $$('.sl__s', sl), dots = $$('.sl__dots button', sl);
    if (slides.length < 2) { $$('.sl__arr, .sl__dots', sl).forEach(function (x) { x.hidden = true; }); return; }
    var i = 0, timer = null;
    function load(s) {
      var img = $('img', s), src = $('source', s);
      if (img && img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
      if (src && src.dataset.srcset) { src.srcset = src.dataset.srcset; delete src.dataset.srcset; }
    }
    function go(n) {
      slides[i].classList.remove('is-on'); if (dots[i]) dots[i].classList.remove('is-on');
      i = (n + slides.length) % slides.length;
      load(slides[i]); load(slides[(i + 1) % slides.length]);
      slides[i].classList.add('is-on'); if (dots[i]) dots[i].classList.add('is-on');
    }
    function start() { if (!timer && !slow) timer = setInterval(function () { go(i + 1); }, 6500); }
    function stop() { clearInterval(timer); timer = null; }
    function user(n) { stop(); go(n); start(); }
    var prev = $('.sl__arr--prev', sl), next = $('.sl__arr--next', sl);
    if (prev) prev.addEventListener('click', function () { user(i - 1); });
    if (next) next.addEventListener('click', function () { user(i + 1); });
    dots.forEach(function (d, n) { d.addEventListener('click', function () { user(n); }); });
    var x0 = null;
    sl.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    sl.addEventListener('touchend', function (e) {
      if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 45) user(i + (dx < 0 ? 1 : -1));
    });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    setTimeout(function () { load(slides[1]); start(); }, 1800);
  });

  /* корзина в localStorage */
  var KEY = 'astera_cart_v3';
  function read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} badge(); }
  function badge() {
    var n = read().length;
    $$('.cart-count').forEach(function (el) { el.textContent = n; el.hidden = n === 0; });
    $$('.top__cart').forEach(function (el) { el.classList.toggle('is-empty', n === 0); });
  }
  window.CART = {
    all: read,
    add: function (item) { var v = read(); v.push(item); write(v); },
    remove: function (i) { var v = read(); v.splice(i, 1); write(v); },
    clear: function () { write([]); },
    total: function () { return read().reduce(function (s, x) { return s + (+x.price || 0); }, 0); }
  };
  badge();

  /* карточка модели */
  /* карточка модели — та же разметка, что в каталоге (_build.py, dcard) */
  function cardHTML(m) {
    var cls = m.brand === 'mid' ? ' dcard--mid' : (m.cover ? ' dcard--cover' : '');
    var act = m.brand === 'mid' ? 'Выбрать отделку' : (m.cover ? 'Подробнее' : 'Собрать свою дверь');
    return '<a class="dcard' + cls + '" href="dver.html?id=' + m.id + '"><span class="dcard__ph"><img loading="lazy" decoding="async" alt="' + m.t + '"' +
      ' src="' + A.prev(m, 400) + '" srcset="' + A.prev(m, 400) + ' 400w, ' + A.prev(m, 900) + ' 800w" sizes="(max-width:760px) 46vw, 23vw"></span>' +
      '<b class="dcard__t">' + m.t + '</b><span class="dcard__p">' + (m.price ? 'от ' + A.money(m.price) + ' ₽' : 'Цена по запросу') + '</span>' +
      '<span class="dcard__l">' + act + '</span></a>';
  }
  function styleName(s) { return { modern:'Современные', classic:'Классика', neo:'Неоклассика', minimal:'Минимализм', design:'Дизайн' }[s] || s; }
  window.styleName = styleName;
  window.renderCards = function (box, list) {
    if (!box) return;
    box.innerHTML = list.length ? list.map(cardHTML).join('')
      : '<p class="muted">В этом разделе пока нет моделей. Позвоните — подберём под задачу.</p>';
    rise(box);
  };

  /* карточки интерьерных решений */
  window.renderExtra = function (box, group) {
    if (!box || !group) return;
    box.innerHTML = group.items.map(function (x) {
      var sp = Object.keys(x.spec || {}).filter(function (k) { return x.spec[k]; })
        .map(function (k) { return x.spec[k]; }).slice(0, 3).join(' · ');
      return '<article class="pcard pcard--flat"><div class="pcard__ph"><img loading="lazy" decoding="async" alt="' + x.t + '"' +
        ' src="' + A.img(x.ph, 900) + '" srcset="' + A.img(x.ph, 440) + ' 440w, ' + A.img(x.ph, 900) + ' 900w"' +
        ' sizes="(max-width:760px) 46vw, 24vw"></div><div class="pcard__b"><h3>' + x.t + '</h3>' +
        '<p class="pcard__d">' + (x.d || '') + '</p>' + (sp ? '<p class="pcard__sp">' + sp + '</p>' : '') +
        '<div class="pcard__price"><b>' + (x.price ? 'от ' + A.money(x.price) + ' ₽' : 'цена по запросу') + '</b><span>' + (x.unit || '') + '</span></div>' +
      '</div></article>';
    }).join('');
    rise(box);
  };

  /* главный экран: сцены сменяют друг друга */
  (function heroShow() {
    var stage = $('.hero__bg'); if (!stage) return;
    var slides = $$('picture', stage); if (slides.length < 2) return;
    var i = 0, timer = null;
    var step = function () {
      slides[i].classList.remove('is-on');
      i = (i + 1) % slides.length;
      var img = $('img', slides[i]);
      if (img && img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
      var src = $('source', slides[i]);
      if (src && src.dataset.srcset) { src.srcset = src.dataset.srcset; delete src.dataset.srcset; }
      slides[i].classList.add('is-on');
    };
    var start = function () { if (!timer && !slow) timer = setInterval(step, 6500); };
    var stop = function () { clearInterval(timer); timer = null; };
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    setTimeout(start, 2200);
  })();

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
    var els = $$('.incl li, .steps li, .rev, .tile', root || document);   /* только текст: фото и карточки видны сразу */
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
