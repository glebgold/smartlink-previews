/* ==========================================================
   Бриз 39 — общий скрипт сайта
   ========================================================== */

// ---- Настройки: поменяйте на реальные данные клиента ----
const CONFIG = {
  phone: '+79000000000',            // для tel: ссылок
  phoneView: '+7 (900) 000-00-00',  // как показывать
  whatsapp: '79000000000',          // номер для WhatsApp без +
  telegram: 'briz39',               // username в Telegram без @
};

// Стоимость стандартного монтажа по классу (₽)
const INSTALL = { '07': 12000, '09': 12000, '12': 14000, '18': 17000, '24': 20000 };

/* ---------- Каталог ---------- */
const PRODUCTS = [
  { id: 'ballu-edge-07', brand: 'Ballu', name: 'Olympio Edge', cls: '07', area: 20, inv: false, wifi: false, heat: -7, noise: 26, color: 'white', price: 21900, tags: ['Бюджет'] },
  { id: 'royal-gloria-07', brand: 'Royal Clima', name: 'Gloria Inverter', cls: '07', area: 20, inv: true, wifi: false, heat: -15, noise: 22, color: 'white', price: 27900, tags: [] },
  { id: 'aux-qlight-09', brand: 'AUX', name: 'Q Light Inverter', cls: '09', area: 25, inv: true, wifi: true, heat: -15, noise: 22, color: 'white', price: 30900, tags: [] },
  { id: 'hisense-zoom-07', brand: 'Hisense', name: 'Zoom DC Inverter', cls: '07', area: 20, inv: true, wifi: false, heat: -15, noise: 21, color: 'white', price: 31900, tags: ['Хит'] },
  { id: 'hisense-zoom-09', brand: 'Hisense', name: 'Zoom DC Inverter', cls: '09', area: 25, inv: true, wifi: false, heat: -15, noise: 22, color: 'white', price: 35900, tags: ['Хит'] },
  { id: 'gree-pular-09', brand: 'Gree', name: 'Pular Inverter', cls: '09', area: 25, inv: true, wifi: true, heat: -20, noise: 22, color: 'white', price: 37900, tags: ['Хит'] },
  { id: 'ballu-igreen-09', brand: 'Ballu', name: 'iGreen Pro DC', cls: '09', area: 25, inv: true, wifi: true, heat: -20, noise: 21, color: 'white', price: 38900, tags: [] },
  { id: 'electrolux-skandi-09', brand: 'Electrolux', name: 'Skandi DC Inverter', cls: '09', area: 25, inv: true, wifi: true, heat: -20, noise: 21, color: 'white', price: 41900, tags: [] },
  { id: 'hisense-zoom-12', brand: 'Hisense', name: 'Zoom DC Inverter', cls: '12', area: 35, inv: true, wifi: false, heat: -15, noise: 24, color: 'white', price: 42900, tags: [] },
  { id: 'gree-pular-12', brand: 'Gree', name: 'Pular Inverter', cls: '12', area: 35, inv: true, wifi: true, heat: -20, noise: 24, color: 'white', price: 45900, tags: [] },
  { id: 'hisense-expert-09', brand: 'Hisense', name: 'Expert Smart DC', cls: '09', area: 25, inv: true, wifi: true, heat: -25, noise: 19, color: 'white', price: 46900, tags: ['Тёплый'] },
  { id: 'electrolux-fusion-12', brand: 'Electrolux', name: 'Fusion Ultra Super DC', cls: '12', area: 35, inv: true, wifi: true, heat: -25, noise: 21, color: 'white', price: 54900, tags: ['Тёплый'] },
  { id: 'gree-pular-18', brand: 'Gree', name: 'Pular Inverter', cls: '18', area: 50, inv: true, wifi: true, heat: -20, noise: 29, color: 'white', price: 64900, tags: [] },
  { id: 'gree-airy-09', brand: 'Gree', name: 'Airy Inverter (чёрный)', cls: '09', area: 25, inv: true, wifi: true, heat: -25, noise: 20, color: 'black', price: 79900, tags: ['Дизайн'] },
  { id: 'ballu-igreen-24', brand: 'Ballu', name: 'iGreen Pro DC', cls: '24', area: 70, inv: true, wifi: true, heat: -20, noise: 33, color: 'white', price: 79900, tags: [] },
  { id: 'daikin-perfera-09', brand: 'Daikin', name: 'Perfera FTXM', cls: '09', area: 25, inv: true, wifi: true, heat: -20, noise: 19, color: 'silver', price: 119900, tags: ['Премиум'] },
  { id: 'mitsu-ln-09', brand: 'Mitsubishi Electric', name: 'Premium Inverter MSZ-LN', cls: '09', area: 25, inv: true, wifi: true, heat: -15, noise: 19, color: 'black', price: 129900, tags: ['Премиум', 'Дизайн'] },
];

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rub = n => n.toLocaleString('ru-RU').replace(/,/g, ' ') + ' ₽';

/* ---------- Подстановка контактов ---------- */
function applyContacts() {
  $$('[data-phone]').forEach(a => { a.href = 'tel:' + CONFIG.phone; if (!a.dataset.keep) a.textContent = CONFIG.phoneView; });
  $$('[data-wa]').forEach(a => { a.href = 'https://wa.me/' + CONFIG.whatsapp; a.target = '_blank'; a.rel = 'noopener'; });
  $$('[data-tg]').forEach(a => { a.href = 'https://t.me/' + CONFIG.telegram; a.target = '_blank'; a.rel = 'noopener'; });
}

/* ---------- Шапка / меню ---------- */
function initHeader() {
  const h = $('.header');
  const onScroll = () => h && h.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const b = $('.burger');
  b && b.addEventListener('click', () => document.body.classList.toggle('menu-open'));
  $$('.mobile-menu a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));
}

/* ---------- Появление при скролле ---------- */
function initReveal() {
  const els = $$('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
}

/* ---------- Термостат в первом экране ---------- */
function initThermo() {
  const t = $('#thermo'); if (!t) return;
  let temp = 22, mode = 'cold';
  const out = $('.thermo-temp span', t), note = $('.thermo-note', t);
  const notes = {
    cold: 'Июль, +29° на улице. Инвертор держит 22° тихо — 21 дБ, как шёпот.',
    heat: 'Ноябрь, +3° и ветер с залива. Тепловой насос греет в 3–4 раза дешевле обогревателя.',
  };
  const render = () => {
    out.textContent = temp;
    note.textContent = notes[mode];
    document.body.classList.toggle('mode-heat', mode === 'heat');
    $$('.thermo-modes button', t).forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
  };
  $('[data-t="up"]', t).onclick = () => { temp = Math.min(30, temp + 1); render(); };
  $('[data-t="down"]', t).onclick = () => { temp = Math.max(16, temp - 1); render(); };
  $$('.thermo-modes button', t).forEach(b => b.onclick = () => { mode = b.dataset.mode; temp = mode === 'heat' ? 24 : 22; render(); });
  render();
}

/* ---------- Ползунки: заливка трека ---------- */
function paintRange(r) { r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%'); }

/* ---------- Калькулятор подбора мощности ---------- */
function initCalc() {
  const f = $('#calc'); if (!f) return;
  const area = $('#c-area', f), h = $('#c-height', f), ppl = $('#c-people', f);
  const calc = () => {
    [area, h, ppl].forEach(paintRange);
    const S = +area.value, H = +h.value / 100, P = +ppl.value;
    $('#o-area').textContent = S + ' м²';
    $('#o-height').textContent = H.toFixed(1).replace('.', ',') + ' м';
    $('#o-people').textContent = P;
    const sun = { low: 30, mid: 35, high: 40 }[$('input[name=sun]:checked', f).value];
    const tech = +$('input[name=tech]:checked', f).value;
    const top = $('input[name=floor]:checked', f).value === 'top' ? 1.15 : 1;
    // Q = S·h·q + люди + техника, Вт
    let q = (S * H * sun + P * 130 + tech) * top;
    const kw = q / 1000;
    const classes = [['07', 2.1], ['09', 2.6], ['12', 3.5], ['18', 5.2], ['24', 7.0]];
    let pick = classes.find(c => c[1] >= kw * 1.05) || null;
    const big = $('#r-kw'), cls = $('#r-class'), pr = $('#r-price'), inst = $('#r-install'), mdl = $('#r-model');
    big.innerHTML = kw.toFixed(1).replace('.', ',') + '<small> кВт</small>';
    if (!pick) {
      cls.textContent = 'мульти-сплит / 2 блока';
      pr.textContent = 'по расчёту'; inst.textContent = 'по расчёту'; mdl.textContent = 'Рассчитаем на объекте';
      return;
    }
    cls.textContent = pick[0] + ' (до ' + pick[1].toString().replace('.', ',') + ' кВт)';
    const list = PRODUCTS.filter(p => p.cls === pick[0] && p.inv).sort((a, b) => a.price - b.price);
    const any = list[0] || PRODUCTS.filter(p => p.cls === pick[0])[0];
    if (any) {
      pr.textContent = 'от ' + rub(any.price + INSTALL[pick[0]]);
      mdl.textContent = any.brand + ' ' + any.name;
    } else { pr.textContent = 'по запросу'; mdl.textContent = 'Подберём под задачу'; }
    inst.textContent = 'от ' + rub(INSTALL[pick[0]]);
    f.dataset.summary = `Площадь ${S} м², потолок ${H} м, людей ${P}. Нужно ~${kw.toFixed(1)} кВт, класс ${pick[0]}.`;
  };
  f.addEventListener('input', calc); calc();
  $('#calc-send')?.addEventListener('click', () => openQuiz(f.dataset.summary));
}

/* ---------- Карточка товара ---------- */
function acSVG(color) {
  const body = { white: ['#FFFFFF', '#E8EEF4', '#CBD6E1'], black: ['#23272E', '#14171C', '#0B0D10'], silver: ['#E7EBEF', '#C9D0D8', '#A9B3BE'] }[color];
  const led = color === 'black' ? '#3CC8F5' : '#1A8CFF';
  return `<svg viewBox="0 0 320 110" aria-hidden="true">
    <defs><linearGradient id="g-${color}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${body[0]}"/><stop offset="1" stop-color="${body[1]}"/></linearGradient></defs>
    <rect x="6" y="6" width="308" height="86" rx="18" fill="url(#g-${color})" stroke="${body[2]}"/>
    <path d="M14 70 H306 V80 a12 12 0 0 1 -12 12 H26 a12 12 0 0 1 -12 -12z" fill="${body[1]}"/>
    <rect x="34" y="78" width="252" height="6" rx="3" fill="${body[2]}"/>
    <circle cx="276" cy="30" r="3" fill="${led}"/>
    <text x="250" y="34" font-family="JetBrains Mono, monospace" font-size="11" fill="${led}" text-anchor="end">22°</text>
  </svg>`;
}

function productCard(p) {
  const tags = [
    ...p.tags.map(t => `<span class="tag ${t === 'Хит' ? 'tag-hit' : ''}">${t}</span>`),
    p.inv ? '<span class="tag tag-inv">Инвертор</span>' : '<span class="tag">On/Off</span>',
    p.wifi ? '<span class="tag tag-wifi">Wi‑Fi</span>' : '',
  ].join('');
  const turnkey = p.price + INSTALL[p.cls];
  return `<article class="product reveal" data-brand="${p.brand}" data-cls="${p.cls}" data-inv="${p.inv}" data-wifi="${p.wifi}">
    <div class="product-img"><div class="product-tags">${tags}</div>${acSVG(p.color)}</div>
    <div class="product-body">
      <div class="product-brand">${p.brand}</div>
      <h3>${p.name} ${p.cls}</h3>
      <div class="specs">
        <div><span>Площадь</span><b>до ${p.area} м²</b></div>
        <div><span>Шум, от</span><b>${p.noise} дБ</b></div>
        <div><span>Обогрев до</span><b>${p.heat}°C</b></div>
        <div><span>Класс</span><b>${p.cls} BTU·10³</b></div>
      </div>
      <div class="product-foot">
        <div class="price">${rub(p.price)}<small class="price-turnkey">под ключ от ${rub(turnkey)}</small></div>
        <button class="btn btn-dark btn-sm" data-order="${p.brand} ${p.name} ${p.cls}">Заказать</button>
      </div>
    </div>
  </article>`;
}

function initCatalog() {
  const grid = $('#catalog'); if (!grid) return;
  const limit = +grid.dataset.limit || 0;
  let items = PRODUCTS;
  if (limit) items = PRODUCTS.filter(p => p.tags.includes('Хит') || p.tags.includes('Тёплый') || p.tags.includes('Дизайн')).slice(0, limit);
  grid.innerHTML = items.map(productCard).join('');
  const filters = $('#filters');
  if (filters) {
    const apply = () => {
      const brand = $('input[name=f-brand]:checked', filters).value;
      const cls = $('input[name=f-cls]:checked', filters).value;
      const inv = $('#f-inv', filters).checked, wifi = $('#f-wifi', filters).checked;
      const sort = $('#f-sort', filters).value;
      let list = PRODUCTS.filter(p => (brand === 'all' || p.brand === brand) && (cls === 'all' || p.cls === cls) && (!inv || p.inv) && (!wifi || p.wifi));
      list = list.sort((a, b) => sort === 'desc' ? b.price - a.price : a.price - b.price);
      grid.innerHTML = list.length ? list.map(productCard).join('') : '<div class="empty">Под такие фильтры моделей нет в витрине — но мы привезём под заказ за 2–5 дней. Напишите нам.</div>';
      $$('.reveal', grid).forEach(e => e.classList.add('in'));
      $('#f-count').textContent = list.length;
      bindOrders();
    };
    filters.addEventListener('change', apply); apply();
  }
  bindOrders();
}

function bindOrders() {
  $$('[data-order]').forEach(b => b.onclick = () => openQuiz('Интересует модель: ' + b.dataset.order));
}

/* ---------- Галерея + лайтбокс ---------- */
function initGallery() {
  const g = $('.gallery'); if (!g) return;
  const links = $$('a', g);
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = '<img alt=""><div class="lb-cap"></div><button class="lb-close" aria-label="Закрыть">×</button><button class="lb-prev" aria-label="Назад">‹</button><button class="lb-next" aria-label="Вперёд">›</button>';
  document.body.appendChild(lb);
  let i = 0;
  const visible = () => links.filter(a => !a.classList.contains('hide'));
  const show = n => { const v = visible(); i = (n + v.length) % v.length; $('img', lb).src = v[i].href; $('.lb-cap', lb).textContent = v[i].dataset.cap || ''; };
  links.forEach(a => a.addEventListener('click', e => { e.preventDefault(); lb.classList.add('open'); show(visible().indexOf(a)); }));
  $('.lb-close', lb).onclick = () => lb.classList.remove('open');
  $('.lb-prev', lb).onclick = () => show(i - 1);
  $('.lb-next', lb).onclick = () => show(i + 1);
  lb.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('open'); });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') lb.classList.remove('open');
    if (e.key === 'ArrowLeft') show(i - 1);
    if (e.key === 'ArrowRight') show(i + 1);
  });
  const gf = $('#gal-filters');
  gf && gf.addEventListener('change', () => {
    const v = $('input:checked', gf).value;
    links.forEach(a => a.classList.toggle('hide', v !== 'all' && !a.dataset.cat.includes(v)));
  });
}

/* ---------- Квиз-подбор ---------- */
let quizExtra = '';
function openQuiz(extra = '') {
  quizExtra = extra;
  const m = $('#quiz'); if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function initQuiz() {
  const m = $('#quiz'); if (!m) return;
  const steps = $$('.quiz-step', m), bar = $('.quiz-progress i', m), meta = $('.quiz-meta', m);
  let s = 0;
  const go = n => {
    s = Math.max(0, Math.min(steps.length - 1, n));
    steps.forEach((el, k) => el.classList.toggle('on', k === s));
    bar.style.width = ((s + 1) / steps.length * 100) + '%';
    meta.textContent = s < steps.length - 1 ? `Шаг ${s + 1} из ${steps.length - 1}` : 'Почти готово';
    $('[data-q="prev"]', m).style.visibility = s ? 'visible' : 'hidden';
    $('[data-q="next"]', m).style.display = s === steps.length - 1 ? 'none' : '';
  };
  const close = () => { m.classList.remove('open'); document.body.style.overflow = ''; };
  $('.modal-close', m).onclick = close;
  m.addEventListener('click', e => { if (e.target === m) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  $('[data-q="prev"]', m).onclick = () => go(s - 1);
  $('[data-q="next"]', m).onclick = () => go(s + 1);
  $$('.quiz-step input[type=radio]', m).forEach(r => r.addEventListener('change', () => setTimeout(() => go(s + 1), 220)));
  $$('[data-quiz]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); go(0); openQuiz(b.dataset.quiz || ''); }));
  go(0);
}

/* ---------- Формы → WhatsApp / Telegram ---------- */
function formText(form) {
  const lines = ['Здравствуйте! Заявка с сайта Бриз 39.'];
  if (quizExtra && form.closest('#quiz')) lines.push(quizExtra);
  $$('[data-label]', form).forEach(el => {
    if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) return;
    const v = (el.value || '').trim();
    if (v) lines.push(el.dataset.label + ': ' + v);
  });
  return lines.join('\n');
}
function initForms() {
  $$('form.js-lead').forEach(form => {
    form.addEventListener('submit', e => e.preventDefault());
    $$('[data-send]', form).forEach(btn => btn.addEventListener('click', () => {
      const phone = $('input[type=tel]', form);
      if (phone && phone.value.replace(/\D/g, '').length < 10) { phone.focus(); phone.setCustomValidity('Укажите номер телефона'); phone.reportValidity(); return; }
      phone && phone.setCustomValidity('');
      const text = encodeURIComponent(formText(form));
      const url = btn.dataset.send === 'tg'
        ? `https://t.me/${CONFIG.telegram}?text=${text}`
        : `https://wa.me/${CONFIG.whatsapp}?text=${text}`;
      window.open(url, '_blank', 'noopener');
      form.classList.add('sent');
    }));
  });
  // маска телефона
  $$('input[type=tel]').forEach(i => i.addEventListener('input', () => {
    let d = i.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (!d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);
    const p = ['+7'];
    if (d.length > 1) p.push(' (' + d.slice(1, 4));
    if (d.length >= 4) p.push(') ' + d.slice(4, 7));
    if (d.length >= 7) p.push('-' + d.slice(7, 9));
    if (d.length >= 9) p.push('-' + d.slice(9, 11));
    i.value = p.join('');
    i.setCustomValidity('');
  }));
}

/* ---------- Калькулятор стоимости монтажа ---------- */
function initInstallCalc() {
  const f = $('#icalc'); if (!f) return;
  const calc = () => {
    $$('input[type=range]', f).forEach(paintRange);
    const cls = $('input[name=i-cls]:checked', f).value;
    const len = +$('#i-len', f).value;
    const wall = $('input[name=i-wall]:checked', f).value;
    const route = $('input[name=i-route]:checked', f).value;
    const extra = $$('input[name=i-extra]:checked', f).map(i => +i.value).reduce((a, b) => a + b, 0);
    $('#o-len').textContent = len + ' м';
    const base = INSTALL[cls];
    const perM = ['18', '24'].includes(cls) ? 1900 : 1500;
    const over = Math.max(0, len - 3);
    const route_m = { box: 500, chase: wall === 'concrete' ? 1800 : 1000, hidden: 0 }[route] * len;
    const wallAdd = wall === 'concrete' ? 1500 : 0;
    const total = base + over * perM + route_m + wallAdd + extra;
    $('#ir-base').textContent = rub(base);
    $('#ir-route').textContent = over ? `${over} м × ${rub(perM)} = ${rub(over * perM)}` : 'входит (до 3 м)';
    $('#ir-wall').textContent = route_m + wallAdd ? rub(route_m + wallAdd) : '—';
    $('#ir-extra').textContent = extra ? rub(extra) : '—';
    $('#ir-total').innerHTML = rub(total).replace(' ₽', '<small> ₽</small>');
    f.dataset.summary = `Расчёт монтажа: класс ${cls}, трасса ${len} м, итого ≈ ${rub(total)}`;
  };
  f.addEventListener('input', calc); calc();
  $('#icalc-send')?.addEventListener('click', () => openQuiz(f.dataset.summary));
}

/* ---------- Год в футере ---------- */
function initYear() { $$('[data-year]').forEach(e => e.textContent = new Date().getFullYear()); }

document.addEventListener('DOMContentLoaded', () => {
  applyContacts(); initHeader(); initThermo(); initCalc(); initCatalog();
  initGallery(); initQuiz(); initForms(); initInstallCalc(); initYear(); initReveal();
});
