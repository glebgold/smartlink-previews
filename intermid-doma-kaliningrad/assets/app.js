/* ИнтерМИД — поведение макета: меню, появление блоков, калькулятор, каталог, карточка проекта. */
(function () {
  "use strict";
  document.documentElement.classList.add("js-on");

  var rub = new Intl.NumberFormat("ru-RU");
  var money = function (n) { return rub.format(Math.round(n)) + " ₽"; };

  // ---------- Мобильное меню ----------
  var burger = document.getElementById("burger"), mnav = document.getElementById("mnav");
  if (burger && mnav) {
    burger.addEventListener("click", function () {
      document.body.style.overflow = mnav.classList.toggle("open") ? "hidden" : "";
    });
    mnav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { mnav.classList.remove("open"); document.body.style.overflow = ""; }
    });
  }

  // ---------- Появление блоков ----------
  function watch() {
    var rise = document.querySelectorAll(".rise:not(.seen)");
    if (!rise.length) return;
    if (!("IntersectionObserver" in window)) {
      rise.forEach(function (el) { el.classList.add("seen"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en, i) {
        if (!en.isIntersecting) return;
        var el = en.target;
        setTimeout(function () { el.classList.add("seen"); }, (i % 4) * 70);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -50px 0px", threshold: 0.08 });
    rise.forEach(function (el) { io.observe(el); });
    setTimeout(function () {
      document.querySelectorAll(".rise:not(.seen)").forEach(function (el) { el.classList.add("seen"); });
    }, 2200);
  }
  watch();

  // ---------- Подсветка меню ----------
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach(function (a) {
    if (a.getAttribute("href") === here) a.classList.add("on");
  });

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

  // ---------- Формы ----------
  document.querySelectorAll("form[data-lead]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.style.display = "none";
      var ok = form.parentNode.querySelector(".thanks");
      if (ok) ok.style.display = "block";
    });
  });

  // ---------- Калькулятор ----------
  var area = document.getElementById("area");
  if (area) {
    function pick(name, attr) {
      var el = document.querySelector('input[name="' + name + '"]:checked');
      return el ? parseFloat(el.dataset[attr]) : 1;
    }
    function term(sq, material) {
      var base = 3 + Math.round(sq / 45);
      if (material === "brick") base += 2;
      if (material === "gas" || material === "timber") base += 1;
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
      var perM = pick("material", "price"), floors = pick("floors", "k"), stage = pick("stage", "k");
      var matEl = document.querySelector('input[name="material"]:checked');
      var material = matEl ? matEl.value : "frame";
      // Цена метра падает с ростом площади: фундамент, кровля и инженерия не делятся
      // пропорционально. Показатель 0.535 подобран по 27 проектам каталога — так расчёт
      // сходится с прайсом в среднем с точностью 6%.
      var perMeter = perM * Math.pow(100 / sq, 0.535);
      var total = Math.round((sq * perMeter * floors * stage) / 10000) * 10000;

      document.getElementById("areaVal").textContent = sq;
      document.getElementById("price").textContent = money(total);
      document.getElementById("perM").textContent = money(Math.round(total / sq / 100) * 100);
      document.getElementById("term").textContent = months(term(sq, material));
      document.getElementById("first").textContent = money(Math.round(total * 0.3 / 1000) * 1000);

      var mg = document.getElementById("mortgage");
      if (mg) {
        // Аннуитет: 30% первоначальный, 17% годовых, 25 лет.
        var body = total * 0.7, r = 0.17 / 12, n = 300;
        var pay = body * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
        mg.textContent = money(Math.round(pay / 10) * 10) + "/мес";
      }
    }
    area.addEventListener("input", recalc);
    document.querySelectorAll(".opt input").forEach(function (el) { el.addEventListener("change", recalc); });
    recalc();
  }

  // ---------- Каталог с фильтрами ----------
  var grid = document.getElementById("catalog");
  if (grid && window.PROJECTS) {
    var state = { mat: "all", floors: "all", price: "all", sort: "area" };

    function fmtArea(p) {
      var a = String(p.area).replace(".", ",");
      return p.area2 ? a + " / " + p.area2 : a;
    }
    function tagHtml(t) {
      var cls = (t === "Топ-1" || t === "хит") ? "tag-hot" : (t === "новинка" ? "tag-new" : "");
      return '<span class="tag ' + cls + '">' + t + "</span>";
    }
    function cardHtml(p) {
      var floors = { 1: "1 этаж", 2: "2 этажа", 3: "3 этажа" }[p.floors];
      var price = p.price ? money(p.price) : "По запросу";
      return '<a class="card rise" href="proekt.html?n=' + p.n + '">' +
        '<div class="card-ph"><img src="assets/proj/' + p.n + '.jpg" alt="Проект № ' + p.n + '" loading="lazy">' +
        '<div class="card-tags">' + p.tags.slice(0, 2).map(tagHtml).join("") + "</div></div>" +
        '<div class="card-b"><div class="card-n">Проект № ' + p.n + "</div>" +
        "<h3>" + p.title + "</h3>" +
        '<div class="card-desc">' + p.desc.slice(0, 108) + "…</div>" +
        '<div class="card-meta"><span><b>' + fmtArea(p) + "</b> м²</span><span>" + floors +
        "</span><span>" + window.MAT_NAME[p.mat] + "</span></div>" +
        '<div class="card-bot"><div class="card-price"><small>Под ключ</small>' + price +
        '</div><div class="card-go">→</div></div></div></a>';
    }
    function render() {
      var list = window.PROJECTS.filter(function (p) {
        if (state.mat !== "all" && p.mat !== state.mat) return false;
        if (state.floors !== "all" && String(p.floors) !== state.floors) return false;
        if (state.price === "lo" && !(p.price && p.price < 6000000)) return false;
        if (state.price === "mid" && !(p.price >= 6000000 && p.price < 8000000)) return false;
        if (state.price === "hi" && !(p.price >= 8000000)) return false;
        return true;
      });
      list.sort(function (a, b) {
        if (state.sort === "price") return (a.price || 1e12) - (b.price || 1e12);
        if (state.sort === "price-desc") return (b.price || 0) - (a.price || 0);
        return a.area - b.area;
      });
      grid.innerHTML = list.length
        ? list.map(cardHtml).join("")
        : '<p style="grid-column:1/-1;padding:60px 0;text-align:center;color:var(--smoke)">По заданным условиям проектов нет. Мы разработаем индивидуальный — <a href="kontakty.html" style="color:var(--copper)">напишите нам</a>.</p>';
      var c = document.getElementById("fcount");
      if (c) c.innerHTML = "Показано <b>" + list.length + "</b> из " + window.PROJECTS.length;
      watch();
    }
    document.querySelectorAll("[data-f]").forEach(function (b) {
      b.addEventListener("click", function () {
        var key = b.dataset.f;
        state[key] = b.dataset.v;
        document.querySelectorAll('[data-f="' + key + '"]').forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        render();
      });
    });
    render();
  }

  // ---------- Таблица платежей по семейной ипотеке ----------
  var mrows = document.getElementById("mortgageRows");
  if (mrows && window.PROJECTS) {
    var LIMIT = 6000000, FAM = 0.06, MKT = 0.17, DOWN = 0.2;
    function ann(sum, rate, years) {
      var r = rate / 12, n = years * 12;
      return sum * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    }
    // До лимита — льготная ставка, остаток — по рыночной.
    function pay(price) {
      var credit = price * (1 - DOWN);
      var fam = Math.min(credit, LIMIT), rest = Math.max(0, credit - LIMIT);
      return ann(fam, FAM, 30) + (rest ? ann(rest, MKT, 30) : 0);
    }
    var rows = window.PROJECTS.filter(function (p) { return p.price; })
      .sort(function (a, b) { return a.price - b.price; })
      .map(function (p) {
        var m = pay(p.price), cheap = m <= 36000;
        var area = String(p.area).replace(".", ",") + (p.area2 ? " / " + p.area2 : "");
        return '<tr style="border-top:1px solid var(--line)">' +
          '<td style="padding:14px 20px"><a href="proekt.html?n=' + p.n + '" style="font-weight:700;color:var(--copper)">№ ' + p.n + '</a>' +
          '<div style="font-size:13px;color:var(--smoke);margin-top:2px">' + window.MAT_NAME[p.mat] + '</div></td>' +
          '<td style="padding:14px 20px">' + area + ' м²</td>' +
          '<td style="padding:14px 20px;text-align:right">' + money(p.price) + '</td>' +
          '<td style="padding:14px 20px;text-align:right;color:var(--smoke)">' + money(p.price * DOWN) + '</td>' +
          '<td style="padding:14px 20px;text-align:right;font-weight:800;font-family:var(--font-h);' +
          (cheap ? 'color:var(--copper)' : '') + '">' + money(m) + '</td></tr>';
      }).join("");
    mrows.innerHTML = rows;
  }

  // ---------- Карточка проекта ----------
  var page = document.getElementById("projPage");
  if (page && window.PROJECTS) {
    var n = parseInt(new URLSearchParams(location.search).get("n"), 10) || 6;
    var p = window.PROJECTS.filter(function (x) { return x.n === n; })[0] || window.PROJECTS[5];
    var floors = { 1: "Один этаж", 2: "Два этажа", 3: "Три этажа" }[p.floors];
    var areaTxt = String(p.area).replace(".", ",") + (p.area2 ? " или " + p.area2 : "") + " м²";
    var price = p.price ? money(p.price) : "Рассчитывается индивидуально";

    function set(id, v) { var e = document.getElementById(id); if (e) e.innerHTML = v; }
    document.title = "Проект № " + p.n + " — дом " + areaTxt + " | ИнтерМИД";
    set("pTitle", "Проект № " + p.n);
    set("pSub", p.title);
    set("pDesc", p.desc);
    set("pArea", areaTxt);
    set("pFloors", floors);
    set("pMat", window.MAT_NAME[p.mat]);
    set("pPrice", price);
    set("pCrumb", "Проект № " + p.n);
    var img = document.getElementById("pImg");
    if (img) { img.src = "assets/proj/" + p.n + ".jpg"; img.alt = "Проект № " + p.n; }
    var chips = document.getElementById("pChips");
    if (chips) chips.innerHTML = p.tags.map(function (t) { return '<span class="chip">' + t + "</span>"; }).join("");

    if (p.price) {
      var body = p.price * 0.7, r = 0.17 / 12, k = 300;
      set("pMortgage", money(Math.round(body * r * Math.pow(1 + r, k) / (Math.pow(1 + r, k) - 1) / 10) * 10) + "/мес");
      set("pFirst", money(Math.round(p.price * 0.3 / 1000) * 1000));
      set("pPerM", money(Math.round(p.price / p.area / 100) * 100));
    } else {
      set("pMortgage", "по расчёту"); set("pFirst", "по расчёту"); set("pPerM", "по расчёту");
    }

    // Похожие проекты: тот же материал, близкая площадь.
    var similar = window.PROJECTS
      .filter(function (x) { return x.n !== p.n; })
      .sort(function (a, b) {
        var da = Math.abs(a.area - p.area) + (a.mat === p.mat ? 0 : 40);
        var db = Math.abs(b.area - p.area) + (b.mat === p.mat ? 0 : 40);
        return da - db;
      }).slice(0, 3);
    var sim = document.getElementById("pSimilar");
    if (sim) {
      sim.innerHTML = similar.map(function (x) {
        var fl = { 1: "1 этаж", 2: "2 этажа", 3: "3 этажа" }[x.floors];
        return '<a class="card" href="proekt.html?n=' + x.n + '">' +
          '<div class="card-ph"><img src="assets/proj/' + x.n + '.jpg" alt="Проект № ' + x.n + '" loading="lazy"></div>' +
          '<div class="card-b"><div class="card-n">Проект № ' + x.n + '</div><h3>' + x.title + '</h3>' +
          '<div class="card-meta"><span><b>' + String(x.area).replace(".", ",") + '</b> м²</span><span>' + fl +
          '</span><span>' + window.MAT_NAME[x.mat] + '</span></div>' +
          '<div class="card-bot"><div class="card-price"><small>Под ключ</small>' +
          (x.price ? money(x.price) : "По запросу") + '</div><div class="card-go">→</div></div></div></a>';
      }).join("");
    }
    watch();
  }
})();
