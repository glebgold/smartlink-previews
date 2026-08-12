/* ============================================================
   РАДАР — отправка заявок с форм
   Telegram Bot API заблокирован в РФ → шлём в Google Apps Script,
   а он уже сам пишет в Google Sheet и стучится в Telegram.
   ============================================================ */
(function () {
  'use strict';

  // ===== Конфиг отправки форм =====
  window.FORM_CONFIG = {
    googleSheetsUrl: 'https://script.google.com/macros/s/AKfycbxwgzjeWQQGjjnkU9SRqtG5jGsYAAOLWbLHbvvddB4NwIABjxS4SSOhp1PUHjs3tJSvkw/exec'
  };

  // Счётчик Яндекс.Метрики (цель "lead_form")
  window.YM_ID = 111360976;

  function ymGoal(goal) {
    try { if (window.ym && window.YM_ID) { ym(window.YM_ID, 'reachGoal', goal); } } catch (e) {}
  }

  // Собирает payload из формы: name/phone/message + первый <select> как категория.
  // Для радара марка авто уходит в subcat — в Telegram придёт строкой «Авто:».
  window.buildFormPayload = function (form) {
    var get = function (sel) {
      var el = form.querySelector(sel);
      return el ? (el.value || '').toString().trim() : '';
    };
    // Категория — ВИДИМЫЙ текст выбранного option, а не value-код.
    var category = '';
    var sel = form.querySelector('select');
    if (sel && sel.value && sel.options[sel.selectedIndex]) {
      category = sel.options[sel.selectedIndex].text.trim();
    }
    return {
      name: get('[name="name"], #name'),
      // ВАЖНО: убираем + в начале телефона — иначе Google Sheets примет как формулу (#ERROR!)
      phone: get('[name="phone"], #phone').replace(/^\+/, ''),
      category: category,
      subcat: get('[name="car"], #car'),
      message: get('[name="message"], #message'),
      source: form.getAttribute('data-source') || form.id || 'Сайт'
    };
  };

  // Отправка на Apps Script. no-cors + text/plain — обход CORS preflight (opaque-ответ — это норма).
  window.submitFormToBackend = function (payload) {
    var url = (window.FORM_CONFIG || {}).googleSheetsUrl;
    if (!url || url.indexOf('PASTE') === 0) {
      console.warn('FORM_CONFIG.googleSheetsUrl не задан — заявка не отправлена');
      return Promise.resolve();
    }
    return fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
  };

  // ===== Обработка сабмита =====
  function wireForm(form) {
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      // required-поля, включая чекбокс согласия 152-ФЗ
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var btn = form.querySelector('button[type="submit"]');
      var originalHtml = btn ? btn.innerHTML : '';
      if (btn) { btn.innerHTML = 'Отправка…'; btn.disabled = true; }

      var payload = window.buildFormPayload(form);

      window.submitFormToBackend(payload).catch(function () {}).then(function () {
        ymGoal('lead_form');                       // цель Метрики: оставление заявки
        var ok = document.getElementById('formSuccess');
        if (ok) {                                  // показываем фирменную панель «Заявка принята»
          form.style.display = 'none';
          ok.classList.add('on');
        } else if (btn) {                          // запасной вариант — подтверждение на кнопке
          btn.innerHTML = '✓ Заявка отправлена!';
          setTimeout(function () {
            btn.innerHTML = originalHtml;
            btn.disabled = false;
            form.reset();
          }, 3000);
        }
      });
    });
  }

  document.querySelectorAll('form.contact-form').forEach(wireForm);
})();
