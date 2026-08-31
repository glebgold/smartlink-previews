/* ==========================================================================
   Астера · главная страница
   ========================================================================== */
(function () {
  'use strict';
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var slow = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Мягкое появление блоков ---------- */
  if ('IntersectionObserver' in window && !slow) {
    var risers = $$('.head, .card, .incl li, .layers li, .steps li, .work, .rev, .about, .calc, .form');
    risers.forEach(function (el, i) {
      el.setAttribute('data-rise', '');
      el.style.transitionDelay = (Math.min(i % 5, 4) * 50) + 'ms';
    });
    var obs = new IntersectionObserver(function (rows) {
      rows.forEach(function (r) {
        if (!r.isIntersecting) return;
        r.target.classList.add('in');
        obs.unobserve(r.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: .05 });
    risers.forEach(function (el) { obs.observe(el); });
  }

  /* ==========================================================================
     РАСЧЁТ — порядок цифр, не смета.
     Цены здесь и в карточках каталога надо держать согласованными.
     ========================================================================== */
  var calc = $('#calc');
  if (calc) {
    var DOOR   = { in:[26500,41000],  street:[60000,102000], mid:[11200,24800] };
    var MOUNT  = { in:[8400,11400],   street:[12400,16000],  mid:[4200,6000]  };
    var FIN    = { mdf:[1,1], oak:[1.26,1.32], solid:[1.70,2.05], hidden:[1.55,1.78] };
    var DEMO   = [1800,3200];
    var DOBOR  = [2600,5400];

    var qtyIn = $('#qty'), qtyOut = $('#qtyOut');
    var sumLo = $('#sumLo'), sumHi = $('#sumHi'), note = $('#calcNote');
    var hidden = calc.querySelector('input[value="hidden"]');

    var fmt = function (n) { return String(Math.round(n / 100) * 100).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
    var plural = function (n, a, b, c) {
      var d = n % 100, e = n % 10;
      return n + ' ' + (d > 4 && d < 21 ? c : e === 1 ? a : e > 1 && e < 5 ? b : c);
    };

    var run = function () {
      var type = calc.querySelector('input[name="type"]:checked').value;
      var qty  = Math.max(1, Math.min(12, parseInt(qtyIn.value, 10) || 1));

      /* скрытый короб бывает только у межкомнатных */
      hidden.disabled = type !== 'mid';
      if (hidden.disabled && hidden.checked) calc.querySelector('input[value="mdf"]').checked = true;

      var fin   = calc.querySelector('input[name="fin"]:checked').value;
      var mount = calc.querySelector('input[name="mount"]').checked;
      var demo  = calc.querySelector('input[name="demo"]').checked;
      var dobor = calc.querySelector('input[name="dobor"]').checked;

      var lo = DOOR[type][0] * FIN[fin][0], hi = DOOR[type][1] * FIN[fin][1];
      if (mount) { lo += MOUNT[type][0]; hi += MOUNT[type][1]; }
      if (demo)  { lo += DEMO[0];  hi += DEMO[1]; }
      if (dobor) { lo += DOBOR[0]; hi += DOBOR[1]; }
      lo *= qty; hi *= qty;
      if (qty >= 4) { lo *= .95; hi *= .93; }

      sumLo.textContent = fmt(lo);
      sumHi.textContent = fmt(hi);
      note.textContent =
        (qty === 1 ? 'За одну дверь' : 'За ' + plural(qty, 'дверь', 'двери', 'дверей')) +
        (mount ? ' под ключ. ' : ' без установки. ') +
        (qty >= 4 ? 'От четырёх дверей считаем дешевле — выезд и работа те же. '
                  : 'Разброс — это разница между базовой моделью и тем, что вы выберете на замере. ') +
        'Точную цифру называем после замера, и она уже не меняется.';
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
      var name = $('#fname'), ok = true;
      [[name, name.value.trim().length >= 2], [phone, phone.value.replace(/\D/g, '').length === 11]]
        .forEach(function (p) {
          var bad = !p[1];
          p[0].closest('.field').classList.toggle('is-bad', bad);
          if (bad && ok) { p[0].focus(); ok = false; }
        });
      if (!ok) return;
      /* TODO: сюда подставить отправку — Telegram-бот, почта или CRM. См. README.md */
      $$('.field, .form__foot', form).forEach(function (el) { el.hidden = true; });
      $('#formOk').hidden = false;
    });
  }
})();
