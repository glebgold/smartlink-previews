/* =====================================================================
   GRAND AUTO — отправка заявок с форм.
   Схема: фронт → Google Apps Script (прокси) → Google Sheet + Telegram.
   Telegram Bot API заблокирован в РФ, поэтому шлём на Google (не блокируется),
   а Apps Script уже сам стучится в api.telegram.org с серверов Google.
   Токен бота — ТОЛЬКО в Apps Script (серверная сторона), тут его нет.
   ===================================================================== */

// ===== Конфиг отправки форм =====
// Telegram Bot API заблокирован в РФ — шлём в Apps Script прокси на Google.
// ВАЖНО: старый адрес прошлой компании удалён — заявки НЕ должны уходить на чужой бэкенд.
// Вставьте сюда URL СВОЕГО Google Apps Script (см. apps-script.gs) после деплоя.
// Пока стоит PASTE_..., форма показывает «отправлено», но никуда не шлёт.
window.FORM_CONFIG = {
  googleSheetsUrl: 'PASTE_YOUR_APPS_SCRIPT_URL_HERE'
};

// Собирает payload из любой формы сайта в единый формат для бэкенда.
window.buildFormPayload = function (form) {
  const get = (sel) => {
    const el = form.querySelector(sel);
    return el ? (el.value || '').toString().trim() : '';
  };
  // Категория — берём ВИДИМЫЙ текст выбранного option, а не value-код.
  let category = '';
  const sel = form.querySelector('select');
  if (sel && sel.value && sel.options[sel.selectedIndex]) {
    category = sel.options[sel.selectedIndex].text.trim();
  }
  return {
    name: get('[name="name"], #name'),
    // ВАЖНО: убираем + в начале телефона — иначе Google Sheets распознаёт как формулу (#ERROR!)
    phone: get('[name="phone"], #phone').replace(/^\+/, ''),
    category: category,
    subcat: '',
    message: get('[name="message"], #message'),
    source: form.getAttribute('data-source') || form.id || 'Сайт'
  };
};

// Отправка на Apps Script. no-cors + text/plain — чтобы не было CORS preflight.
window.submitFormToBackend = function (payload) {
  const url = (window.FORM_CONFIG || {}).googleSheetsUrl;
  if (!url || url.indexOf('PASTE') === 0) {
    console.warn('FORM_CONFIG.googleSheetsUrl не задан');
    return Promise.resolve();
  }
  return fetch(url, {
    method: 'POST',
    mode: 'no-cors',                                           // opaque-ответ, статус не прочитать — это норма
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // text/plain обходит preflight
    body: JSON.stringify(payload)
  });
};

// ===== Обработка сабмита =====
function wireForm(form) {
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;
    const originalText = btn.innerHTML;

    const payload = window.buildFormPayload(form);

    btn.innerHTML = 'Отправка...';
    btn.disabled = true;

    // Отправка идёт opaque-режимом — не различаем 200/500,
    // но запрос гарантированно ушёл, показываем "отправлено".
    window.submitFormToBackend(payload).catch(() => {}).then(() => {
      btn.innerHTML = '✓ Заявка отправлена!';
      btn.style.background = '#4CAF50';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.disabled = false;
        form.reset();
      }, 3000);
    });
  });
}
document.querySelectorAll('form.contact-form').forEach(wireForm);
