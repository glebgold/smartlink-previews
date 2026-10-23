/*
  Логика страницы: рисует меню из menu.js, подсвечивает текущий раздел,
  ищет по блюдам и открывает карточку блюда. Цены и тексты правятся в menu.js.
*/
(() => {
  'use strict';

  const M = window.MENU;
  const main = document.getElementById('menu');
  if (!M || !main) return;

  const place = M.place || {};
  const cats = M.categories || [];
  const addons = M.addons && M.addons.items && M.addons.items.length ? M.addons : null;
  const breads = M.breads || [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- утилиты ---------- */

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
  const norm = (s) => String(s ?? '').toLowerCase().replace(/ё/g, 'е');
  const toMinutes = (t) => {
    const [h, m] = String(t).split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const orList = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} или ${xs[xs.length - 1]}`);
  const rub = (p) => `${p} ₽`;
  const scrollBehavior = () => (reduceMotion.matches ? 'auto' : 'smooth');

  // Для маленьких картинок берём уменьшенную копию «имя-sm.jpg» рядом с фото.
  // Ссылки на Unsplash запрашиваем сразу нужного размера.
  const SMALL = 420;
  const photoUrl = (src, w, h) => {
    if (!src) return '';
    if (src.startsWith('https://images.unsplash.com/')) {
      const url = new URL(src);
      url.search = new URLSearchParams({ w, h, fit: 'crop', auto: 'format', q: '70' });
      return url.href;
    }
    if (w <= SMALL && !/^[a-z]+:/i.test(src)) return src.replace(/\.(jpe?g|png|webp)$/i, '-sm.$1');
    return src;
  };

  // Если уменьшенной копии нет, один раз пробуем основное фото.
  const retryFull = (img) => {
    const src = img.getAttribute('src') || '';
    if (img.dataset.retried || !/-sm\.(jpe?g|png|webp)$/i.test(src)) return false;
    img.dataset.retried = '1';
    img.src = src.replace(/-sm\.(jpe?g|png|webp)$/i, '.$1');
    return true;
  };

  // Опции раздела действуют на все его блюда, кроме standalone.
  const chooseOf = (cat, item) => [...(item.standalone ? [] : cat.choose || []), ...(item.choose || [])];
  const extrasOf = (cat, item) => (item.standalone ? [] : cat.extras || []);
  const chooseText = (groups) => groups.map((g) => `${g.title}: ${orList(g.options)}.`).join(' ');

  const leader = (label, price, search) => `
    <li class="leader"${search ? ` data-search="${esc(norm(search))}"` : ''}>
      <span class="leader__label">${esc(label)}</span>
      <span class="leader__dots" aria-hidden="true"></span>
      <span class="leader__price">${esc(price)}</span>
    </li>`;

  const ICON_ALLERGY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5"/><circle cx="12" cy="16.6" r=".7" fill="currentColor" stroke="none"/></svg>';

  /* ---------- шапка ---------- */

  const hero = document.getElementById('hero');
  const plates = (place.heroPhotos || []).slice(0, 2);

  hero.innerHTML = `
    <div class="hero__inner">
      <div class="hero__text">
        ${place.name ? `<p class="hero__place">${esc(place.name)}</p>` : ''}
        <h1 class="hero__title">${esc(place.title || 'меню')}</h1>
        <p class="hero__hours">${esc(place.opens)}–${esc(place.closes)}</p>
        <p class="status" id="status"></p>
      </div>
      ${plates.length ? `
      <div class="hero__plates" aria-hidden="true">
        ${plates.map((src, i) => `<img class="plate ${i ? 'plate--small' : 'plate--big'}" src="${esc(photoUrl(src, i ? 240 : 420, i ? 240 : 420))}" alt="" decoding="async">`).join('')}
      </div>` : ''}
      ${place.allergy ? `<p class="allergy">${ICON_ALLERGY}<span>${esc(place.allergy)}</span></p>` : ''}
    </div>`;

  hero.querySelectorAll('.plate').forEach((img) => img.addEventListener('error', () => {
    if (!retryFull(img)) img.remove();
  }));
  if (place.name) document.title = `${place.name} — меню кухни`;

  /* ---------- меню ---------- */

  const dishRow = (cat, item, ci, ii) => {
    const eager = ci === 0 && ii < 3;
    const media = item.photo
      ? `<img class="dish__photo" src="${esc(photoUrl(item.photo, 300, 300))}" alt="" width="96" height="96" decoding="async"${eager ? '' : ' loading="lazy"'}>`
      : '<span class="dish__photo dish__photo--empty" aria-hidden="true"></span>';
    const own = item.choose ? chooseText(item.choose) : '';
    const rows = [
      ...(item.variants || []).map((v) => leader(v.label, v.price)),
      ...(item.add || []).map(([label, price]) => leader(label, price)),
    ].join('');
    const search = [
      cat.title, item.name, item.desc, own,
      ...(item.variants || []).map((v) => v.label),
      ...(item.add || []).map(([label]) => label),
    ].join(' ');

    return `
      <li class="dish" data-search="${esc(norm(search))}">
        ${media}
        <div class="dish__body">
          <div class="dish__top">
            <h3 class="dish__name"><button class="dish__open" type="button" data-dish="${ci}:${ii}" aria-haspopup="dialog">${esc(item.name)}</button></h3>
            ${item.variants ? '' : `<span class="dish__price">${esc(item.price)}</span>`}
          </div>
          ${item.desc ? `<p class="dish__desc">${esc(item.desc)}</p>` : ''}
          ${own ? `<p class="dish__choose">${esc(own)}</p>` : ''}
          ${rows ? `<ul class="leaders">${rows}</ul>` : ''}
        </div>
      </li>`;
  };

  const section = (cat, ci) => {
    const note = [cat.note, chooseText(cat.choose || [])].filter(Boolean).join(' ');
    return `
      <section class="cat" id="${esc(cat.id)}" aria-labelledby="t-${esc(cat.id)}">
        <div class="cat__head">
          <h2 class="cat__title" id="t-${esc(cat.id)}">${esc(cat.title)}</h2>
          ${cat.until ? `<span class="cat__until" data-until="${esc(cat.until)}">до ${esc(cat.until)}</span>` : ''}
        </div>
        ${note ? `<p class="cat__note">${esc(note)}</p>` : ''}
        <ul class="dishes">${cat.items.map((item, ii) => dishRow(cat, item, ci, ii)).join('')}</ul>
        ${cat.extras?.length ? `<ul class="leaders leaders--extras">${cat.extras.map(([label, price]) => leader(label, price, `${cat.title} ${label}`)).join('')}</ul>` : ''}
      </section>`;
  };

  const breadsSection = () => (breads.length ? `
      <section class="cat" id="hleb-na-vybor" aria-labelledby="t-breads">
        <div class="cat__head"><h2 class="cat__title" id="t-breads">хлеб на выбор</h2></div>
        <ul class="chips chips--section" data-search="${esc(norm(`хлеб ${breads.join(' ')}`))}">${breads.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      </section>` : '');

  const addonsSection = () => (addons ? `
      <section class="cat cat--addons" id="${esc(addons.id || 'dobavki')}" aria-labelledby="t-addons">
        <div class="cat__head"><h2 class="cat__title" id="t-addons">${esc(addons.title)}</h2></div>
        <ul class="leaders leaders--grid">${addons.items.map(([label, price]) => leader(label, price, `${addons.title} ${label}`)).join('')}</ul>
      </section>` : '');

  main.innerHTML = cats.map(section).join('') + breadsSection() + addonsSection() + `
    <div class="empty" id="empty" hidden>
      <p class="empty__title">Ничего не нашли по запросу «<span id="empty-q"></span>»</p>
      <p class="empty__text">Проверьте написание или поищите иначе — например, «сырники» или «лосось».</p>
      <button class="empty__reset" type="button">Показать всё меню</button>
    </div>`;

  document.getElementById('foot').innerHTML = `
    <p>Кухня работает с ${esc(place.opens)} до ${esc(place.closes)}. Цены указаны в рублях.</p>
    ${place.photoNote ? `<p>${esc(place.photoNote)}</p>` : ''}`;

  /* ---------- фото: плавное появление и заглушка, если не загрузилось ---------- */

  const showPhoto = (img) => img.classList.add('is-ready');
  const replaceBroken = (img) => {
    const stub = document.createElement('span');
    stub.className = 'dish__photo dish__photo--empty';
    stub.setAttribute('aria-hidden', 'true');
    img.replaceWith(stub);
  };

  main.addEventListener('load', (e) => { if (e.target.matches?.('img.dish__photo')) showPhoto(e.target); }, true);
  main.addEventListener('error', (e) => {
    const img = e.target;
    if (img.matches?.('img.dish__photo') && !retryFull(img)) replaceBroken(img);
  }, true);
  main.querySelectorAll('img.dish__photo').forEach((img) => {
    if (!img.complete) return;
    if (img.naturalWidth) showPhoto(img);
    else if (!retryFull(img)) replaceBroken(img);
  });

  /* ---------- открыта ли кухня ---------- */

  const statusEl = document.getElementById('status');
  const untilEls = [...main.querySelectorAll('[data-until]')];

  const tick = () => {
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const opens = toMinutes(place.opens);
    const closes = toMinutes(place.closes);
    let state = 'closed';
    let text = 'Сейчас закрыта';
    if (cur >= opens && cur < closes) {
      state = closes - cur <= 30 ? 'soon' : 'open';
      text = state === 'soon' ? `Закроется в ${place.closes}` : 'Сейчас открыта';
    }
    statusEl.dataset.state = state;
    statusEl.textContent = text;

    untilEls.forEach((el) => {
      const over = cur >= toMinutes(el.dataset.until);
      el.toggleAttribute('data-over', over);
      el.textContent = `${over ? 'только до' : 'до'} ${el.dataset.until}`;
    });
  };

  tick();
  setInterval(tick, 60 * 1000);

  /* ---------- навигация по разделам ---------- */

  const nav = document.getElementById('nav');
  const navLinks = document.getElementById('nav-links');
  const sectionsList = [
    ...cats.map((c) => ({ id: c.id, label: c.nav || c.title })),
    ...(breads.length ? [{ id: 'hleb-na-vybor', label: 'хлеб на выбор' }] : []),
    ...(addons ? [{ id: addons.id || 'dobavki', label: addons.nav || addons.title }] : []),
  ];

  navLinks.innerHTML = sectionsList
    .map((s) => `<a class="nav__link" href="#${esc(s.id)}" data-target="${esc(s.id)}">${esc(s.label)}</a>`)
    .join('') + '<span class="nav__ink" aria-hidden="true"></span>';

  const links = [...navLinks.querySelectorAll('.nav__link')];
  const targets = links.map((a) => document.getElementById(a.dataset.target));
  const ink = navLinks.querySelector('.nav__ink');
  let activeLink = null;

  const placeInk = () => {
    if (!activeLink || !activeLink.offsetWidth) return;
    const first = ink.style.opacity !== '1';
    if (first) ink.style.transition = 'none';
    ink.style.width = `${activeLink.offsetWidth - 20}px`;
    ink.style.transform = `translateX(${activeLink.offsetLeft + 10}px)`;
    ink.style.opacity = '1';
    if (first) {
      ink.getBoundingClientRect();
      ink.style.transition = '';
    }
  };

  const setActive = (link) => {
    if (link === activeLink) return;
    activeLink?.removeAttribute('aria-current');
    activeLink = link;
    if (!link) {
      ink.style.opacity = '0';
      return;
    }
    link.setAttribute('aria-current', 'true');
    placeInk();
    const left = link.offsetLeft - (navLinks.clientWidth - link.offsetWidth) / 2;
    navLinks.scrollTo({ left: Math.max(0, left), behavior: scrollBehavior() });
  };

  let scrollQueued = false;
  const onScroll = () => {
    scrollQueued = false;
    const line = nav.offsetHeight + 40;
    let current = null;
    targets.forEach((t, i) => {
      if (t && !t.hidden && t.getBoundingClientRect().top <= line) current = links[i];
    });
    const root = document.documentElement;
    if (window.innerHeight + window.scrollY >= root.scrollHeight - 2) {
      const last = targets.map((t, i) => (t && !t.hidden ? links[i] : null)).filter(Boolean).pop();
      if (last) current = last;
    }
    setActive(current || links.find((a, i) => targets[i] && !targets[i].hidden) || null);
    nav.classList.toggle('is-stuck', window.scrollY > 0 && nav.getBoundingClientRect().top <= 0);
  };

  window.addEventListener('scroll', () => {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(onScroll);
  }, { passive: true });
  window.addEventListener('resize', () => { placeInk(); onScroll(); });
  document.fonts?.ready.then(placeInk);

  navLinks.addEventListener('click', (e) => {
    const a = e.target.closest('.nav__link');
    const target = a && document.getElementById(a.dataset.target);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    history.replaceState(history.state, '', `#${a.dataset.target}`);
  });

  // Ссылка вида …/#syrniki открывает сразу нужный раздел.
  if (location.hash.length > 1) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target && main.contains(target)) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  }
  onScroll();

  /* ---------- поиск ---------- */

  const searchForm = document.getElementById('search');
  const searchInput = document.getElementById('search-input');
  const searchOpen = document.getElementById('search-open');
  const sections = [...main.querySelectorAll('.cat')];
  const empty = document.getElementById('empty');
  const emptyQuery = document.getElementById('empty-q');

  const filter = (query) => {
    const words = norm(query).trim().split(/\s+/).filter(Boolean);
    let found = 0;
    sections.forEach((sec) => {
      let shown = 0;
      sec.querySelectorAll('[data-search]').forEach((el) => {
        const ok = words.every((w) => el.dataset.search.includes(w));
        el.hidden = !ok;
        if (ok) shown += 1;
      });
      sec.querySelectorAll('.leaders--extras, .leaders--grid').forEach((ul) => {
        ul.hidden = ![...ul.children].some((li) => !li.hidden);
      });
      sec.hidden = shown === 0;
      found += shown;
    });
    emptyQuery.textContent = query.trim();
    empty.hidden = found > 0;
  };

  const menuTop = () => hero.offsetHeight;

  const openSearch = () => {
    nav.classList.add('is-searching');
    searchForm.hidden = false;
    if (window.scrollY < menuTop()) window.scrollTo({ top: menuTop() });
    searchInput.focus();
  };

  const closeSearch = () => {
    searchInput.value = '';
    filter('');
    searchForm.hidden = true;
    nav.classList.remove('is-searching');
    searchOpen.focus({ preventScroll: true });
    requestAnimationFrame(() => { placeInk(); onScroll(); });
  };

  searchOpen.addEventListener('click', openSearch);
  document.getElementById('search-cancel').addEventListener('click', closeSearch);
  searchInput.addEventListener('input', () => {
    filter(searchInput.value);
    window.scrollTo({ top: menuTop() });
  });
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSearch(); });
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    searchInput.blur();
  });

  /* ---------- карточка блюда ---------- */

  const sheet = document.getElementById('sheet');
  const sheetMedia = sheet.querySelector('.sheet__media');
  const sheetImg = sheet.querySelector('.sheet__photo');
  const sheetCat = sheet.querySelector('.sheet__cat');
  const sheetTitle = sheet.querySelector('.sheet__title');
  const sheetPrice = sheet.querySelector('.sheet__price');
  const sheetDesc = sheet.querySelector('.sheet__desc');
  const sheetExtra = sheet.querySelector('.sheet__extra');
  sheet.querySelector('.sheet__allergy').textContent = place.allergy || '';

  const group = (title, body) => `<section class="sheet__group"><h3>${esc(title)}</h3>${body}</section>`;
  const chipList = (xs) => `<ul class="chips">${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const priceList = (pairs) => `<ul class="leaders">${pairs.map(([label, price]) => leader(label, rub(price))).join('')}</ul>`;

  sheetImg.addEventListener('load', () => sheetImg.classList.add('is-ready'));
  sheetImg.addEventListener('error', () => { if (sheetImg.getAttribute('src')) sheet.classList.add('no-photo'); });

  // Карточка добавляет запись в историю, чтобы «назад» на Android закрывал её, а не меню.
  let sheetInHistory = false;
  if (history.state?.dishSheet) history.replaceState(null, ''); // остаток после перезагрузки

  const openDish = (ci, ii) => {
    const cat = cats[ci];
    const item = cat?.items?.[ii];
    if (!item) return;

    sheetImg.classList.remove('is-ready');
    sheetImg.removeAttribute('src');
    sheet.classList.toggle('no-photo', !item.photo);
    sheetMedia.style.backgroundImage = item.photo ? `url("${photoUrl(item.photo, 300, 300)}")` : '';
    if (item.photo) sheetImg.src = photoUrl(item.photo, 1080, 810);

    sheetCat.textContent = cat.until ? `${cat.title}, до ${cat.until}` : cat.title;
    sheetTitle.textContent = item.name;
    sheetPrice.textContent = item.variants ? '' : rub(item.price);
    sheetDesc.textContent = item.desc || '';
    sheetDesc.hidden = !item.desc;

    const parts = [];
    if (item.variants) parts.push(group('Варианты', priceList(item.variants.map((v) => [v.label, v.price]))));
    chooseOf(cat, item).forEach((g) => parts.push(group(g.title, chipList(g.options))));
    if ((cat.bread || item.bread) && breads.length) parts.push(group('Хлеб на выбор', chipList(breads)));
    if (item.add?.length) parts.push(group('Можно добавить', priceList(item.add)));
    const extras = extrasOf(cat, item);
    if (extras.length) parts.push(group('Дополнительно', priceList(extras)));
    if (cat.addons && addons) parts.push(group('Рекомендуем добавить', priceList(addons.items)));
    sheetExtra.innerHTML = parts.join('');

    sheet.style.transform = '';
    if (!sheet.open) {
      sheet.showModal();
      history.pushState({ dishSheet: true }, '');
      sheetInHistory = true;
    }
    sheet.scrollTop = 0;
  };

  let closeTimer = 0;

  const finishClose = () => {
    clearTimeout(closeTimer);
    sheet.classList.remove('is-closing');
    sheet.style.transform = '';
    if (sheet.open) sheet.close();
  };

  const closeSheet = (fromHistory = false) => {
    if (!sheet.open || sheet.classList.contains('is-closing')) return;
    if (sheetInHistory && !fromHistory) history.back();
    sheetInHistory = false;

    if (reduceMotion.matches) {
      finishClose();
      return;
    }
    sheet.classList.add('is-closing');
    closeTimer = setTimeout(finishClose, 450); // если анимация не отыграла (вкладка в фоне)
  };

  sheet.addEventListener('animationend', (e) => {
    if (e.target === sheet && sheet.classList.contains('is-closing')) finishClose();
  });

  main.addEventListener('click', (e) => {
    const btn = e.target.closest('.dish__open');
    if (btn) {
      const [ci, ii] = btn.dataset.dish.split(':').map(Number);
      openDish(ci, ii);
      return;
    }
    if (e.target.closest('.empty__reset')) closeSearch();
  });

  sheet.querySelector('.sheet__close').addEventListener('click', () => closeSheet());
  sheet.addEventListener('cancel', (e) => {
    e.preventDefault();
    closeSheet();
  });
  sheet.addEventListener('click', (e) => { if (e.target === sheet) closeSheet(); });
  window.addEventListener('popstate', () => { if (sheet.open) closeSheet(true); });

  // Смахивание вниз закрывает карточку.
  let startY = 0;
  let dragY = 0;
  let tracking = false;
  let dragging = false;

  sheet.addEventListener('touchstart', (e) => {
    tracking = sheet.scrollTop <= 0 && e.touches.length === 1;
    dragging = false;
    dragY = 0;
    startY = e.touches[0].clientY;
  }, { passive: true });

  sheet.addEventListener('touchmove', (e) => {
    if (!tracking) return;
    const delta = e.touches[0].clientY - startY;
    if (!dragging) {
      if (delta < -4) tracking = false;
      if (delta <= 8) return;
      dragging = true;
    }
    dragY = Math.max(0, delta - 8);
    sheet.style.transform = `translateY(${dragY}px)`;
    e.preventDefault();
  }, { passive: false });

  const endDrag = () => {
    tracking = false;
    if (!dragging) return;
    dragging = false;
    if (dragY > Math.min(140, sheet.offsetHeight * 0.25)) {
      closeSheet();
      return;
    }
    sheet.classList.add('is-snapping');
    sheet.style.transform = '';
    setTimeout(() => sheet.classList.remove('is-snapping'), 260);
  };

  sheet.addEventListener('touchend', endDrag);
  sheet.addEventListener('touchcancel', endDrag);
})();
