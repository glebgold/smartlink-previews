// Home Design — поведение сайта: смена фото на первом экране, появление блоков,
// чертёж по этапам, фильтр проектов, просмотр фото и демо-форма.
// Прокрутка нативная. Эффекты, привязанные к прокрутке (параллакс, девиз), сделаны
// на CSS scroll-driven animations — скрипт в каждом кадре ничего не пересчитывает.

window.__hdReady = true;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wide = matchMedia('(min-width: 900px)');

// Шапка: линия после начала прокрутки, прячется при движении вниз
const header = document.querySelector('.site-header');
let lastY = scrollY;
let headerQueued = false;
addEventListener(
  'scroll',
  () => {
    if (headerQueued) return;
    headerQueued = true;
    requestAnimationFrame(() => {
      headerQueued = false;
      const y = scrollY;
      header.classList.toggle('is-scrolled', y > 8);
      if (!document.body.classList.contains('menu-open')) {
        if (y > lastY + 4 && y > 200) header.classList.add('is-hidden');
        else if (y < lastY - 4 || y <= 200) header.classList.remove('is-hidden');
      }
      lastY = y;
    });
  },
  { passive: true }
);
header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

// Меню на телефоне
const burger = document.querySelector('.burger');
const sheet = document.getElementById('nav-sheet');
if (burger && sheet) {
  const closeBtn = sheet.querySelector('.nav-sheet__close');
  const open = () => {
    sheet.hidden = false;
    requestAnimationFrame(() => sheet.classList.add('is-open'));
    burger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('menu-open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };
  const close = ({ restoreFocus = true } = {}) => {
    sheet.classList.remove('is-open');
    sheet.hidden = true;
    burger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
    if (restoreFocus) burger.focus();
  };
  burger.addEventListener('click', open);
  closeBtn.addEventListener('click', () => close());
  sheet.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
  sheet.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => close({ restoreFocus: false })));
}

// Появление заголовков, текста и фото при прокрутке
const revealItems = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' }
  );
  revealItems.forEach((el) => io.observe(el));
} else {
  revealItems.forEach((el) => el.classList.add('is-in'));
}

// Первый экран: фото трёх направлений сменяют друг друга, полоска под названием
// показывает время до следующего. Наведение или фокус на направлении сразу показывает его фото.
const slides = [...document.querySelectorAll('.hero__slide')];
const dirLinks = [...document.querySelectorAll('.hero__dir')];
if (slides.length > 1 && dirLinks.length === slides.length) {
  let current = 0;
  const run = () => {
    if (reduceMotion) return;
    const link = dirLinks[current];
    link.classList.remove('is-run');
    void link.offsetWidth;
    link.classList.add('is-run');
  };
  const show = (n) => {
    const prev = slides[current];
    current = (n + slides.length) % slides.length;
    prev.classList.remove('is-active');
    prev.classList.add('is-prev');
    setTimeout(() => prev.classList.remove('is-prev'), 1700);
    slides[current].classList.add('is-active');
    dirLinks.forEach((link, i) => {
      link.classList.toggle('is-active', i === current);
      link.classList.remove('is-run');
    });
    run();
  };
  dirLinks.forEach((link, i) => {
    link.querySelector('.hero__dir-bar').addEventListener('animationend', () => show(current + 1));
    const preview = () => {
      if (i !== current) show(i);
    };
    link.addEventListener('pointerenter', preview);
    link.addEventListener('focus', preview);
  });
  setTimeout(run, 600);
}

// Этапы работы: чертёж достраивается слоями вместе с этапами
document.querySelectorAll('[data-steps]').forEach((section) => {
  const plan = section.querySelector('.fplan');
  const layers = [...plan.querySelectorAll('[data-layer]')];
  const items = [...section.querySelectorAll('.steps li')];
  const setStep = (n) => {
    layers.forEach((l) => l.classList.toggle('is-on', Number(l.dataset.layer) <= n));
    items.forEach((li, i) => li.classList.toggle('is-active', i === n - 1));
  };
  if (reduceMotion || !wide.matches) {
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        setStep(layers.length);
        items.forEach((li) => li.classList.add('is-active'));
        io.disconnect();
      },
      { threshold: 0.25 }
    );
    io.observe(plan);
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) setStep(items.indexOf(e.target) + 1);
    },
    { rootMargin: '-48% 0px -48% 0px' }
  );
  items.forEach((li) => io.observe(li));
});

// Цены набегают от нуля
if (!reduceMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        const el = e.target;
        const end = Number(el.dataset.count);
        const start = performance.now();
        requestAnimationFrame(function step(now) {
          const k = Math.min(1, (now - start) / 1400);
          el.textContent = (Math.round((end * (1 - Math.pow(1 - k, 4))) / 10) * 10).toLocaleString('ru-RU');
          if (k < 1) requestAnimationFrame(step);
        });
      }
    },
    { threshold: 0.6 }
  );
  document.querySelectorAll('[data-count]').forEach((el) => {
    el.textContent = '0';
    io.observe(el);
  });
}

// Фильтр проектов
const chips = [...document.querySelectorAll('[data-filter]')];
const cards = [...document.querySelectorAll('.project-grid [data-tags]')];
const filterStatus = document.getElementById('filter-status');
chips.forEach((chip) =>
  chip.addEventListener('click', () => {
    const tag = chip.dataset.filter;
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    let shown = 0;
    cards.forEach((card) => {
      const match = tag === 'all' || card.dataset.tags.split(' ').includes(tag);
      card.hidden = !match;
      if (match) shown += 1;
    });
    if (filterStatus) filterStatus.textContent = `Показано проектов: ${shown}`;
  })
);

// Просмотр фото
const lightbox = document.getElementById('lightbox');
if (lightbox) {
  const links = [...document.querySelectorAll('[data-lightbox]')];
  const image = lightbox.querySelector('.lightbox__img');
  const counter = lightbox.querySelector('.lightbox__count');
  let index = 0;
  const show = (n) => {
    index = (n + links.length) % links.length;
    const link = links[index];
    image.src = link.href;
    image.alt = link.querySelector('img')?.alt || '';
    counter.textContent = `${index + 1} из ${links.length}`;
    image.classList.remove('is-swap');
    void image.offsetWidth;
    image.classList.add('is-swap');
  };
  links.forEach((link, n) =>
    link.addEventListener('click', (e) => {
      e.preventDefault();
      show(n);
      lightbox.showModal();
    })
  );
  lightbox.querySelector('.lightbox__prev').addEventListener('click', () => show(index - 1));
  lightbox.querySelector('.lightbox__next').addEventListener('click', () => show(index + 1));
  lightbox.querySelector('.lightbox__close').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox__figure')) lightbox.close();
  });
  let startX = null;
  lightbox.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX), { passive: true });
  lightbox.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) show(index + (dx < 0 ? 1 : -1));
    startX = null;
  });
}

// Формы заявки: в макете никуда не отправляют
document.querySelectorAll('form[data-demo]').forEach((form) =>
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    form.querySelector('.form__status').textContent = 'Это макет: заявки начнут приходить после запуска сайта.';
  })
);
