/* ==========================================================================
   Ростислав · двери в Калининграде — поведение страницы
   ========================================================================== */
(function () {
  'use strict';

  var slow = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Шапка: фон после первого экрана + активный раздел ---------- */
  var hdr = $('#hdr');
  var onScroll = function () {
    hdr.classList.toggle('is-stuck', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var navLinks = $$('.nav a');
  var targets = navLinks
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  if (targets.length && 'IntersectionObserver' in window) {
    var navObs = new IntersectionObserver(function (rows) {
      rows.forEach(function (row) {
        if (!row.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-here', a.getAttribute('href') === '#' + row.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    targets.forEach(function (t) { navObs.observe(t); });
  }

  /* ---------- Появление блоков при скролле ---------- */
  if ('IntersectionObserver' in window && !slow) {
    var risers = $$('.band:not(.hero) .h-l, .band:not(.hero) .say, .card, .steps li, .work, .rev, .notice, .calc, .about, .form, .cut__scale');
    risers.forEach(function (el, i) {
      el.setAttribute('data-rise', '');
      el.style.transitionDelay = (Math.min(i % 6, 5) * 55) + 'ms';
    });
    var riseObs = new IntersectionObserver(function (rows) {
      rows.forEach(function (row) {
        if (!row.isIntersecting) return;
        row.target.classList.add('in');
        riseObs.unobserve(row.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    risers.forEach(function (el) { riseObs.observe(el); });
  }

  /* ==========================================================================
     РАЗРЕЗ — послойная анатомия полотна
     ========================================================================== */
  var LAYERS = [
    {
      t: 'Два контура уплотнения',
      d: 'резина по притвору и по коробу',
      p: 'Самая дешёвая деталь двери и первая причина, по которой из-под неё дует. Два контура вместо одного убирают сквозняк по полу и запах из подъезда. Побочный эффект приятный: дверь перестаёт хлопать — она закрывается одной рукой и садится в короб мягко.'
    },
    {
      t: 'Стальной лист, 1,5 мм',
      d: 'цельногнутый профиль, без сварных углов',
      p: 'Полтора миллиметра — рабочая толщина для квартиры. Важнее цифры то, что лист гнут, а не сварен по углам: у сварной коробки шов со временем ведёт, и дверь начинает цеплять. Здесь ломаться нечему.'
    },
    {
      t: 'Рёбра жёсткости',
      d: '4 вертикальных · 2 горизонтальных',
      p: 'Каркас внутри полотна. Без него монтажная пена при установке выгибает дверь наружу — не сразу, а за пару недель, когда вы уже расплатились. С рёбрами геометрия остаётся той же, что на замере.'
    },
    {
      t: 'Минеральная вата, 80 мм',
      d: 'базальт · плотность 100 кг/м³',
      p: 'Не поролон и не гофрокартон, которые лежат внутри двери за пятнадцать тысяч. Базальтовая плита не садится за пять лет, не горит и глушит лестницу на 34 децибела — это разница между «слышно, как соседи разговаривают» и «слышно, что кто-то есть».'
    },
    {
      t: 'Терморазрыв',
      d: 'полимерная вставка по всему контуру',
      p: 'Сталь проводит холод насквозь: без разрыва внутренняя сторона двери зимой запотевает, а по краю намерзает иней. Полимерная вставка рвёт этот мостик. Для квартиры — желательно, для двери на улицу — обязательно.'
    },
    {
      t: 'МДФ-накладка, 16 мм',
      d: 'фрезеровка по эскизу',
      p: 'То, что вы видите со стороны прихожей. Шестнадцать миллиметров держат форму во влажном воздухе и не ведут, в отличие от шестимиллиметровой накладки, которая через год начинает выгибаться у порога.'
    },
    {
      t: 'Шпон дуба, 0,6 мм',
      d: 'тонировка по образцу · 3 слоя матового лака',
      p: 'Настоящее дерево, а не плёнка с рисунком дерева. Рисунок живой, у каждой двери свой, и его можно подобрать под пол или под межкомнатные. Тонировку делаем по вашему образцу — привезите на замер кусок ламината.'
    }
  ];

  var stack = $('.cut__stack');
  if (stack) {
    var tabs   = $$('.cut__l', stack);
    var items  = $$('.cut__list li');
    var elNo   = $('#cutNo'), elTtl = $('#cutTtl'), elDim = $('#cutDim'), elTxt = $('#cutTxt');

    var pick = function (i, focus) {
      var L = LAYERS[i];
      if (!L) return;
      tabs.forEach(function (b, n) {
        var on = n === i;
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.tabIndex = on ? 0 : -1;
        b.style.setProperty('--f', on ? (+b.dataset.base * 1.22) : b.dataset.base);
      });
      items.forEach(function (li, n) { li.classList.toggle('is-on', n === i); });
      elNo.textContent  = ('0' + (i + 1)).slice(-2);
      elTtl.textContent = L.t;
      elDim.textContent = L.d;
      elTxt.textContent = L.p;
      if (focus) tabs[i].focus();
    };

    tabs.forEach(function (b, i) {
      b.dataset.base = getComputedStyle(b).getPropertyValue('--f').trim() || '10';
      b.setAttribute('aria-label', LAYERS[i].t);
      b.addEventListener('click', function () { pick(i); });
      b.addEventListener('keydown', function (e) {
        var k = e.key, n = null;
        if (k === 'ArrowRight' || k === 'ArrowDown') n = (i + 1) % tabs.length;
        if (k === 'ArrowLeft'  || k === 'ArrowUp')   n = (i - 1 + tabs.length) % tabs.length;
        if (k === 'Home') n = 0;
        if (k === 'End')  n = tabs.length - 1;
        if (n === null) return;
        e.preventDefault();
        pick(n, true);
      });
    });
    items.forEach(function (li, i) {
      li.addEventListener('click', function () { pick(i); });
    });

    pick(3);

    /* слои расходятся, когда разрез попадает в кадр */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (rows, obs) {
        rows.forEach(function (row) {
          if (!row.isIntersecting) return;
          stack.classList.add('is-open');
          obs.disconnect();
        });
      }, { threshold: 0.35 }).observe(stack);
    } else {
      stack.classList.add('is-open');
    }
  }

  /* ==========================================================================
     РАСЧЁТ — порядок цифр, не смета
     ========================================================================== */
  var calc = $('#calc');
  if (calc) {
    var DOOR = {            /* полотно с коробом, без работы */
      in:     [26500, 41000],
      mid:    [11200, 24800],
      street: [60000, 102000]
    };
    var MOUNT = {           /* установка за одну дверь */
      in:     [8400, 11400],
      mid:    [4200, 6000],
      street: [12400, 16000]
    };
    var FIN = {             /* отделка — множитель к полотну */
      mdf:    [1, 1],
      oak:    [1.26, 1.32],
      solid:  [1.70, 2.05],
      hidden: [1.55, 1.78]
    };
    var DEMO  = [1800, 3200];
    var DOBOR = [2600, 5400];

    var qtyIn = $('#qty'), qtyOut = $('#qtyOut');
    var sumLo = $('#sumLo'), sumHi = $('#sumHi'), note = $('#calcNote');
    var hiddenOpt = calc.querySelector('input[value="hidden"]');

    var fmt = function (n) {
      return Math.round(n / 100) * 100 === 0 ? '0'
        : String(Math.round(n / 100) * 100).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    };
    var plural = function (n, a, b, c) {
      var d = n % 100, e = n % 10;
      return n + ' ' + (d > 4 && d < 21 ? c : e === 1 ? a : e > 1 && e < 5 ? b : c);
    };

    var run = function () {
      var type = calc.querySelector('input[name="type"]:checked').value;
      var qty  = Math.max(1, Math.min(12, parseInt(qtyIn.value, 10) || 1));

      /* скрытый короб бывает только у межкомнатных */
      var allowHidden = type === 'mid';
      hiddenOpt.disabled = !allowHidden;
      if (!allowHidden && hiddenOpt.checked) calc.querySelector('input[value="mdf"]').checked = true;

      var fin = calc.querySelector('input[name="fin"]:checked').value;
      var mount = calc.querySelector('input[name="mount"]').checked;
      var demo  = calc.querySelector('input[name="demo"]').checked;
      var dobor = calc.querySelector('input[name="dobor"]').checked;

      var lo = DOOR[type][0] * FIN[fin][0];
      var hi = DOOR[type][1] * FIN[fin][1];
      if (mount) { lo += MOUNT[type][0]; hi += MOUNT[type][1]; }
      if (demo)  { lo += DEMO[0];  hi += DEMO[1]; }
      if (dobor) { lo += DOBOR[0]; hi += DOBOR[1]; }

      lo *= qty; hi *= qty;
      if (qty >= 4) { lo *= 0.95; hi *= 0.93; }   /* объём */

      sumLo.textContent = fmt(lo);
      sumHi.textContent = fmt(hi);

      var head = qty === 1 ? 'За одну дверь' : 'За ' + plural(qty, 'дверь', 'двери', 'дверей');
      var tail = mount ? ' под ключ. ' : ' без установки. ';
      var extra = qty >= 4 ? 'От четырёх дверей считаю дешевле — выезд и работа те же. '
                           : 'Разброс — это разница между базовой фабричной моделью и тем, что вы выберете на замере. ';
      note.textContent = head + tail + extra + 'Точную цифру называю после замера, и она уже не меняется.';
    };

    calc.addEventListener('change', run);
    $$('.count button').forEach(function (b) {
      b.addEventListener('click', function () {
        qtyIn.value = Math.max(1, Math.min(12, (+qtyIn.value) + (+b.dataset.step)));
        qtyOut.textContent = qtyIn.value;
        run();
      });
    });
    run();
  }

  /* ==========================================================================
     ЗАЯВКА
     ========================================================================== */
  var form = $('#form');
  if (form) {
    var phone = $('#fphone');

    phone.addEventListener('input', function () {
      var d = phone.value.replace(/\D/g, '');
      if (d[0] === '8') d = '7' + d.slice(1);
      if (d[0] !== '7') d = '7' + d;
      d = d.slice(0, 11);
      var out = '+7';
      if (d.length > 1) out += ' (' + d.slice(1, 4);
      if (d.length >= 5) out += ') ' + d.slice(4, 7);
      if (d.length >= 8) out += '-' + d.slice(7, 9);
      if (d.length >= 10) out += '-' + d.slice(9, 11);
      phone.value = out;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#fname');
      var ok = true;

      [[name, name.value.trim().length >= 2], [phone, phone.value.replace(/\D/g, '').length === 11]]
        .forEach(function (pair) {
          var bad = !pair[1];
          pair[0].closest('.field').classList.toggle('is-bad', bad);
          if (bad && ok) { pair[0].focus(); ok = false; }
        });

      if (!ok) return;

      /* TODO: сюда подставить отправку — Telegram-бот, почта или CRM. См. README.md */
      $$('.field, .form__foot', form).forEach(function (el) { el.hidden = true; });
      $('#formOk').hidden = false;
    });
  }
})();
