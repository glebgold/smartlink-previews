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
  var pd = $('#pDesc'); if (pd) pd.remove();
  $('#pSpec').innerHTML = Object.keys(M.spec || {}).map(function (k) {
    return M.spec[k] ? '<div><dt>' + k + '</dt><dd>' + M.spec[k] + '</dd></div>' : ''; }).join('');

  /* ---------- галерея ---------- */
  var main = $('#galMain'), mainImg = $('#galImg'), thumbs = $('#galThumbs'), cap = $('#galCap');
  var shots = isMid
    ? (M.variants || []).map(function (v) { return { s: A.img(v.f), t: v.t, cover: false }; })
    /* крупные кадры фабрики (A.gal) не показываем: на части из них остались номера домов и клейма */
    : [{ s: A.prev(M, 900), t: 'Полотно', cover: false },
       { s: A.hero(M), t: 'В проёме', cover: true, keep: true },
       { s: A.heroM(M), t: 'Вблизи', cover: true, keep: true }];
  function show(i) {
    var sh = shots[i]; if (!sh) return;
    window.__shotIndex = i;
    mainImg.src = sh.s; mainImg.alt = sh.t; cap.textContent = sh.t;
    main.classList.toggle('gal__main--cover', !!sh.cover);
    $$('.gal__t', thumbs).forEach(function (b, n) { b.classList.toggle('is-on', n === i); });
  }
  function drawThumbs() {
    thumbs.innerHTML = shots.map(function (sh, i) {
      return '<button type="button" class="gal__t" data-i="' + i + '" aria-label="' + sh.t + '"><img loading="lazy" src="' + sh.s + '" alt=""></button>';
    }).join('');
  }
  drawThumbs();
  thumbs.addEventListener('click', function (e) { var b = e.target.closest('.gal__t'); if (b) show(+b.dataset.i); });
  show(0);
  /* картинка двери пересобирается на лету при выборе отделки */
  window.__refreshShots = function () {
    if (!window.__view) return;
    var live = window.__view();
    if (!live.length) return;
    var keep = shots.filter(function (x) { return x.keep; });
    shots = live.concat(keep);
    var i = Math.min(window.__shotIndex || 0, shots.length - 1);
    drawThumbs(); show(i);
  };

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

  /* ===== входная дверь: конфигуратор на данных фабрики ===== */
  function initSteel() {
    var CFG = window.DOORCFG || null;
    var C = CFG && CFG.m[M.id];
    if (!C) { initSteelFallback(); return; }
    var PAN = CFG.pan, EQ = CFG.eq, SZ = CFG.sz, OP = CFG.op;
    var eqList = C.eq.map(function (i) { return EQ[i]; });
    var szList = C.sz.map(function (i) { return SZ[i]; });
    var opList = C.op.map(function (i) { return OP[i]; });
    var panList = C.pan.map(function (i) { return PAN[i]; });
    var MAXSEC = 100;

    S = { ext: 0, pan: 0, inc: 0, eq: 0, sz: 0, side: 'right', swing: 'in', op: [], cw: 900, ch: 2050 };
    /* стартуем с размера, похожего на типовой */
    var prefer = ['900x2050', '860x2050', '900x2100', '950x2100'];
    for (var pi = 0; pi < prefer.length; pi++) {
      var hit = -1;
      szList.forEach(function (z, i) { if (z.n === prefer[pi] && hit < 0) hit = i; });
      if (hit > -1) { S.sz = hit; break; }
    }

    function money(n) { return fmt(n); }
    function curExt() { return C.ext[S.ext] || C.ext[0]; }
    function curPan() { return panList[S.pan] || panList[0]; }
    function curInc() { var p = curPan(); return p && (p.c[S.inc] || p.c[0]); }
    function curEq() { return eqList[S.eq] || eqList[0]; }

    window.__money = function () {
      var s = (curEq() ? curEq().p : M.price) + (curExt() ? curExt().p : 0) + (curInc() ? curInc().p : 0);
      S.op.forEach(function (i) { s += opList[i].p; });
      return s;
    };
    window.__secure = function () {
      var v = curEq() ? curEq().sec : 0;
      S.op.forEach(function (i) { v = Math.max(v, opList[i].sec || 0); });
      return Math.min(MAXSEC, v);
    };
    window.__secLabel = function () {
      var v = window.__secure();
      return v >= 95 ? 'Максимальная' : v >= 80 ? 'Повышенная' : v >= 60 ? 'Усиленная' : 'Стандартная';
    };
    window.__note = function () {
      var d = curExt() && curExt().d ? curExt().d : 45;
      return 'цена двери без монтажа · срок ' + d + '–' + (d + 15) + ' дней';
    };
    window.__summary = function () {
      var p = [szList[S.sz] ? szList[S.sz].n.replace('x', '×') : '', curExt() ? curExt().n.toLowerCase() + ' снаружи' : '',
               curInc() ? curInc().n.toLowerCase() + ' внутри' : '', curEq() ? 'комплектация «' + curEq().n.toLowerCase() + '»' : '',
               S.side === 'right' ? 'правая' : 'левая'];
      S.op.forEach(function (i) { p.push(opList[i].n.toLowerCase()); });
      return p.filter(Boolean).join(', ');
    };
    window.__paintNames = function () {};

    /* ---------- разметка ---------- */
    var sideList = [{ id: 'right', t: 'Правая' }, { id: 'left', t: 'Левая' }];
    var swingList = [{ id: 'in', t: 'Внутрь' }, { id: 'out', t: 'Наружу' }];
    confBox.innerHTML =
      fieldset('Отделка снаружи — ' + C.ext.length + ' ' + plural(C.ext.length, 'вариант', 'варианта', 'вариантов'),
        '<div class="sw sw--big" data-g="ext" role="radiogroup" aria-label="Отделка снаружи"></div><p class="cf__hint" id="hExt"></p>') +
      (panList.length ? fieldset('Полотно со стороны квартиры',
        '<div class="opts" data-g="pan"></div><div class="sw sw--big" data-g="inc" role="radiogroup" aria-label="Отделка внутри"></div><p class="cf__hint" id="hInc"></p>') : '') +
      fieldset('Комплектация', '<div class="packs" data-g="eq"></div>') +
      fieldset('Размер двери', '<div class="opts opts--sz" data-g="sz"></div>') +
      fieldset('Открывание', '<div class="opts" data-g="side"></div><div class="opts" data-g="swing" style="margin-top:9px"></div>') +
      (opList.length ? fieldset('Дополнительно', '<div class="opts" data-g="op"></div>') : '');

    function swatchList(box, list, group, cur) {
      box.innerHTML = list.map(function (o, i) {
        var img = o.s ? A.IMG + o.s + '.webp' : '';
        return '<label title="' + o.n + '"><input type="radio" name="' + group + '" value="' + i + '"' + (cur === i ? ' checked' : '') + '>' +
          (img ? '<i style="background-image:url(' + img + ')"></i>' : '<i></i>') + '</label>';
      }).join('');
    }
    function paint() {
      swatchList($('[data-g="ext"]'), C.ext, 'ext', S.ext);
      $('#hExt').textContent = curExt() ? curExt().n + (curExt().p ? ' · +' + money(curExt().p) + ' ₽' : '') : '';
      if (panList.length) {
        $('[data-g="pan"]').innerHTML = panList.map(function (p, i) {
          return '<label><input type="radio" name="pan" value="' + i + '"' + (S.pan === i ? ' checked' : '') + '><span>' + p.n + '</span></label>';
        }).join('');
        swatchList($('[data-g="inc"]'), curPan().c, 'inc', S.inc);
        $('#hInc').textContent = curInc() ? curInc().n + (curInc().p ? ' · +' + money(curInc().p) + ' ₽' : '') : '';
      }
      $('[data-g="eq"]').innerHTML = eqList.map(function (e, i) {
        return '<label class="pack"><input type="radio" name="eq" value="' + i + '"' + (S.eq === i ? ' checked' : '') +
          '><span class="pack__b"><b>' + e.n + '</b><em>' + money(e.p) + ' ₽</em><i>' + e.d + '</i></span></label>';
      }).join('');
      $('[data-g="sz"]').innerHTML = szList.map(function (z, i) {
        return '<label><input type="radio" name="sz" value="' + i + '"' + (S.sz === i ? ' checked' : '') + '><span>' + z.n.replace('x', ' × ') + '</span></label>';
      }).join('');
      radios($('[data-g="side"]'), sideList.map(function (x) { return { id: x.id, t: x.t, p: 0 }; }), 'side');
      radios($('[data-g="swing"]'), swingList.map(function (x) { return { id: x.id, t: x.t, p: 0 }; }), 'swing');
      if (opList.length) {
        $('[data-g="op"]').innerHTML = opList.map(function (o, i) {
          return '<label><input type="checkbox" name="op" value="' + i + '"' + (S.op.indexOf(i) > -1 ? ' checked' : '') +
            '><span>' + o.n + ' <i>+' + money(o.p) + ' ₽</i></span></label>';
        }).join('');
      }
    }
    paint();
    $('#totalSec').hidden = false;

    /* картинка двери меняется вместе с выбором */
    window.__view = function () {
      var out = curExt() && curExt().i, inn = curInc() && curInc().i;
      var list = [];
      if (out) list.push({ s: A.IMG + out + '.webp', t: 'Снаружи: ' + curExt().n, cover: false });
      if (inn) list.push({ s: A.IMG + inn + '.webp', t: 'Внутри: ' + curInc().n, cover: false });
      return list;
    };
    window.__onChange = function (el, g) {
      if (g === 'pan') { S.inc = 0; }
      if (g === 'ext' || g === 'pan' || g === 'inc') paint();
      if (['ext', 'pan', 'inc'].indexOf(g) > -1) window.__refreshShots();
    };
  }

  /* запасной конфигуратор, если данных по модели нет */
  function initSteelFallback() {
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
      kit: [{ id:'std', t:'Стандартная', p:0, d:'Два контура уплотнения по периметру и минеральная плита в полотне. Отсекает разговоры на площадке и шум лифта.' },
            { id:'plus', t:'Усиленная', p:38000, d:'Третий контур уплотнения, двойной слой минеральной плиты и порог с отсечкой. Тише примерно вдвое, берут на первые этажи и к лифту.' },
            { id:'max', t:'Максимальная', p:76000, d:'Четыре контура, комбинированный наполнитель и виброразвязка полотна. Для квартир у шахты лифта, мусоропровода и над въездом в паркинг.' }],
      handleColor: [['black','Чёрный матовый','#23262A'],['bronze','Бронза','#7A5C36'],['steel','Нержавейка','#9BA2A3'],['brass','Латунь','#A98A4B']],
      comfort: [{ id:'casing', t:'Доборы и наличники', p:19000 }, { id:'plate', t:'Номерок на дверь', p:6500 }, { id:'closer', t:'Скрытый доводчик', p:21000 }]
    };
    S = { outFinish:'mdf', outColor:'graphite', inFinish:'mdf', inColor:'white', size:'900x2050', cw:880, ch:2090,
          side:'right', swing:'in', sec:'std', kit:'std', comfort:[] };
    confBox.innerHTML =
      fieldset('Отделка с улицы', '<div class="opts" data-g="outFinish"></div><div class="sw" data-g="outColor" role="radiogroup" aria-label="Цвет снаружи"></div><p class="cf__hint" id="hintOut"></p>') +
      fieldset('Отделка внутри, со стороны квартиры', '<div class="opts" data-g="inFinish"></div><div class="sw" data-g="inColor" role="radiogroup" aria-label="Цвет внутри"></div>') +
      fieldset('Размер двери', '<div class="opts" data-g="size"></div><div class="custom" id="customSize" hidden><label>Ширина, мм <input type="number" id="cw" value="880" min="600" max="1400" step="10"></label><label>Высота, мм <input type="number" id="ch" value="2090" min="1800" max="2600" step="10"></label></div>') +
      fieldset('Открывание', '<div class="opts" data-g="side"></div><div class="opts" data-g="swing" style="margin-top:9px"></div>') +
      fieldset('Взломостойкость', '<div class="packs" data-g="sec"></div>') +
      fieldset('Шумоизоляция', '<div class="packs" data-g="kit"></div>') +
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
    checks($('[data-g="comfort"]'), D.comfort, 'comfort');
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
               'взломостойкость ' + find(D.sec, S.sec).t.toLowerCase(), 'шумоизоляция ' + find(D.kit, S.kit).t.toLowerCase(),
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
      kit: [{ id:'std', t:'Стандартная', p:0, d:'Сотовый наполнитель и притвор по периметру. Для комнат, где хватает обычной двери.' },
            { id:'plus', t:'Усиленная', p:6900, d:'Массив внутри полотна и уплотнитель по контуру. Берут в спальню, детскую и кабинет.' }],
      extra: [{ id:'mount', t:'Установка', p:4500 }, { id:'demo', t:'Демонтаж старой', p:1200 }, { id:'porog', t:'Порог или притвор', p:1900 }]
    };
    S = { variant: vs.length ? vs[0].f : '', size:'800x2000', cw:850, ch:2050, side:'right', frame:'telescope', kit:'std', extra:['mount'] };
    confBox.innerHTML =
      (vs.length ? fieldset('Отделка — ' + vs.length + ' ' + plural(vs.length, 'вариант', 'варианта', 'вариантов'),
        '<div class="vars">' + vs.map(function (v) { return '<label class="var"><input type="radio" name="variant" value="' + v.f + '"' + (S.variant === v.f ? ' checked' : '') + '><img loading="lazy" src="' + A.img(v.f) + '" alt=""><b>' + v.t + '</b></label>'; }).join('') + '</div>',
        '<p class="cf__hint">' + (M.cover ? 'Покрытие: ' + M.cover + '. ' : '') + 'Образец отделки привезём на замер.</p>') : '') +
      fieldset('Размер полотна', '<div class="opts" data-g="size"></div><div class="custom" id="customSize" hidden><label>Ширина, мм <input type="number" id="cw" value="850" min="400" max="1100" step="10"></label><label>Высота, мм <input type="number" id="ch" value="2050" min="1500" max="2300" step="10"></label></div>') +
      fieldset('Открывание', '<div class="opts" data-g="side"></div>') +
      fieldset('Короб', '<div class="packs" data-g="frame"></div>') +
      fieldset('Шумоизоляция', '<div class="packs" data-g="kit"></div>') +
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
      var p = [v ? v.t.toLowerCase() : '', sz, find(D.frame, S.frame).t.toLowerCase(), 'шумоизоляция ' + find(D.kit, S.kit).t.toLowerCase(), S.side === 'right' ? 'правая' : 'левая'];
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
  if (window.__refreshShots) window.__refreshShots();

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
