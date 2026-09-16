/* Агата Мебель — интерактив (v4) */
(function () {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const goal = (name) => { try { if (window.ym && window.YM_ID) window.ym(window.YM_ID, 'reachGoal', name); } catch (e) {} };
  const IMG = 'assets/img/';

  /* Ссылки на MAX. Взять в приложении: Профиль → Поделиться профилем (вид https://max.ru/u/…).
     Пока строки пустые — кнопки MAX на сайте скрыты. */
  const MAX_LINKS = {
    anna: '',   // личный телефон Анны  +7 (906) 238-49-50
    work: '',   // рабочий телефон      +7 (900) 349-83-11
  };
  const DIMS = window.PHOTO_DIMS || {};
  const isLand = p => DIMS[p] ? DIMS[p][0] > DIMS[p][1] : false;

  /* ---------- Прелоадер ---------- */
  const loader = $('.loader');
  let seen = false; try { seen = sessionStorage.getItem('agata-seen') === '1'; } catch (e) {}
  const ready = () => { document.body.classList.add('is-ready'); $$('.hero .sp, .page-hero .sp').forEach(h => h.classList.add('in')); $$('.hero .rv').forEach(r => r.classList.add('in')); };
  if (!loader || seen || reduce) { document.body.classList.add('no-loader'); ready(); }
  else {
    try { sessionStorage.setItem('agata-seen', '1'); } catch (e) {}
    document.body.style.overflow = 'hidden';
    setTimeout(() => { loader.classList.add('is-done'); document.body.style.overflow = ''; ready(); }, 1150);
  }

  /* ---------- Шапка ---------- */
  const hdr = $('.hdr');
  const onScroll = () => { if (hdr) hdr.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Мобильное меню ---------- */
  const burger = $('.burger'), mnav = $('.mnav');
  if (burger && mnav) {
    const toggle = (open) => {
      const o = typeof open === 'boolean' ? open : !mnav.classList.contains('is-open');
      mnav.classList.toggle('is-open', o); burger.classList.toggle('is-open', o);
      burger.setAttribute('aria-expanded', String(o)); document.body.style.overflow = o ? 'hidden' : '';
    };
    burger.addEventListener('click', () => toggle());
    $$('a', mnav).forEach(a => a.addEventListener('click', () => toggle(false)));
    window.addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
  }

  /* ---------- Появление при скролле ---------- */
  const revealables = () => $$('.rv, .sp, .frame, .dir-panel, .steps').filter(el => !el.closest('.hero') && !el.closest('.page-hero'));
  const io = ('IntersectionObserver' in window && !reduce) ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -6% 0px', threshold: 0.05 }) : null;
  const observe = (els) => els.forEach(el => io ? io.observe(el) : el.classList.add('in'));
  observe(revealables());

  /* ---------- Первый экран: слайдшоу ---------- */
  const hero = $('.hero');
  if (hero) {
    const imgs = $$('.hero-bg img', hero);
    const word = $('.hero-word', hero), capT = $('.hero-caption b', hero), capM = $('.hero-caption span', hero);
    const STYLES = ['modern', 'minimal', 'neo', 'classic'];
    const WORDS = { classic: 'классика', neo: 'неоклассика', modern: 'современная', minimal: 'минимализм' };
    const AUTO = 4500;
    let cur = -1, timer = null;
    function set(i) {
      i = ((i % imgs.length) + imgs.length) % imgs.length;
      if (i === cur) return;
      const first = cur === -1; cur = i; const st = STYLES[i];
      imgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
      if (first || reduce) { hero.dataset.style = st; word.textContent = WORDS[st]; }
      else {
        word.classList.add('is-out');
        setTimeout(() => { hero.dataset.style = st; word.textContent = WORDS[st]; word.classList.remove('is-out'); }, 380);
      }
      if (capT) capT.textContent = imgs[i].dataset.title || '';
      if (capM) capM.textContent = imgs[i].dataset.meta || '';
    }
    function play() { if (reduce) return; clearInterval(timer); timer = setInterval(() => set(cur + 1), AUTO); }
    document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInterval(timer); timer = null; } else if (!timer) play(); });
    set(0); play();
  }

  /* ---------- Направления: подсветка списка при скролле ---------- */
  const panels = $$('.dir-panel');
  if (panels.length && 'IntersectionObserver' in window) {
    const items = $$('.dirs-list li');
    const pio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { const i = +e.target.dataset.i; items.forEach(li => li.classList.toggle('is-active', +li.dataset.i === i)); }
    }), { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
    panels.forEach(p => pio.observe(p));
    items.forEach(li => li.addEventListener('click', e => {
      const p = panels[+li.dataset.i]; if (!p) return;
      e.preventDefault(); window.scrollTo({ top: p.getBoundingClientRect().top + window.scrollY - 110, behavior: reduce ? 'auto' : 'smooth' });
    }));
    if (items[0]) items[0].classList.add('is-active');
  }

  /* ---------- Лайтбокс ---------- */
  const LB = (function () {
    let items = [], idx = 0, root = null, img = null, vid = null, cap = null, cnt = null, lastFocus = null;
    function build() {
      root = document.createElement('div');
      root.className = 'lb'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Просмотр фотографий');
      root.innerHTML =
        '<div class="lb-stage"><img alt=""><video playsinline controls muted loop preload="none" hidden></video>' +
        '<div class="lb-cap"><div><b></b><small></small></div><div class="lb-cnt"></div></div></div>' +
        '<button class="lb-btn lb-prev" aria-label="Предыдущее фото"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 5l-7 7 7 7"/></svg></button>' +
        '<button class="lb-btn lb-next" aria-label="Следующее фото"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5l7 7-7 7"/></svg></button>' +
        '<button class="lb-close" aria-label="Закрыть"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
      document.body.appendChild(root);
      img = $('img', root); vid = $('video', root); cap = $('.lb-cap', root); cnt = $('.lb-cnt', root);
      $('.lb-prev', root).addEventListener('click', () => show(idx - 1));
      $('.lb-next', root).addEventListener('click', () => show(idx + 1));
      $('.lb-close', root).addEventListener('click', close);
      root.addEventListener('click', e => { if (e.target === root || e.target.classList.contains('lb-stage')) close(); });
      window.addEventListener('keydown', e => {
        if (!root.classList.contains('is-open')) return;
        if (e.key === 'Escape') close(); if (e.key === 'ArrowRight') show(idx + 1); if (e.key === 'ArrowLeft') show(idx - 1);
      });
      let sx = 0;
      root.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
      root.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); }, { passive: true });
    }
    function show(i) {
      idx = ((i % items.length) + items.length) % items.length;
      const it = items[idx];
      if (it.video) { img.hidden = true; vid.hidden = false; vid.src = it.video; vid.poster = it.poster || ''; vid.play().catch(() => {}); }
      else { vid.pause(); vid.hidden = true; vid.removeAttribute('src'); img.hidden = false; img.src = IMG + it.photo + '.webp'; img.alt = it.title; }
      $('b', cap).textContent = it.title; $('small', cap).textContent = it.meta || '';
      cnt.textContent = (idx + 1) + ' / ' + items.length;
      const pre = items[(idx + 1) % items.length]; if (pre && !pre.video) { const p = new Image(); p.src = IMG + pre.photo + '.webp'; }
    }
    function open(list, start) { if (!root) build(); items = list; lastFocus = document.activeElement; root.classList.add('is-open'); document.body.style.overflow = 'hidden'; show(start || 0); $('.lb-close', root).focus(); }
    function close() { if (!root) return; root.classList.remove('is-open'); document.body.style.overflow = ''; vid.pause(); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
    return { open, close };
  })();
  function workItems(work) {
    const meta = (window.AGATA_STYLES || {})[work.style] || '';
    const list = work.photos.map(p => ({ photo: p, title: work.title, meta }));
    if (work.video) list.push({ video: 'assets/video/' + work.video + '.mp4', poster: 'assets/video/' + work.video + '-poster.jpg', title: work.title, meta: 'Видео с объекта' });
    return list;
  }
  const byPhoto = {};
  (window.WORKS || []).forEach(w => w.photos.forEach(p => { byPhoto[p] = w; }));

  /* ---------- Работы на главной: горизонтальная витрина ---------- */
  const strip = $('#strip'), track = $('#strip-track');
  if (strip && track && window.WORKS) {
    const SETS = {
      all:     ['k-taupe-1', 'k-grey-1', 'min-10', 'bath-marble-1', 'k-green-1', 'kids-room-1', 'k-blue-2', 'tv-marble-1', 'k-cream-1', 'min-6'],
      classic: ['k-cream-1', 'ward-classic-1', 'k-paris-1', 'bath-paris-1', 'kids-desk-2', 'ward-glass-1', 'ward-white-1', 'ward-classic-3'],
      neo:     ['k-taupe-1', 'k-blue-2', 'k-attic-2', 'bath-beige-1', 'k-taupe-3', 'k-woodclassic-1', 'k-blue-4', 'k-attic-1'],
      modern:  ['k-grey-1', 'k-graphite-1', 'k-oak-1', 'k-bar-1', 'hall-wood-1', 'k-green-1', 'k-white-1', 'k-loft-1'],
      minimal: ['min-2', 'min-10', 'min-6', 'min-1', 'min-8', 'min-4', 'bath-black-1', 'min-12']
    };
    const POS = { 'k-grey-1': '40% 50%', 'k-green-1': '50% 60%', 'kids-room-1': '60% 50%' };
    const progress = $('.strip-progress i');
    function render(key) {
      const set = SETS[key] || SETS.all;
      track.innerHTML = set.map(p => {
        const w = byPhoto[p]; if (!w) return '';
        const st = window.AGATA_STYLES[w.style] || '';
        const n = w.photos.length + (w.video ? 1 : 0);
        return '<button class="frame' + (isLand(p) ? ' is-land' : '') + '" type="button" data-photo="' + p + '" aria-label="' + w.title + ' — открыть фотографии">' +
          (n > 1 ? '<span class="frame-cnt">' + n + ' фото</span>' : '<span class="frame-cnt">Открыть</span>') +
          '<img src="' + IMG + p + '.webp" srcset="' + IMG + p + '-800.webp 800w, ' + IMG + p + '.webp 1600w" sizes="(max-width:900px) 78vw, 34vw" alt="' + w.title + '" decoding="async"' + (POS[p] ? ' style="object-position:' + POS[p] + '"' : '') + '>' +
          '<span class="frame-cap">' + w.title + '<small>' + st + '</small></span></button>';
      }).join('');
      strip.scrollTo({ left: 0 });
      observe($$('.frame', track));
      updateProgress(); if (typeof syncNav === 'function') syncNav();
    }
    function updateProgress() {
      if (!progress) return;
      const max = strip.scrollWidth - strip.clientWidth; const p = max > 0 ? strip.scrollLeft / max : 0;
      const w = Math.max(.12, strip.clientWidth / strip.scrollWidth);
      progress.style.width = (w * 100) + '%'; progress.style.transform = 'translateX(' + (p * (1 / w - 1) * 100) + '%)';
    }
    const hint = $('.strip-hint'), navBtns = $$('.strip-nav button');
    function syncNav() {
      const max = strip.scrollWidth - strip.clientWidth - 2;
      navBtns.forEach(b => { b.disabled = +b.dataset.dir < 0 ? strip.scrollLeft <= 2 : strip.scrollLeft >= max; });
      if (hint && strip.scrollLeft > 30) hint.classList.add('is-hidden');
    }
    strip.addEventListener('scroll', () => { updateProgress(); syncNav(); }, { passive: true });
    window.addEventListener('resize', updateProgress);
    // перетаскивание мышью
    let down = false, sx = 0, sl = 0, moved = 0;
    strip.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = strip.scrollLeft; strip.classList.add('is-dragging'); });
    window.addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx)); strip.scrollLeft = sl - dx; });
    window.addEventListener('pointerup', () => { if (!down) return; down = false; setTimeout(() => strip.classList.remove('is-dragging'), 50); });
    track.addEventListener('click', e => {
      const b = e.target.closest('.frame'); if (!b || moved > 6) return;
      const w = byPhoto[b.dataset.photo]; if (w) LB.open(workItems(w), Math.max(0, w.photos.indexOf(b.dataset.photo)));
    });
    $$('.strip-nav button').forEach(b => b.addEventListener('click', () => {
      const f = $('.frame', track); const step = f ? f.getBoundingClientRect().width + 20 : 400;
      strip.scrollBy({ left: step * +b.dataset.dir, behavior: reduce ? 'auto' : 'smooth' });
    }));
    const setTab = (key) => {
      const t = $$('.tabs .tab').find(x => x.dataset.style === key) || $$('.tabs .tab')[0];
      if (!t || t.classList.contains('is-active')) return;
      $$('.tabs .tab').forEach(x => x.classList.toggle('is-active', x === t));
      render(t.dataset.style);
    };
    $$('.tabs .tab').forEach(t => t.addEventListener('click', () => setTab(t.dataset.style)));
    render('all');
  }

  /* ---------- Портфолио: фильтры ---------- */
  const gridAll = $('#grid-works');
  if (gridAll && window.WORKS) {
    let type = 'all', style = 'all';
    const params = new URLSearchParams(location.search);
    if (params.get('type')) type = params.get('type'); if (params.get('style')) style = params.get('style');
    const cnt = $('#grid-count');
    const plural = (n, f) => { const m = n % 100; if (m > 10 && m < 20) return f[2]; const k = m % 10; return k === 1 ? f[0] : (k > 1 && k < 5 ? f[1] : f[2]); };
    function render() {
      const list = window.WORKS.filter(w => (type === 'all' || w.type.includes(type)) && (style === 'all' || w.style === style));
      $$('[data-type]').forEach(b => b.classList.toggle('is-active', b.dataset.type === type));
      $$('[data-style]').forEach(b => b.classList.toggle('is-active', b.dataset.style === style));
      if (cnt) cnt.textContent = list.length ? list.length + ' ' + plural(list.length, ['проект', 'проекта', 'проектов']) : '';
      gridAll.innerHTML = list.length ? list.map(w => {
        const n = w.photos.length + (w.video ? 1 : 0);
        return '<button class="gw rv" type="button" data-id="' + w.id + '">' +
          '<span class="gw-img"><img src="' + IMG + w.photos[0] + '-800.webp" alt="' + w.title + '" loading="lazy" decoding="async">' + (n > 1 ? '<span class="gw-cnt">' + n + ' фото</span>' : '') + '</span>' +
          '<span class="gw-body"><h3>' + w.title + '</h3><small>' + window.AGATA_STYLES[w.style] + ' · ' + w.type.map(t => window.AGATA_TYPES[t]).join(', ') + '</small></span></button>';
      }).join('') : '<p class="grid-empty">В этом сочетании пока нет опубликованных работ — но мы такое делаем. Напишите, покажем примеры.</p>';
      observe($$('.gw', gridAll));
      const u = new URL(location.href);
      type === 'all' ? u.searchParams.delete('type') : u.searchParams.set('type', type);
      style === 'all' ? u.searchParams.delete('style') : u.searchParams.set('style', style);
      history.replaceState(null, '', u);
    }
    $$('[data-type]').forEach(b => b.addEventListener('click', () => { type = b.dataset.type; render(); }));
    $$('[data-style]').forEach(b => b.addEventListener('click', () => { style = b.dataset.style; render(); }));
    gridAll.addEventListener('click', e => { const b = e.target.closest('.gw'); if (!b) return; const w = window.WORKS.find(x => x.id === b.dataset.id); if (w) LB.open(workItems(w), 0); });
    render();
  }

  /* ---------- Лайтбокс с любых [data-work] ---------- */
  $$('[data-work]').forEach(el => el.addEventListener('click', e => {
    const w = (window.WORKS || []).find(x => x.id === el.dataset.work); if (!w) return;
    e.preventDefault(); LB.open(workItems(w), Number(el.dataset.index || 0));
  }));

  /* ---------- Формы ---------- */
  $$('form[data-lead]').forEach(form => {
    const msg = $('.form-msg', form), btn = $('button[type=submit]', form), phone = $('input[name=phone]', form);
    if (phone) phone.addEventListener('input', () => {
      let d = phone.value.replace(/\D/g, ''); if (d.startsWith('8')) d = '7' + d.slice(1); if (d && !d.startsWith('7')) d = '7' + d; d = d.slice(0, 11);
      let out = ''; if (d.length) out = '+7'; if (d.length > 1) out += ' (' + d.slice(1, 4); if (d.length >= 4) out += ') ' + d.slice(4, 7); if (d.length >= 7) out += '-' + d.slice(7, 9); if (d.length >= 9) out += '-' + d.slice(9, 11);
      phone.value = out;
    });
    form.addEventListener('submit', async e => {
      e.preventDefault(); msg.className = 'form-msg'; msg.textContent = '';
      const name = $('input[name=name]', form), agree = $('input[name=agree]', form); let ok = true;
      if (name && name.value.trim().length < 2) { name.classList.add('is-invalid'); ok = false; } else if (name) name.classList.remove('is-invalid');
      if (phone && phone.value.replace(/\D/g, '').length !== 11) { phone.classList.add('is-invalid'); ok = false; } else if (phone) phone.classList.remove('is-invalid');
      if (agree && !agree.checked) { ok = false; msg.className = 'form-msg err'; msg.textContent = 'Поставьте галочку согласия на обработку данных.'; }
      if (!ok) { if (!msg.textContent) { msg.className = 'form-msg err'; msg.textContent = 'Проверьте имя и номер телефона.'; } return; }
      const fd = new FormData(form); fd.append('page', location.href);
      /* Демо-показ на GitHub Pages: сервера нет, показываем подтверждение на месте */
      if (/github\.io$/.test(location.hostname) || location.protocol === 'file:') {
        form.classList.add('is-sent');
        msg.className = 'form-msg ok';
        msg.textContent = 'Спасибо! Это демонстрационный показ макета — на рабочем сайте заявка уйдёт менеджеру.';
        goal('lead_sent');
        return;
      }
      btn.disabled = true; const label = btn.innerHTML; btn.textContent = 'Отправляем…';
      try {
        const res = await fetch(form.getAttribute('action') || 'send.php', { method: 'POST', body: fd });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) throw new Error(data.error || 'Не удалось отправить');
        form.classList.add('is-sent'); msg.className = 'form-msg ok'; msg.textContent = 'Спасибо! Заявка принята — перезвоним в ближайшее рабочее время.'; goal('lead_sent');
      } catch (err) {
        msg.className = 'form-msg err'; msg.textContent = 'Не получилось отправить. Позвоните нам: +7 (906) 238-49-50 или напишите в WhatsApp.';
      } finally { btn.disabled = false; btn.innerHTML = label; }
    });
  });

  /* ---------- Подгрузка фото витрины и панелей заранее (за экран до появления) ---------- */
  if ('IntersectionObserver' in window) {
    const eager = (root) => $$('img[loading=lazy]', root).forEach(i => { i.loading = 'eager'; });
    const pre = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { eager(e.target); pre.unobserve(e.target); } }), { rootMargin: '900px 0px' });
    $$('.works-sec, .dirs, .stone-sec').forEach(el => pre.observe(el));
    const trackEl = $('#strip-track');
    if (trackEl) new MutationObserver(() => { const r = trackEl.getBoundingClientRect(); if (r.top < window.innerHeight + 900) eager(trackEl); }).observe(trackEl, { childList: true });
  }

  /* ---------- Видео по видимости ---------- */
  $$('video[data-autoplay]').forEach(v => {
    if (reduce) return;
    if (!('IntersectionObserver' in window)) { v.play().catch(() => {}); return; }
    new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { threshold: 0.25 }).observe(v);
  });

  /* ---------- Параллакс ---------- */
  const par = $$('[data-parallax]');
  if (par.length && !reduce) {
    let ticking = false;
    const update = () => { ticking = false; const vh = window.innerHeight; par.forEach(el => { const r = el.parentElement.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return; const p = (r.top + r.height / 2 - vh / 2) / vh; el.style.transform = 'translateY(' + (p * -70).toFixed(1) + 'px)'; }); };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true }); update();
  }

  /* ---------- Нижняя панель действий на телефоне ---------- */
  const mbar = $('#mbar');
  if (mbar) {
    const small = () => window.matchMedia('(max-width: 900px)').matches;
    const heroEl = $('.hero') || $('.page-hero');
    const sync = () => {
      if (!small()) { mbar.classList.remove('is-on'); document.body.classList.remove('mbar-on'); return; }
      const past = heroEl ? window.scrollY > heroEl.offsetHeight * 0.6 : window.scrollY > 300;
      const blocked = document.body.style.overflow === 'hidden';
      mbar.classList.toggle('is-on', past && !blocked);
      document.body.classList.toggle('mbar-on', past && !blocked);
    };
    window.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    document.addEventListener('click', () => setTimeout(sync, 60));
    sync();
  }

  /* ---------- Кнопки MAX: показываем, только если ссылка задана ---------- */
  $$('[data-max]').forEach(el => {
    const url = MAX_LINKS[el.dataset.max];
    if (!url) return;
    el.href = url; el.hidden = false;
  });

  /* ---------- Цели, год, активный пункт ---------- */
  $$('a[href^="tel:"]').forEach(a => a.addEventListener('click', () => goal('phone_click')));
  $$('a[href*="wa.me"], a[href*="t.me"], a[href*="vk.com"]').forEach(a => a.addEventListener('click', () => goal('messenger')));
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  const here = location.pathname.split('/').pop() || 'index.html';
  $$('.nav a').forEach(a => { if (a.getAttribute('href') === here) a.classList.add('is-current'); });
})();
