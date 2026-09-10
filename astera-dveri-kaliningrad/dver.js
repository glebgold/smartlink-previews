/* ==========================================================================
   Астера · страница модели. Входные — конфигуратор, межкомнатные — отделки.
   ========================================================================== */
(function () {
  'use strict';
  var A  = window.ASTERA;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var M = A.byId(new URLSearchParams(location.search).get('id')) || A.MODELS[0];
  var fmt = function (n) { return A.money(Math.round(n)); };
  var find = function (arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return arr[0]; };
  var isMid = M.brand === 'mid';

  /* ---------- шапка страницы ---------- */
  var c = A.cat(M.cat), sub = null;
  if (M.sub) c.subs.forEach(function (s) { if (s.id === M.sub) sub = s; });
  $('#pBg').src = A.hero(M); $('#pBg').alt = M.t;
  $('#pName').textContent = M.t;
  $('#pBrand').textContent = (isMid ? 'Межкомнатная · ' + M.coll : 'Входная · ' + M.coll);
  $('#pPrice').innerHTML = A.priceText(M) + '<small>' + (isMid ? 'полотно с коробом, установка отдельно' : 'цена двери, доставка и установка в Калининграде — наши') + '</small>';
  var parts = ['<a href="index.html">Главная</a><span>/</span>', '<a href="katalog.html">Каталог</a><span>/</span>',
               '<a href="' + c.page + '">' + c.t + '</a><span>/</span>'];
  if (sub) parts.push('<a href="' + c.page + '?sub=' + sub.id + '">' + sub.t + '</a><span>/</span>');
  parts.push('<b>' + M.t + '</b>');
  $('#crumbs').innerHTML = parts.join('');
  document.title = M.t + ' — ' + (isMid ? 'межкомнатная дверь' : 'входная дверь') + ' · Астера';
  $('#pDesc').textContent = M.d || '';
  $('#pSpec').innerHTML = Object.keys(M.spec || {}).map(function (k) {
    return M.spec[k] ? '<div><dt>' + k + '</dt><dd>' + M.spec[k] + '</dd></div>' : ''; }).join('');

  /* ---------- галерея ---------- */
  var main = $('#galMain'), mainImg = $('#galImg'), thumbs = $('#galThumbs'), cap = $('#galCap');
  var shots = isMid
    ? [{ s: A.prev(M, 900), t: M.t + ' в интерьере', cover: true }].concat((M.variants || []).map(function (v) { return { s: A.img(v.f), t: v.t, cover: false }; }))
    : [{ s: A.prev(M, 900), t: 'Полотно', cover: false }, { s: A.hero(M), t: 'В проёме', cover: true }]
        .concat(A.gal(M).map(function (g) { return { s: g, t: 'Деталь', cover: true }; }));
  function show(i) {
    var sh = shots[i]; mainImg.src = sh.s; mainImg.alt = sh.t; cap.textContent = sh.t;
    main.classList.toggle('gal__main--cover', !!sh.cover);
    $$('.gal__t', thumbs).forEach(function (b, n) { b.classList.toggle('is-on', n === i); });
  }
  thumbs.innerHTML = shots.map(function (sh, i) {
    return '<button type="button" class="gal__t" data-i="' + i + '" aria-label="' + sh.t + '"><img loading="lazy" src="' + sh.s + '" alt=""></button>';
  }).join('');
  thumbs.addEventListener('click', function (e) { var b = e.target.closest('.gal__t'); if (b) show(+b.dataset.i); });
  show(0);

  /* ---------- состояние ---------- */
  var S, D;
  var confBox = $('#conf');
  function radios(box, list, group) {
    box.innerHTML = list.map(function (o) {
      return '<label><input type="radio" name="' + group + '" value="' + o.id + '"' + (S[group] === o.id ? ' checked' : '') + '><span>' + o.t + (o.p ? ' <i>+' + fmt(o.p) + ' ₽</i>' : '') + '</span></label>';
    }).join('');
  }
  function checks(box, list, group) {
    box.innerHTML = list.map(function (o) {
      return '<label><input type="checkbox" name="' + group + '" value="' + o.id + '"' + (S[group].indexOf(o.id) > -1 ? ' checked' : '') + '><span>' + o.t + ' <i>+' + fmt(o.p) + ' ₽</i></span></label>';
    }).join('');
  }
  function swatches(box, list, group) {
    box.innerHTML = list.map(function (c) {
      return '<label title="' + c[1] + '"><input type="radio" name="' + group + '" value="' + c[0] + '"' + (S[group] === c[0] ? ' checked' : '') + '><i style="background:' + c[2] + '"></i></label>';
    }).join('') + '<b class="sw__name" data-for="' + group + '"></b>';
  }
  function packs(box, list, group) {
    box.innerHTML = list.map(function (o) {
      return '<label class="pack"><input type="radio" name="' + group + '" value="' + o.id + '"' + (S[group] === o.id ? ' checked' : '') +
        '><span class="pack__b"><b>' + o.t + '</b><em>' + (o.p ? '+' + fmt(o.p) + ' ₽' : 'в базе') + '</em><i>' + o.d + '</i></span></label>';
    }).join('');
  }
  function fieldset(legend, inner, extra) { return '<fieldset class="cf"><legend>' + legend + '</legend>' + inner + (extra || '') + '</fieldset>'; }

  /* ===== входная дверь ===== */
  function initSteel() {
    D = {
      base: M.price,
      outFinish: [{ id:'mdf', t:'МДФ, эмаль', p:0, hint:'Ровный матовый цвет по палитре RAL.' }, { id:'oak', t:'Шпон дуба', p:38000, hint:'Живой рисунок, тонировка по образцу.' }, { id:'mass', t:'Массив дуба', p:96000, hint:'Для парадных входов. Срок дольше на три недели.' }],
      outColor: { mdf:[['graphite','Графит','#33393A'],['anthracite','Антрацит','#1F2427'],['warmgrey','Тёплый серый','#6B6A63'],['emerald','Изумрудный графит','#2C3A36'],['white','Белый','#DEDCD5']],
                  oak:[['nat','Дуб натуральный','#A9855C'],['mocha','Дуб мокко','#6F5540'],['grph','Дуб графит','#4A4442'],['wenge','Венге','#3A302B']],
                  mass:[['gold','Дуб золотой','#B08A55'],['dark','Дуб тёмный','#5B4632'],['nut','Орех','#4E362A']] },
      inFinish: [{ id:'mdf', t:'МДФ, эмаль', p:0 }, { id:'oak', t:'Шпон дуба', p:29000 }, { id:'mirror', t:'С зеркалом', p:44000 }],
      inColor: { mdf:[['white','Белый матовый','#E9E7E1'],['lgrey','Светло-серый','#C3C4BF'],['grph','Графит','#3A3F3E'],['milk','Дуб молочный','#D6C6AE']],
                 oak:[['nat','Дуб натуральный','#A9855C'],['milk','Дуб молочный','#D6C6AE'],['grph','Дуб графит','#4A4442']],
                 mirror:[['silver','Зеркало серебро','#9FA6A5'],['smoke','Зеркало графит','#5A6160']] },
      size: [{ id:'860x2050', t:'860 × 2050', p:0 }, { id:'900x2050', t:'900 × 2050', p:0 }, { id:'950x2100', t:'950 × 2100', p:0 }, { id:'1000x2100', t:'1000 × 2100', p:0 }, { id:'custom', t:'Свой размер', p:24000 }],
      side: [{ id:'right', t:'Правая', p:0 }, { id:'left', t:'Левая', p:0 }],
      swing: [{ id:'in', t:'Открывается внутрь', p:0 }, { id:'out', t:'Наружу', p:0 }],
      sec: [{ id:'std', t:'Стандартная', p:0, lbl:'Стандартная', d:'Цилиндр с защитой от отмычки и высверливания, броненакладка, два рубежа запирания, противосъёмные штыри. Того, что закрывает страховая, здесь уже достаточно.' },
            { id:'max', t:'Максимальная', p:79000, lbl:'Максимальная', d:'Повышенная взломостойкость: цилиндр высшего класса с перекодировкой, магнитная броненакладка, дополнительная задвижка на ригель и усиленная коробка.' }],
      kit: [{ id:'std', t:'Стандартный', p:0, d:'Нажимная ручка на планке, глазок с широким углом, скрытые петли с регулировкой, механический замок.' },
            { id:'prem', t:'Премиум', p:64000, d:'Скоба из нержавейки на выбор, электронный замок с отпечатком пальца, скрытый доводчик, подсветка притвора с датчиком движения.' }],
      handleColor: [['black','Чёрный матовый','#23262A'],['bronze','Бронза','#7A5C36'],['steel','Нержавейка','#9BA2A3'],['brass','Латунь','#A98A4B']],
      comfort: [{ id:'casing', t:'Доборы и наличники', p:19000 }, { id:'plate', t:'Номерок на дверь', p:6500 }, { id:'closer', t:'Скрытый доводчик', p:21000 }]
    };
    S = { outFinish:'mdf', outColor:'graphite', inFinish:'mdf', inColor:'white', size:'900x2050', cw:880, ch:2090,
          side:'right', swing:'in', sec:'std', kit:'std', handleColor:'black', comfort:[] };
    confBox.innerHTML =
      fieldset('Отделка с улицы', '<div class="opts" data-g="outFinish"></div><div class="sw" data-g="outColor" role="radiogroup" aria-label="Цвет снаружи"></div><p class="cf__hint" id="hintOut"></p>') +
      fieldset('Отделка внутри, со стороны квартиры', '<div class="opts" data-g="inFinish"></div><div class="sw" data-g="inColor" role="radiogroup" aria-label="Цвет внутри"></div>') +
      fieldset('Размер проёма', '<div class="opts" data-g="size"></div><div class="custom" id="customSize" hidden><label>Ширина, мм <input type="number" id="cw" value="880" min="600" max="1400" step="10"></label><label>Высота, мм <input type="number" id="ch" value="2090" min="1800" max="2600" step="10"></label></div>') +
      fieldset('Открывание', '<div class="opts" data-g="side"></div><div class="opts" data-g="swing" style="margin-top:9px"></div>') +
      fieldset('Взломостойкость', '<div class="packs" data-g="sec"></div>') +
      fieldset('Комплект фурнитуры', '<div class="packs" data-g="kit"></div><div class="sw" data-g="handleColor" role="radiogroup" aria-label="Цвет фурнитуры"></div>') +
      fieldset('Дополнительно', '<div class="opts" data-g="comfort"></div>');
    function paintColors() {
      var oc = D.outColor[S.outFinish]; if (!oc.some(function (c) { return c[0] === S.outColor; })) S.outColor = oc[0][0];
      swatches($('[data-g="outColor"]'), oc, 'outColor');
      var ic = D.inColor[S.inFinish]; if (!ic.some(function (c) { return c[0] === S.inColor; })) S.inColor = ic[0][0];
      swatches($('[data-g="inColor"]'), ic, 'inColor');
      $('#hintOut').textContent = find(D.outFinish, S.outFinish).hint;
    }
    radios($('[data-g="outFinish"]'), D.outFinish, 'outFinish'); radios($('[data-g="inFinish"]'), D.inFinish, 'inFinish');
    radios($('[data-g="size"]'), D.size, 'size'); radios($('[data-g="side"]'), D.side, 'side'); radios($('[data-g="swing"]'), D.swing, 'swing');
    packs($('[data-g="sec"]'), D.sec, 'sec'); packs($('[data-g="kit"]'), D.kit, 'kit');
    swatches($('[data-g="handleColor"]'), D.handleColor, 'handleColor'); checks($('[data-g="comfort"]'), D.comfort, 'comfort');
    paintColors();
    $('#totalSec').hidden = false;
    window.__money = function () {
      var s = D.base + find(D.outFinish, S.outFinish).p + find(D.inFinish, S.inFinish).p + find(D.size, S.size).p + find(D.sec, S.sec).p + find(D.kit, S.kit).p;
      S.comfort.forEach(function (id) { s += find(D.comfort, id).p; });
      return s;
    };
    window.__secLabel = function () { return find(D.sec, S.sec).lbl; };
    window.__summary = function () {
      var sz = S.size === 'custom' ? S.cw + '×' + S.ch : S.size.replace('x', '×');
      var p = [sz, find(D.outFinish, S.outFinish).t.toLowerCase() + ' снаружи', find(D.inFinish, S.inFinish).t.toLowerCase() + ' внутри',
               'взломостойкость ' + find(D.sec, S.sec).t.toLowerCase(), 'фурнитура ' + find(D.kit, S.kit).t.toLowerCase(),
               S.side === 'right' ? 'правая' : 'левая'];
      S.comfort.forEach(function (id) { p.push(find(D.comfort, id).t.toLowerCase()); });
      return p.join(', ');
    };
    window.__paintNames = function () {
      $$('.sw__name').forEach(function (el) {
        var g = el.dataset.for, list = g === 'outColor' ? D.outColor[S.outFinish] : g === 'inColor' ? D.inColor[S.inFinish] : D.handleColor;
        el.textContent = (list.filter(function (c) { return c[0] === S[g]; })[0] || list[0])[1];
      });
    };
    window.__onChange = function (el, g) { if (g === 'outFinish' || g === 'inFinish') paintColors(); if (g === 'size') $('#customSize').hidden = el.value !== 'custom'; };
    window.__note = function () { return 'цена двери без монтажа · срок ' + (S.outFinish === 'mass' ? '75–90' : '45–60') + ' дней'; };
  }

  /* ===== межкомнатная дверь ===== */
  function initInterior() {
    var vs = M.variants || [];
    D = {
      base: M.price,
      size: [{ id:'600x2000', t:'600 × 2000', p:0 }, { id:'700x2000', t:'700 × 2000', p:0 }, { id:'800x2000', t:'800 × 2000', p:0 }, { id:'900x2000', t:'900 × 2000', p:0 }, { id:'custom', t:'Свой размер', p:4900 }],
      side: [{ id:'right', t:'Правая', p:0 }, { id:'left', t:'Левая', p:0 }],
      frame: [{ id:'telescope', t:'Телескопический короб', p:0, d:'Наличник раздвигается под толщину стены — ставится в любой проём без доборов.' },
              { id:'coplanar', t:'Компланарная система', p:9800, d:'Полотно в уровень стены, без наличников. Красится вместе со стеной.' }],
      kit: [{ id:'std', t:'Стандартный', p:0, d:'Обычные петли, магнитная защёлка, ручка на розетке. Всё, что нужно, чтобы дверь работала.' },
            { id:'prem', t:'Премиум', p:12700, d:'Скрытые петли с регулировкой в трёх плоскостях, магнитный замок и ручка премиум-серии. Дверь садится в стену без единой видимой детали.' }],
      extra: [{ id:'mount', t:'Установка', p:4500 }, { id:'demo', t:'Демонтаж старой', p:1200 }, { id:'porog', t:'Порог или притвор', p:1900 }]
    };
    S = { variant: vs.length ? vs[0].f : '', size:'800x2000', cw:850, ch:2050, side:'right', frame:'telescope', kit:'std', extra:['mount'] };
    confBox.innerHTML =
      (vs.length ? fieldset('Отделка — ' + vs.length + ' ' + plural(vs.length, 'вариант', 'варианта', 'вариантов'),
        '<div class="vars">' + vs.map(function (v) { return '<label class="var"><input type="radio" name="variant" value="' + v.f + '"' + (S.variant === v.f ? ' checked' : '') + '><img loading="lazy" src="' + A.img(v.f) + '" alt=""><b>' + v.t + '</b></label>'; }).join('') + '</div>',
        '<p class="cf__hint">' + (M.cover ? 'Покрытие: ' + M.cover + '. ' : '') + 'Образец отделки привезём на замер.</p>') : '') +
      fieldset('Размер полотна', '<div class="opts" data-g="size"></div><div class="custom" id="customSize" hidden><label>Ширина, мм <input type="number" id="cw" value="850" min="400" max="1100" step="10"></label><label>Высота, мм <input type="number" id="ch" value="2050" min="1500" max="2300" step="10"></label></div>') +
      fieldset('Открывание', '<div class="opts" data-g="side"></div>') +
      fieldset('Проём', '<div class="packs" data-g="frame"></div>') +
      fieldset('Комплект фурнитуры', '<div class="packs" data-g="kit"></div>') +
      fieldset('Дополнительно', '<div class="opts" data-g="extra"></div>');
    radios($('[data-g="size"]'), D.size, 'size'); radios($('[data-g="side"]'), D.side, 'side');
    packs($('[data-g="frame"]'), D.frame, 'frame'); packs($('[data-g="kit"]'), D.kit, 'kit');
    checks($('[data-g="extra"]'), D.extra, 'extra');
    $('#totalSec').hidden = true;
    window.__money = function () {
      var s = D.base + find(D.size, S.size).p + find(D.frame, S.frame).p + find(D.kit, S.kit).p;
      S.extra.forEach(function (id) { s += find(D.extra, id).p; });
      return s;
    };
    window.__secLabel = null;
    window.__summary = function () {
      var v = vs.filter(function (x) { return x.f === S.variant; })[0];
      var sz = S.size === 'custom' ? S.cw + '×' + S.ch : S.size.replace('x', '×');
      var p = [v ? v.t.toLowerCase() : '', sz, find(D.frame, S.frame).t.toLowerCase(), 'фурнитура ' + find(D.kit, S.kit).t.toLowerCase(), S.side === 'right' ? 'правая' : 'левая'];
      S.extra.forEach(function (id) { p.push(find(D.extra, id).t.toLowerCase()); });
      return p.filter(Boolean).join(', ');
    };
    window.__paintNames = function () {};
    window.__onChange = function (el, g) {
      if (g === 'size') $('#customSize').hidden = el.value !== 'custom';
      if (g === 'variant') { for (var i = 0; i < shots.length; i++) if (shots[i].s === A.img(el.value)) { show(i); break; } }
    };
    window.__note = function () { return 'полотно и короб · срок 20–30 дней'; };
  }

  if (isMid) initInterior(); else initSteel();

  /* ---------- общее ---------- */
  function render() {
    window.__paintNames();
    $('#sum').textContent = fmt(window.__money());
    if (window.__secLabel) $('#secLbl').textContent = window.__secLabel();
    $('#sumNote').textContent = window.__note();
    var q = new URLSearchParams(); q.set('id', M.id);
    Object.keys(S).forEach(function (k) { var v = S[k]; if (Array.isArray(v)) { if (v.length) q.set(k, v.join('.')); } else q.set(k, v); });
    history.replaceState(null, '', '?' + q.toString());
  }
  (function readUrl() {
    var q = new URLSearchParams(location.search);
    Object.keys(S).forEach(function (k) {
      if (!q.has(k)) return;
      S[k] = Array.isArray(S[k]) ? q.get(k).split('.').filter(Boolean) : (typeof S[k] === 'number' ? +q.get(k) : q.get(k));
    });
    $$('input[type="radio"]', confBox).forEach(function (i) { if (S[i.name] === i.value) i.checked = true; });
    $$('input[type="checkbox"]', confBox).forEach(function (i) { i.checked = (S[i.name] || []).indexOf(i.value) > -1; });
    var cs = $('#customSize'); if (cs) cs.hidden = S.size !== 'custom';
    if (S.variant) for (var i = 0; i < shots.length; i++) if (shots[i].s === A.img(S.variant)) { show(i); break; }
  })();
  confBox.addEventListener('change', function (e) {
    var el = e.target, g = el.name; if (!g) return;
    if (el.type === 'checkbox') S[g] = $$('input[name="' + g + '"]:checked', confBox).map(function (i) { return i.value; });
    else { S[g] = el.value; window.__onChange(el, g); }
    render();
  });
  ['cw', 'ch'].forEach(function (id) { var el = $('#' + id); if (el) el.addEventListener('input', function () { S[id] = +this.value || S[id]; render(); }); });
  $('#share').addEventListener('click', function () {
    var btn = this;
    var done = function (ok) { btn.textContent = ok ? 'Ссылка скопирована' : location.href; setTimeout(function () { btn.textContent = 'Скопировать ссылку на сборку'; }, 2600); };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function () { done(true); }, function () { done(false); }); else done(false);
  });
  $('#toCart').addEventListener('click', function () {
    CART.add({ id: M.id, t: M.t, prev: A.prev(M, 440), price: window.__money(), conf: window.__summary(), brand: M.brand });
    location.href = 'korzina.html';
  });
  var similar = A.MODELS.filter(function (x) { return x.cat === M.cat && x.sub === M.sub && x.coll === M.coll && x.id !== M.id; }).slice(0, 4);
  if (similar.length < 4) similar = similar.concat(A.MODELS.filter(function (x) { return x.cat === M.cat && x.id !== M.id && similar.indexOf(x) < 0; }).slice(0, 4 - similar.length));
  renderCards($('#similar'), similar);
  render();
})();
