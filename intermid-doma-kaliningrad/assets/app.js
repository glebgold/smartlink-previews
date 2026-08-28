/* ИнтерМИД — поведение макета: калькулятор, меню, появление блоков, форма. */

(function () {
  "use strict";

  // Скрипт жив — можно прятать блоки до появления.
  document.documentElement.classList.add("js-on");

  // ---------- Мобильное меню ----------
  var burger = document.getElementById("burger");
  var mnav = document.getElementById("mnav");
  if (burger && mnav) {
    burger.addEventListener("click", function () {
      var open = mnav.classList.toggle("open");
      document.body.style.overflow = open ? "hidden" : "";
    });
    mnav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        mnav.classList.remove("open");
        document.body.style.overflow = "";
      }
    });
  }

  // ---------- Появление блоков при прокрутке ----------
  var rise = document.querySelectorAll(".rise");
  if (rise.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, i) {
        if (!en.isIntersecting) return;
        var el = en.target;
        setTimeout(function () { el.classList.add("seen"); }, (i % 4) * 70);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -60px 0px", threshold: 0.1 });
    rise.forEach(function (el) { io.observe(el); });
    // Если что-то пойдёт не так с наблюдателем — через полторы секунды показываем всё.
    setTimeout(function () {
      document.querySelectorAll(".rise:not(.seen)").forEach(function (el) { el.classList.add("seen"); });
    }, 1500);
  } else {
    rise.forEach(function (el) { el.classList.add("seen"); });
  }

  // ---------- Калькулятор ----------
  var area = document.getElementById("area");
  if (area) {
    var rub = new Intl.NumberFormat("ru-RU");

    function pick(name, attr) {
      var el = document.querySelector('input[name="' + name + '"]:checked');
      return el ? parseFloat(el.dataset[attr]) : 1;
    }

    // Срок считаем от площади и материала: кирпич кладут дольше каркаса.
    function term(sq, material) {
      var base = 3 + Math.round(sq / 45);
      if (material === "brick") base += 2;
      if (material === "gas") base += 1;
      if (material === "timber") base += 1;
      return Math.min(base, 12);
    }

    function months(n) {
      var t = n % 10, h = n % 100;
      if (t === 1 && h !== 11) return n + " месяц";
      if (t >= 2 && t <= 4 && (h < 12 || h > 14)) return n + " месяца";
      return n + " месяцев";
    }

    function recalc() {
      var sq = parseInt(area.value, 10);
      var perM = pick("material", "price");
      var floors = pick("floors", "k");
      var stage = pick("stage", "k");
      var matEl = document.querySelector('input[name="material"]:checked');
      var material = matEl ? matEl.value : "frame";

      // На маленьких домах цена метра выше: фундамент и кровля не делятся пропорционально.
      var scale = sq < 80 ? 1.09 : sq > 200 ? 0.95 : 1;

      var total = Math.round((sq * perM * floors * stage * scale) / 10000) * 10000;
      var mPrice = Math.round(total / sq / 100) * 100;

      document.getElementById("areaVal").textContent = sq;
      document.getElementById("price").textContent = rub.format(total) + " ₽";
      document.getElementById("perM").textContent = rub.format(mPrice) + " ₽";
      document.getElementById("term").textContent = months(term(sq, material));
      document.getElementById("first").textContent = rub.format(Math.round(total * 0.3 / 1000) * 1000) + " ₽";
    }

    area.addEventListener("input", recalc);
    document.querySelectorAll('.opt input').forEach(function (el) {
      el.addEventListener("change", recalc);
    });
    recalc();
  }

  // ---------- Форма ----------
  var form = document.getElementById("leadForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      // Макет без сервера: показываем подтверждение на месте.
      form.style.display = "none";
      var ok = document.getElementById("thanks");
      if (ok) ok.style.display = "block";
    });
  }

  // ---------- Телефонная маска ----------
  document.querySelectorAll('input[type="tel"]').forEach(function (input) {
    input.addEventListener("input", function () {
      var d = input.value.replace(/\D/g, "").slice(0, 11);
      if (!d) { input.value = ""; return; }
      if (d[0] === "8") d = "7" + d.slice(1);
      if (d[0] !== "7") d = "7" + d;
      var out = "+7";
      if (d.length > 1) out += " (" + d.slice(1, 4);
      if (d.length >= 4) out += ") " + d.slice(4, 7);
      if (d.length >= 7) out += "-" + d.slice(7, 9);
      if (d.length >= 9) out += "-" + d.slice(9, 11);
      input.value = out;
    });
  });

  // ---------- Подсветка текущего пункта меню ----------
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach(function (a) {
    if (a.getAttribute("href") === here) a.classList.add("on");
  });
})();
