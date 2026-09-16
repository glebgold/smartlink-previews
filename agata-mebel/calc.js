/* Агата Мебель — калькулятор стоимости (ориентировочный расчёт «от»).
   Ставки — ПЛЕЙСХОЛДЕРЫ, согласовать с заказчицей. Все суммы в рублях. */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const form = $('#calc-form'); if (!form) return;

  /* ---- ставки ---- */
  const R = {
    kitchen:  { unit: 'пог. м', min: 2,   max: 12, step: 0.5, def: 4,   floor: 180000,
                fronts: { ldsp: 38000, film: 45000, enamel: 58000, veneer: 72000 } },
    wardrobe: { unit: 'м ширины', min: 1, max: 6, step: 0.1, def: 2.4, floor: 65000,
                fronts: { ldsp: 26000, film: 32000, enamel: 44000, veneer: 54000 } },
    dressing: { unit: 'м² фасадов', min: 2, max: 16, step: 0.5, def: 5, floor: 120000,
                fronts: { ldsp: 16000, film: 21000, enamel: 28000, veneer: 34000 } },
    kids:     { unit: 'пог. м', min: 2,   max: 10, step: 0.5, def: 4,   floor: 95000,
                fronts: { ldsp: 24000, film: 32000, enamel: 44000, veneer: 54000 } },
    bath:     { unit: 'пог. м', min: 0.6, max: 4,  step: 0.1, def: 1.2, floor: 45000,
                fronts: { ldsp: 38000, film: 48000, enamel: 62000, veneer: 75000 } },
    stone:    { unit: 'пог. м', min: 1,   max: 12, step: 0.5, def: 3,   floor: 0,
                fronts: { acrylic: 11000, quartz: 12000, ceramic: 16000, natural: 18000 } }
  };
  const HW  = { standard: 0, soft: 3000, premium: 7000 };          // за единицу размера
  const TOP = { ldsp: 3000, acrylic: 9000, quartz: 12000, ceramic: 15000 }; // за пог. м (кухня)
  const EXTRA = { light: 8000, island: 60000 };
  const LABELS = {
    type: { kitchen: 'Кухня', wardrobe: 'Шкаф', dressing: 'Гардеробная', kids: 'Детская', bath: 'Мебель для ванной', stone: 'Изделие из камня' },
    fronts: { ldsp: 'ЛДСП', film: 'МДФ в плёнке', enamel: 'МДФ в эмали', veneer: 'Шпон / акрил', acrylic: 'Акриловый камень', quartz: 'Кварцевый агломерат', ceramic: 'Керамогранит', natural: 'Натуральный камень' },
    hw: { standard: 'стандартная', soft: 'с доводчиками', premium: 'премиум' },
    top: { ldsp: 'ЛДСП', acrylic: 'акрил', quartz: 'кварц', ceramic: 'керамогранит' }
  };

  const typeInputs = $$('input[name=type]', form);
  const size = $('#size'), sizeVal = $('#size-val'), sizeUnit = $('#size-unit'), sizeHint = $('#size-hint');
  const frontsBox = $('#g-fronts'), stoneBox = $('#g-stone'), hwBox = $('#g-hw'), topBox = $('#g-top'), extraBox = $('#g-extra');
  const out = { base: $('#p-base'), mine: $('#p-mine'), prem: $('#p-prem'), note: $('#p-note'), title: $('#p-title') };
  const ctx = { type: $('input[name=ctxType]'), len: $('input[name=ctxLength]'), price: $('input[name=ctxPrice]'), variant: $('input[name=ctxVariant]') };

  const fmt = n => Math.round(n / 1000) * 1000;
  const money = n => fmt(n).toLocaleString('ru-RU') + ' ₽';
  const val = name => { const el = $('input[name=' + name + ']:checked', form); return el ? el.value : null; };

  function setupType(t) {
    const r = R[t];
    size.min = r.min; size.max = r.max; size.step = r.step; size.value = r.def;
    sizeUnit.textContent = r.unit;
    sizeHint.textContent = {
      kitchen: 'Длина кухни по стене (для угловой — сумма двух сторон). Верх и низ считаются вместе.',
      wardrobe: 'Ширина шкафа. Высота до 2,7 м и глубина 60 см уже учтены.',
      dressing: 'Площадь фасадов и открытых секций. Наполнение — штанги, полки, ящики — включено.',
      kids: 'Общая длина мебели по стенам: кровать, стол, шкаф, стеллаж.',
      bath: 'Длина тумбы и пеналов. Столешница и мойка считаются отдельно, в разделе «Камень».',
      stone: 'Длина столешницы или подоконника. Кромка, вырезы под мойку и варочную панель включены.'
    }[t];
    frontsBox.hidden = t === 'stone';
    stoneBox.hidden = t !== 'stone';
    hwBox.hidden = t === 'stone';
    topBox.hidden = t !== 'kitchen';
    extraBox.hidden = t !== 'kitchen';
  }

  function price(t, s, fronts, hw, top, extras) {
    const r = R[t];
    let p = s * r.fronts[fronts];
    if (t !== 'stone') p += s * HW[hw];
    if (t === 'kitchen') { p += s * TOP[top]; if (extras.light) p += EXTRA.light; if (extras.island) p += EXTRA.island; }
    return Math.max(p, r.floor);
  }

  function calc() {
    const t = val('type'); const r = R[t];
    const s = parseFloat(size.value);
    sizeVal.textContent = s.toLocaleString('ru-RU');
    const fronts = t === 'stone' ? (val('stone') || 'quartz') : (val('fronts') || 'film');
    const hw = val('hw') || 'soft', top = val('top') || 'ldsp';
    const extras = { light: !!$('input[name=light]:checked', form), island: !!$('input[name=island]:checked', form) };
    const mine = price(t, s, fronts, hw, top, extras);
    const base = t === 'stone' ? price(t, s, 'acrylic', hw, top, extras) : price(t, s, 'ldsp', 'standard', 'ldsp', { light: false, island: extras.island });
    const prem = t === 'stone' ? price(t, s, 'natural', hw, top, extras) : price(t, s, 'veneer', 'premium', 'quartz', { light: true, island: extras.island });
    out.base.textContent = 'от ' + money(base);
    out.mine.textContent = 'от ' + money(mine);
    out.prem.textContent = 'от ' + money(prem);
    out.title.textContent = LABELS.type[t] + ' · ' + s.toLocaleString('ru-RU') + ' ' + r.unit;
    const parts = [LABELS.fronts[fronts]];
    if (t !== 'stone') parts.push('фурнитура ' + LABELS.hw[hw]);
    if (t === 'kitchen') { parts.push('столешница ' + LABELS.top[top]); if (extras.light) parts.push('подсветка'); if (extras.island) parts.push('остров'); }
    out.note.textContent = parts.join(' · ');
    if (ctx.type) ctx.type.value = LABELS.type[t];
    if (ctx.len) ctx.len.value = s + ' ' + r.unit + ' · ' + parts.join(', ');
    if (ctx.price) ctx.price.value = money(base) + ' / ' + money(mine) + ' / ' + money(prem);
    const chipPrice = document.getElementById('chip-price');
    if (chipPrice) chipPrice.textContent = 'от ' + money(mine);
  }

  typeInputs.forEach(i => i.addEventListener('change', () => { setupType(i.value); calc(); }));
  form.addEventListener('input', calc);
  form.addEventListener('change', calc);
  $$('input[name=variant]', form).forEach(i => i.addEventListener('change', () => { if (ctx.variant) ctx.variant.value = i.value; }));

  const q = new URLSearchParams(location.search).get('type');
  const start = R[q] ? q : 'kitchen';
  const startInput = $('input[name=type][value=' + start + ']', form); if (startInput) startInput.checked = true;
  setupType(start); calc();

  /* Плашка с ценой на телефоне: видна, пока итог не на экране */
  const chip = document.getElementById('calc-chip'), result = document.getElementById('calc-result');
  if (chip && result && 'IntersectionObserver' in window) {
    let resultVisible = false;
    new IntersectionObserver(es => { resultVisible = es[0].isIntersecting; sync(); }, { threshold: 0.15 }).observe(result);
    let formVisible = false;
    new IntersectionObserver(es => { formVisible = es[0].isIntersecting; sync(); }, { threshold: 0 }).observe(form);
    function sync() { chip.classList.toggle('is-on', formVisible && !resultVisible); }
    chip.addEventListener('click', e => {
      e.preventDefault();
      result.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
  }
})();
