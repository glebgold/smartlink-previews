/* ==========================================================================
   Астера · главная: быстрый расчёт. Диапазоны согласованы с каталогом:
   входные Burkovsky в квартиру 356 700–608 000, в дом от 650 000, LORD 24 900–39 900.
   ========================================================================== */
(function () {
  'use strict';
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var calc = $('#calc'); if (!calc) return;
  var DOOR  = { in:[356700,608000], street:[650000,1400000], mid:[24900,39900] };
  var FIN   = { in:{ base:[0,0], oak:[38000,38000], mass:[96000,96000] }, street:{ base:[0,0], oak:[38000,52000], mass:[96000,140000] }, mid:{ base:[0,0], oak:[6000,9000], mass:null } };
  var MOUNT = { in:[18000,25000], street:[28000,42000], mid:[4500,6000] };
  var DEMO  = { in:[3000,5000], street:[5000,8000], mid:[1200,1800] };
  var DOBOR = { in:[19000,19000], street:[24000,30000], mid:[2600,4200] };
  var qtyIn = $('#qty'), qtyOut = $('#qtyOut'), sumLo = $('#sumLo'), sumHi = $('#sumHi'), note = $('#calcNote');
  var fmt = function (n) { return String(Math.round(n / 100) * 100).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  var run = function () {
    var type = calc.querySelector('input[name="type"]:checked').value;
    var qty = Math.max(1, Math.min(12, parseInt(qtyIn.value, 10) || 1));
    var mass = calc.querySelector('input[value="mass"]');
    mass.disabled = !FIN[type].mass;
    if (mass.disabled && mass.checked) calc.querySelector('input[value="base"]').checked = true;
    var fin = calc.querySelector('input[name="fin"]:checked').value;
    var mount = calc.querySelector('input[name="mount"]').checked, demo = calc.querySelector('input[name="demo"]').checked, dobor = calc.querySelector('input[name="dobor"]').checked;
    var add = FIN[type][fin] || [0, 0];
    var lo = DOOR[type][0] + add[0], hi = DOOR[type][1] + add[1];
    if (mount) { lo += MOUNT[type][0]; hi += MOUNT[type][1]; }
    if (demo)  { lo += DEMO[type][0];  hi += DEMO[type][1]; }
    if (dobor) { lo += DOBOR[type][0]; hi += DOBOR[type][1]; }
    lo *= qty; hi *= qty;
    if (type === 'mid' && qty >= 4) { lo *= .95; hi *= .93; }
    sumLo.textContent = fmt(lo); sumHi.textContent = fmt(hi);
    note.textContent = (qty === 1 ? 'За одну дверь' : 'За ' + qty + ' ' + window.plural(qty, 'дверь', 'двери', 'дверей')) +
      (mount ? ' с установкой. ' : ' без установки. ') +
      (type === 'street' ? 'Уличные группы считаем индивидуально: размер, терморазрыв, электроника — всё влияет. ' : type === 'mid' && qty >= 4 ? 'От четырёх дверей считаем дешевле — выезд и работа те же. ' : 'Разброс — разница между моделями серии и тем, что вы выберете в конфигураторе. ') +
      'Точную цифру называем после замера, и она уже не меняется.';
  };
  calc.addEventListener('change', run);
  $$('.count button').forEach(function (b) { b.addEventListener('click', function () {
    qtyIn.value = Math.max(1, Math.min(12, (+qtyIn.value) + (+b.dataset.step))); qtyOut.textContent = qtyIn.value; run();
  }); });
  run();
})();
