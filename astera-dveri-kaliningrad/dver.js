/* ==========================================================================
   Астера · карточка двери с конфигуратором
   Данные модели лежат в D — их и правит менеджер, когда приходит прайс.
   ========================================================================== */
(function () {
  'use strict';
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 1. Модель и её опции ---------- */
  var D = {
    name: 'Эссенс',
    base: 46900,          // полотно с коробом
    mount: 9600,          // установка и вывоз старой
    baseSec: 120,         // взломостойкость базовой сборки

    outFinish: [
      { id:'mdf',  t:'МДФ, эмаль',   p:0,     hint:'Ровный матовый цвет по RAL. Держит геометрию, не ведёт.' },
      { id:'oak',  t:'Шпон дуба',    p:11400, hint:'Живой рисунок, тонировка по вашему образцу.' },
      { id:'mass', t:'Массив дуба',  p:26800, hint:'Для дома и парадных входов. Срок дольше на две недели.' }
    ],
    outColor: {
      mdf:  [['graphite','Графит','#33393A'],['anthracite','Антрацит','#1F2427'],['warmgrey','Тёплый серый','#6B6A63'],['emerald','Изумрудный графит','#2C3A36'],['white','Белый','#DEDCD5']],
      oak:  [['nat','Дуб натуральный','#A9855C'],['mocha','Дуб мокко','#6F5540'],['grph','Дуб графит','#4A4442'],['wenge','Венге','#3A302B']],
      mass: [['gold','Дуб золотой','#B08A55'],['dark','Дуб тёмный','#5B4632'],['nut','Орех','#4E362A']]
    },

    pattern: [
      { id:'flat',   t:'Гладкое',            p:0 },
      { id:'lines',  t:'Вертикальные фрезы', p:3200 },
      { id:'panels', t:'Филёнки',            p:5400 },
      { id:'geo',    t:'Геометрия',          p:6900 }
    ],

    inFinish: [
      { id:'mdf',    t:'МДФ, эмаль',  p:0 },
      { id:'oak',    t:'Шпон дуба',   p:8900 },
      { id:'mirror', t:'С зеркалом',  p:14500 }
    ],
    inColor: {
      mdf:    [['white','Белый матовый','#E9E7E1'],['lgrey','Светло-серый','#C3C4BF'],['grph','Графит','#3A3F3E'],['milk','Дуб молочный','#D6C6AE']],
      oak:    [['nat','Дуб натуральный','#A9855C'],['milk','Дуб молочный','#D6C6AE'],['grph','Дуб графит','#4A4442']],
      mirror: [['silver','Зеркало серебро','#9FA6A5'],['smoke','Зеркало графит','#5A6160']]
    },

    size: [
      { id:'860x2050', t:'860 × 2050', p:0 },
      { id:'900x2050', t:'900 × 2050', p:0 },
      { id:'950x2100', t:'950 × 2100', p:0 },
      { id:'980x2100', t:'980 × 2100', p:0 },
      { id:'1000x2100',t:'1000 × 2100',p:0 },
      { id:'custom',   t:'Свой размер', p:7500 }
    ],
    side:  [ { id:'right', t:'Правая', p:0 }, { id:'left', t:'Левая', p:0 } ],
    swing: [ { id:'in', t:'Открывается внутрь', p:0 }, { id:'out', t:'Наружу', p:0 } ],

    pack: [
      { id:'base',  t:'Базовая', p:0, sec:0,
        d:'Два замка разных типов, броненакладка, глазок, два контура уплотнения.' },
      { id:'warm',  t:'Тепло +', p:14200, sec:60,
        d:'Терморазрыв по всему контуру, третий контур уплотнения, порог из нержавейки. Для первого этажа и торца дома.' },
      { id:'smart', t:'Умная',   p:38600, sec:120,
        d:'Электромеханический замок, вход по отпечатку и с телефона, подсветка притвора с датчиком движения, скрытый доводчик.' }
    ],

    handle: [
      { id:'lever',  t:'Нажимная',        p:0 },
      { id:'bar800', t:'Скоба 800 мм',    p:6400 },
      { id:'bar1200',t:'Скоба 1200 мм',   p:9800 }
    ],
    handleColor: [['black','Чёрный матовый','#23262A'],['bronze','Бронза','#7A5C36'],['steel','Нержавейка','#9BA2A3'],['brass','Латунь','#A98A4B']],

    casing:  [ { id:'casing', t:'Доборы и наличники', p:5900 } ],
    comfort: [
      { id:'plate',    t:'Номерок',            p:1400 },
      { id:'plateLit', t:'Номерок с подсветкой',p:3900 },
      { id:'closer',   t:'Скрытый доводчик',   p:6200 }
    ],
    security:[
      { id:'bolt',  t:'Задвижка изнутри',       p:3800,  sec:40 },
      { id:'armor', t:'Магнитная броненакладка',p:7400,  sec:60 },
      { id:'cyl',   t:'Цилиндр EVVA MCS',       p:12900, sec:100 }
    ]
  };

  var MAXSEC = D.baseSec + 120 + 40 + 60 + 100;

  /* ---------- 2. Состояние ---------- */
  var S = {
    outFinish:'mdf', outColor:'graphite', pattern:'lines',
    inFinish:'mdf',  inColor:'white',
    size:'900x2050', cw:880, ch:2090,
    side:'right', swing:'in',
    pack:'warm', handle:'bar800', handleColor:'black',
    casing:[], comfort:['plate'], security:['bolt']
  };

  var fmt = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  var find = function (arr, id) { for (var i=0;i<arr.length;i++) if (arr[i].id===id) return arr[i]; return arr[0]; };

  /* ---------- 3. Отрисовка полей ---------- */
  function radios(box, list, group) {
    box.innerHTML = list.map(function (o) {
      return '<label><input type="radio" name="'+group+'" value="'+o.id+'"'+
             (S[group]===o.id?' checked':'')+'><span>'+o.t+
             (o.p?' <i>+'+fmt(o.p)+' ₽</i>':'')+'</span></label>';
    }).join('');
  }
  function checks(box, list, group) {
    box.innerHTML = list.map(function (o) {
      return '<label><input type="checkbox" name="'+group+'" value="'+o.id+'"'+
             (S[group].indexOf(o.id)>-1?' checked':'')+'><span>'+o.t+
             ' <i>+'+fmt(o.p)+' ₽'+(o.sec?' · +'+o.sec:'')+'</i></span></label>';
    }).join('');
  }
  function swatches(box, list, group) {
    box.innerHTML = list.map(function (c) {
      return '<label title="'+c[1]+'"><input type="radio" name="'+group+'" value="'+c[0]+'"'+
             (S[group]===c[0]?' checked':'')+'><i style="background:'+c[2]+'"></i></label>';
    }).join('') + '<b class="sw__name" data-for="'+group+'"></b>';
  }
  /* подпись выбранного цвета — отдельной строкой под образцами */
  function paintNames() {
    $$('.sw__name').forEach(function (el) {
      var g = el.dataset.for;
      var list = g === 'outColor' ? D.outColor[S.outFinish]
               : g === 'inColor'  ? D.inColor[S.inFinish] : D.handleColor;
      for (var i = 0; i < list.length; i++) {
        if (list[i][0] === S[g]) { el.textContent = list[i][1]; return; }
      }
      el.textContent = '';
    });
  }
  function packs(box) {
    box.innerHTML = D.pack.map(function (o) {
      return '<label class="pack"><input type="radio" name="pack" value="'+o.id+'"'+
             (S.pack===o.id?' checked':'')+'>'+
             '<span class="pack__b"><b>'+o.t+'</b>'+
             '<em>'+(o.p?'+'+fmt(o.p)+' ₽':'в базе')+(o.sec?' · взлом +'+o.sec:'')+'</em>'+
             '<i>'+o.d+'</i></span></label>';
    }).join('');
  }

  function paintColorGroups() {
    var oc = D.outColor[S.outFinish];
    if (!oc.some(function(c){return c[0]===S.outColor;})) S.outColor = oc[0][0];
    swatches($('[data-g="outColor"]'), oc, 'outColor');
    var ic = D.inColor[S.inFinish];
    if (!ic.some(function(c){return c[0]===S.inColor;})) S.inColor = ic[0][0];
    swatches($('[data-g="inColor"]'), ic, 'inColor');
    $('#hintOut').textContent = find(D.outFinish, S.outFinish).hint;
  }

  function build() {
    radios($('[data-g="outFinish"]'), D.outFinish, 'outFinish');
    radios($('[data-g="pattern"]'),   D.pattern,   'pattern');
    radios($('[data-g="inFinish"]'),  D.inFinish,  'inFinish');
    radios($('[data-g="size"]'),      D.size,      'size');
    radios($('[data-g="side"]'),      D.side,      'side');
    radios($('[data-g="swing"]'),     D.swing,     'swing');
    radios($('[data-g="handle"]'),    D.handle,    'handle');
    swatches($('[data-g="handleColor"]'), D.handleColor, 'handleColor');
    packs($('[data-g="pack"]'));
    checks($('[data-g="casing"]'),   D.casing,   'casing');
    checks($('[data-g="comfort"]'),  D.comfort,  'comfort');
    checks($('[data-g="security"]'), D.security, 'security');
    paintColorGroups();
  }

  /* ---------- 4. Цена и взломостойкость ---------- */
  function money() {
    var s = D.base + D.mount;
    s += find(D.outFinish, S.outFinish).p;
    s += find(D.pattern,   S.pattern).p;
    s += find(D.inFinish,  S.inFinish).p;
    s += find(D.size,      S.size).p;
    s += find(D.pack,      S.pack).p;
    s += find(D.handle,    S.handle).p;
    ['casing','comfort','security'].forEach(function (g) {
      S[g].forEach(function (id) { s += find(D[g], id).p; });
    });
    return s;
  }
  function secure() {
    var v = D.baseSec + find(D.pack, S.pack).sec;
    S.security.forEach(function (id) { v += find(D.security, id).sec; });
    return v;
  }

  /* ---------- 5. Рисунок двери ---------- */
  function colorOf(group, id) {
    var list = group === 'out' ? D.outColor[S.outFinish]
             : group === 'in'  ? D.inColor[S.inFinish] : D.handleColor;
    for (var i=0;i<list.length;i++) if (list[i][0]===id) return list[i][2];
    return list[0][2];
  }
  function sizePair() {
    if (S.size === 'custom') return [S.cw, S.ch];
    var p = S.size.split('x'); return [+p[0], +p[1]];
  }

  function drawPattern(x, w, y, h) {
    var g = '';
    if (S.pattern === 'lines') {
      for (var i = x + 16; i < x + w - 10; i += 15)
        g += '<rect x="'+i+'" y="'+(y+16)+'" width="2" height="'+(h-32)+'" fill="#000" opacity=".26"/>'+
             '<rect x="'+(i+2)+'" y="'+(y+16)+'" width="1.5" height="'+(h-32)+'" fill="#fff" opacity=".10"/>';
    } else if (S.pattern === 'panels') {
      [0,1,2].forEach(function (n) {
        var ph = (h - 64) / 3, py = y + 24 + n * (ph + 8);
        g += '<rect x="'+(x+26)+'" y="'+py+'" width="'+(w-52)+'" height="'+(ph-8)+
             '" fill="none" stroke="#000" stroke-opacity=".3" stroke-width="3"/>'+
             '<rect x="'+(x+30)+'" y="'+(py+4)+'" width="'+(w-60)+'" height="'+(ph-16)+
             '" fill="none" stroke="#fff" stroke-opacity=".09" stroke-width="1.5"/>';
      });
    } else if (S.pattern === 'geo') {
      [[0,.34],[.40,.22],[.66,.30]].forEach(function (b) {
        var by = y + 20 + b[0] * (h - 40), bh = b[1] * (h - 40);
        g += '<rect x="'+(x+22)+'" y="'+by+'" width="'+(w-44)+'" height="'+bh+
             '" fill="#000" opacity=".16"/>'+
             '<rect x="'+(x+22)+'" y="'+by+'" width="'+(w-44)+'" height="2" fill="#fff" opacity=".12"/>';
      });
    }
    return g;
  }

  function drawHandle(x, w, y, h) {
    var c = colorOf('h', S.handleColor);
    var right = S.side === 'right';
    var hx = right ? x + w - 26 : x + 26;      // ручка со стороны, противоположной петлям
    var g = '';
    if (S.handle === 'lever') {
      g += '<rect x="'+(hx-16)+'" y="'+(y+h*0.46)+'" width="32" height="86" rx="2" fill="'+c+'" opacity=".92"/>';
      g += '<rect x="'+(right?hx-46:hx+14)+'" y="'+(y+h*0.46+30)+'" width="34" height="7" rx="3.5" fill="'+c+'"/>';
    } else {
      var bh = S.handle === 'bar1200' ? h * 0.56 : h * 0.38;
      var by = y + (h - bh) / 2;
      g += '<rect x="'+(hx-4)+'" y="'+by+'" width="8" height="'+bh+'" rx="4" fill="'+c+'"/>';
      g += '<rect x="'+(hx-4)+'" y="'+by+'" width="3" height="'+bh+'" rx="1.5" fill="#fff" opacity=".2"/>';
      g += '<rect x="'+(hx-7)+'" y="'+(by-9)+'" width="14" height="9" rx="2" fill="'+c+'" opacity=".8"/>';
      g += '<rect x="'+(hx-7)+'" y="'+(by+bh)+'" width="14" height="9" rx="2" fill="'+c+'" opacity=".8"/>';
    }
    return g;
  }

  function draw() {
    var sz = sizePair();
    var lw = Math.max(232, Math.min(292, 232 + (sz[0] - 860) * 0.42));
    var lx = (320 - lw) / 2, ly = 28, lh = 608;

    $('#dFrame').setAttribute('x', lx - 14);
    $('#dFrame').setAttribute('width', lw + 28);
    $('#dLeafBase').setAttribute('x', lx);
    $('#dLeafBase').setAttribute('width', lw);
    $('#dLeaf').querySelector('rect:last-child').setAttribute('x', lx);
    $('#dLeaf').querySelector('rect:last-child').setAttribute('width', lw);
    $('#dLeafBase').setAttribute('fill', colorOf('out', S.outColor));
    $('#dFrame').setAttribute('fill', S.pack === 'smart' ? '#202523' : '#2A2F2E');

    $('#dPattern').innerHTML = drawPattern(lx, lw, ly, lh);
    $('#dHandle').innerHTML  = drawHandle(lx, lw, ly, lh);

    var eye = $('#dEye');
    eye.setAttribute('cx', lx + lw / 2);
    eye.style.display = S.pack === 'smart' ? 'none' : '';

    /* у SVG-элементов нет свойства hidden — только атрибут */
    var plate = $('#dPlate');
    var hasPlate = S.comfort.indexOf('plate') > -1 || S.comfort.indexOf('plateLit') > -1;
    plate.toggleAttribute('hidden', !hasPlate);
    if (hasPlate) plate.setAttribute('transform', 'translate(' + (lx + lw / 2 - 160) + ',0)');

    var glow = $('#dGlow');
    var lit = S.pack === 'smart' || S.comfort.indexOf('plateLit') > -1;
    glow.toggleAttribute('hidden', !lit);
    if (lit) {
      var gx = S.side === 'right' ? lx - 9 : lx + lw + 1;
      glow.setAttribute('x', gx); glow.setAttribute('y', ly);
      glow.setAttribute('width', 8); glow.setAttribute('height', lh);
    }

    var cas = $('#dCasing'), hasCas = S.casing.indexOf('casing') > -1;
    cas.toggleAttribute('hidden', !hasCas);
    if (hasCas) cas.querySelector('rect').setAttribute('stroke', colorOf('in', S.inColor));

    $('#fSize').textContent  = sz[0] + ' × ' + sz[1];
    $('#fSide').textContent  = (S.side === 'right' ? 'правая' : 'левая') + ', ' + (S.swing === 'in' ? 'внутрь' : 'наружу');
    $('#fThick').textContent = S.pack === 'base' ? '80 мм' : (S.pack === 'warm' ? '90 мм' : '105 мм');
  }

  /* ---------- 6. Сводка ---------- */
  function summary() {
    var sz = sizePair();
    var parts = [
      D.name,
      sz[0] + '×' + sz[1],
      find(D.outFinish, S.outFinish).t.toLowerCase(),
      find(D.pattern, S.pattern).t.toLowerCase(),
      'комплектация «' + find(D.pack, S.pack).t + '»',
      find(D.handle, S.handle).t.toLowerCase(),
      (S.side === 'right' ? 'правая' : 'левая')
    ];
    if (S.casing.length) parts.push('с доборами');
    S.comfort.forEach(function (id) { parts.push(find(D.comfort, id).t.toLowerCase()); });
    S.security.forEach(function (id) { parts.push(find(D.security, id).t.toLowerCase()); });
    return parts.join(', ') + ' — ' + fmt(money()) + ' ₽';
  }

  function render() {
    draw();
    paintNames();
    $('#sum').textContent = fmt(money());
    var v = secure();
    $('#secNum').textContent = v;
    $('#secMax').textContent = MAXSEC;
    $('#secBar').style.width = Math.round(v / MAXSEC * 100) + '%';
    $('#sumNote').textContent = 'с установкой и вывозом старой двери · срок ' +
      (S.outFinish === 'mass' ? '25–35' : S.pack === 'smart' ? '18–25' : '10–18') + ' дней';
    $('#ospec').value = summary();
    writeUrl();
  }

  /* ---------- 7. Сборка в ссылке ---------- */
  function writeUrl() {
    var q = new URLSearchParams();
    ['outFinish','outColor','pattern','inFinish','inColor','size','side','swing','pack','handle','handleColor']
      .forEach(function (k) { q.set(k, S[k]); });
    if (S.size === 'custom') { q.set('cw', S.cw); q.set('ch', S.ch); }
    ['casing','comfort','security'].forEach(function (k) { if (S[k].length) q.set(k, S[k].join('.')); });
    history.replaceState(null, '', '?' + q.toString());
  }
  function readUrl() {
    var q = new URLSearchParams(location.search);
    if (![].slice.call(q.keys()).length) return;
    ['outFinish','outColor','pattern','inFinish','inColor','size','side','swing','pack','handle','handleColor']
      .forEach(function (k) { if (q.get(k)) S[k] = q.get(k); });
    if (q.get('cw')) S.cw = +q.get('cw');
    if (q.get('ch')) S.ch = +q.get('ch');
    ['casing','comfort','security'].forEach(function (k) { S[k] = q.get(k) ? q.get(k).split('.') : []; });
  }

  /* ---------- 8. Связывание ---------- */
  var form = $('#conf');
  form.addEventListener('change', function (e) {
    var el = e.target, g = el.name;
    if (!g) return;
    if (el.type === 'checkbox') {
      S[g] = $$('input[name="' + g + '"]:checked', form).map(function (i) { return i.value; });
    } else {
      S[g] = el.value;
      if (g === 'outFinish' || g === 'inFinish') paintColorGroups();
      if (g === 'size') $('#customSize').hidden = el.value !== 'custom';
    }
    render();
  });
  ['cw','ch'].forEach(function (id) {
    $('#' + id).addEventListener('input', function () { S[id] = +this.value || S[id]; render(); });
  });

  $('#share').addEventListener('click', function () {
    var btn = this;
    var done = function (ok) {
      btn.textContent = ok ? 'Ссылка скопирована' : location.href;
      setTimeout(function () { btn.textContent = 'Скопировать ссылку на сборку'; }, 2600);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(function(){done(true);}, function(){done(false);});
    else done(false);
  });

  $('#toOrder').addEventListener('click', function () {
    $('#zayavka').scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(function () { $('#oname').focus(); }, 500);
  });

  var ph = $('#ophone');
  ph.addEventListener('input', function () {
    var d = ph.value.replace(/\D/g, '');
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 5) out += ') ' + d.slice(4, 7);
    if (d.length >= 8) out += '-' + d.slice(7, 9);
    if (d.length >= 10) out += '-' + d.slice(9, 11);
    ph.value = out;
  });
  $('#orderForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#oname'), ok = true;
    [[name, name.value.trim().length >= 2], [ph, ph.value.replace(/\D/g, '').length === 11]]
      .forEach(function (p) {
        var bad = !p[1];
        p[0].closest('.field').classList.toggle('is-bad', bad);
        if (bad && ok) { p[0].focus(); ok = false; }
      });
    if (!ok) return;
    /* TODO: отправка — сюда же уходит поле «Ваша сборка». См. README.md */
    $$('.field, .form__foot', this).forEach(function (el) { el.hidden = true; });
    $('#orderOk').hidden = false;
  });

  readUrl();
  build();
  $('#customSize').hidden = S.size !== 'custom';
  render();
})();
