var dateLookup = {};
var monthDataCache = {};
var monthOrder = ['may','jun','jul','aug','sep','oct','nov','dec'];
var monthNames = { may:'Maio', jun:'Junho', jul:'Julho', aug:'Agosto', sep:'Setembro', oct:'Outubro', nov:'Novembro', dec:'Dezembro' };
var selectedDateStr = null;
var modalMonthKey = 'may';
var periodRange = { start: null, end: null };
var rangeStartPending = null;

function buildDateLookup() {
  var reg = dataLoader.getAno(2026);
  if (!reg) return;
  dateLookup = {};
  for (var mk in reg) {
    var mData = reg[mk];
    for (var wn in mData.weeks) {
      var week = mData.weeks[wn];
      var dias = week.calendar.dias;
      for (var dk in dias) {
        if (dias.hasOwnProperty(dk)) {
          var dateStr = dias[dk].display;
          dateLookup[dateStr] = { monthKey: mk, weekNum: parseInt(wn), dayKey: dk };
        }
      }
    }
  }
}

function getMonthData(monthKey, year) {
  year = year || 2026;
  var cacheKey = year + '-' + monthKey;
  if (monthDataCache[cacheKey]) return monthDataCache[cacheKey];
  var reg = dataLoader.getAno(year);
  if (!reg || !reg[monthKey]) return null;
  var monthNum = reg[monthKey].monthNum;
  var firstDay = new Date(year, monthNum - 1, 1);
  var daysInMonth = new Date(year, monthNum, 0).getDate();
  var weeks = [];
  var currentWeek = [];
  var startDayOfWeek = firstDay.getDay();
  var blankStart = (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1);
  for (var i = 0; i < blankStart; i++) currentWeek.push(null);
  for (var d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d);
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
  }
  if (currentWeek.length > 0) { while (currentWeek.length < 7) currentWeek.push(null); weeks.push(currentWeek); }
  var result = { monthKey: monthKey, monthNum: monthNum, daysInMonth: daysInMonth, weeks: weeks };
  monthDataCache[cacheKey] = result;
  return result;
}

function pad(n) { return n < 10 ? '0' + n : '' + n; }
function makeDateStr(dayNum, monthNum) { return pad(dayNum) + '/' + pad(monthNum); }
function parseDateStr(str) { var parts = str.split('/'); return { day: parseInt(parts[0]), month: parseInt(parts[1]) }; }
function dateToNum(str) { var p = str.split('/'); return parseInt(p[0]) + parseInt(p[1]) * 100; }

function updateTriggerLabel() {
  var el = document.getElementById('cal-trigger-label');
  if (!el) return;
  if (periodRange.start && periodRange.end) {
    var s = pad(periodRange.start.day) + '/' + pad(periodRange.start.month);
    var e = pad(periodRange.end.day) + '/' + pad(periodRange.end.month);
    var label = s === e ? s : s + ' \u2013 ' + e;
    el.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' + label;
  } else {
    el.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>Selecionar per\u00edodo';
  }
}

function getTodayDateStr() { var d = new Date(); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); }
function getYesterdayDateStr() { var d = new Date(); d.setDate(d.getDate() - 1); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); }

function renderCalModalBody(monthKey) {
  var year = 2026;
  var mData = getMonthData(monthKey, year);
  var tbody = document.getElementById('cal-modal-body');
  var title = document.getElementById('cal-modal-title');
  if (!tbody || !title) return;
  title.textContent = monthNames[monthKey] + ' ' + year;

  var currentDateStr = periodRange.start ? pad(periodRange.start.day) + '/' + pad(periodRange.start.month) : null;

  var html = '';
  for (var wi = 0; wi < mData.weeks.length; wi++) {
    var week = mData.weeks[wi];
    html += '<tr>';
    for (var di = 0; di < week.length; di++) {
      var dayNum = week[di];
      if (dayNum === null) { html += '<td class="cm-empty"></td>'; continue; }
      var dateStr = makeDateStr(dayNum, mData.monthNum);
      var lookup = dateLookup[dateStr];
      var hasData = !!lookup;
      var isWeekend = (di >= 5);
      var isSelected = currentDateStr && dateStr === currentDateStr;

      var classNames = 'cm-day';
      if (isWeekend) classNames += ' cm-weekend';
      if (!hasData) classNames += ' cm-disabled';
      if (isSelected) classNames += ' cm-selected';
      if (lookup && lookup.monthKey === monthKey && !isWeekend) classNames += ' cm-clickable';
      var onClick = (hasData && !isWeekend) ? 'onclick="calendarDayClick(\'' + dateStr + '\')"' : '';
      html += '<td class="' + classNames + '" ' + onClick + '><div class="cm-day-inner">' + dayNum + '</div></td>';
    }
    html += '</tr>';
  }
  tbody.innerHTML = html;
}

function toggleCalModal() {
  var overlay = document.getElementById('cal-modal-overlay');
  if (!overlay) return;
  if (overlay.classList.contains('open')) { closeCalModal(); } else { openCalModal(); }
}

function openCalModal() {
  buildDateLookup();
  var overlay = document.getElementById('cal-modal-overlay');
  if (!overlay) return;
  var ref = getYesterday();
  var currentMonthNames = { 5:'may',6:'jun',7:'jul',8:'aug',9:'sep',10:'oct',11:'nov',12:'dec' };
  if (!periodRange.start || modalMonthKey === 'may') {
    modalMonthKey = currentMonthNames[ref.getMonth() + 1] || 'may';
  }
  rangeStartPending = null;
  renderCalModalBody(modalMonthKey);
  overlay.classList.add('open');
  if (periodRange.start && periodRange.end) {
    var s = pad(periodRange.start.day) + '/' + pad(periodRange.start.month);
    var e = pad(periodRange.end.day) + '/' + pad(periodRange.end.month);
    document.getElementById('period-info').textContent = s + (s !== e ? ' a ' + e : '') + ' \u2014 clique em um dia para abrir';
  } else {
    document.getElementById('period-info').textContent = 'Clique em um dia para abrir';
  }
  setTimeout(function() { document.addEventListener('keydown', calModalKeydown); }, 0);
}

function calModalKeydown(e) {
  if (e.key === 'Escape') closeCalModal();
}

function closeCalModal() {
  var overlay = document.getElementById('cal-modal-overlay');
  if (overlay) overlay.classList.remove('open');
  rangeStartPending = null;
  document.removeEventListener('keydown', calModalKeydown);
}

function modalPrevMonth() {
  var idx = monthOrder.indexOf(modalMonthKey);
  if (idx > 0) { modalMonthKey = monthOrder[idx - 1]; renderCalModalBody(modalMonthKey); }
}

function modalNextMonth() {
  var idx = monthOrder.indexOf(modalMonthKey);
  if (idx < monthOrder.length - 1) { modalMonthKey = monthOrder[idx + 1]; renderCalModalBody(modalMonthKey); }
}

function calendarDayClick(dateStr) {
  if (!dateLookup[dateStr]) return;

  periodRange = { start: parseDateStr(dateStr), end: parseDateStr(dateStr) };
  rangeStartPending = null;
  selectedDateStr = dateStr;

  updateTriggerLabel();
  closeCalModal();
  setTimeout(function() { applyRange(dateStr, dateStr); }, 0);
}

function applyRange(startStr, endStr) {
  state.dadosCompletos = getRangeAcumulado(startStr, endStr);
  filtrarDadosPorPermissao();
  var dayNames = { d1: 'Segunda-feira', d2: 'Ter\u00e7a-feira', d3: 'Quarta-feira', d4: 'Quinta-feira', d5: 'Sexta-feira' };
  document.getElementById('page-sub').textContent = startStr === endStr ? 'Data: ' + startStr : 'Per\u00edodo: ' + startStr + ' a ' + endStr;
  var titles = { geral: 'Vis\u00e3o Geral', hp: 'HP', urbi_recanto: 'URBI Recanto', urbi_samambaia: 'URBI Samambaia', maas: 'MAAS' };
  document.getElementById('page-title').textContent = titles[state.paginaAtual];
  atualizarDashboardCompleto();
}

function getYesterday() {
  var d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

function findClosestAvailableDate() {
  var d = getYesterday();
  for (var i = 0; i < 7; i++) {
    var dateStr = pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
    if (dateLookup[dateStr]) return dateStr;
    d.setDate(d.getDate() - 1);
  }
  var keys = Object.keys(dateLookup);
  return keys[keys.length - 1] || null;
}

/* Period presets */
function selectPeriodPreset(preset) {
  var btns = document.querySelectorAll('.period-btn');
  btns.forEach(function(b) { b.classList.remove('active'); });
  var btn = document.querySelector('.period-btn[data-period="' + preset + '"]');
  if (btn) btn.classList.add('active');
  var customRange = document.getElementById('period-custom-range');
  customRange.classList.remove('open');
  periodRange = { start: null, end: null };
  buildDateLookup();
  var ref = getYesterday();
  var refStr = pad(ref.getDate()) + '/' + pad(ref.getMonth() + 1);

  switch (preset) {
    case 'day': {
      var closestStr = findClosestAvailableDate();
      if (closestStr) {
        periodRange = { start: parseDateStr(closestStr), end: parseDateStr(closestStr) };
        selectedDateStr = closestStr + ' - ' + closestStr;
        updateTriggerLabel();
        applyRange(closestStr, closestStr);
      } else {
        document.getElementById('period-info').textContent = 'Nenhum dado dispon\u00edvel.';
      }
      break;
    }
    case 'last7': {
      var endStr = findClosestAvailableDate();
      if (endStr) {
        var endDate = parseDateStr(endStr);
        var endDateObj = new Date(2026, endDate.month - 1, endDate.day);
        endDateObj.setDate(endDateObj.getDate() - 6);
        var startStr = pad(endDateObj.getDate()) + '/' + pad(endDateObj.getMonth() + 1);
        periodRange = { start: parseDateStr(startStr), end: parseDateStr(endStr) };
        selectedDateStr = startStr + ' - ' + endStr;
        updateTriggerLabel();
        applyRange(startStr, endStr);
      } else {
        document.getElementById('period-info').textContent = 'Nenhum dado dispon\u00edvel.';
      }
      break;
    }
    case 'month': {
      var firstOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1);
      var lastOfMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
      var firstStr = pad(firstOfMonth.getDate()) + '/' + pad(firstOfMonth.getMonth() + 1);
      var lastStr = pad(lastOfMonth.getDate()) + '/' + pad(lastOfMonth.getMonth() + 1);
      periodRange = { start: parseDateStr(firstStr), end: parseDateStr(lastStr) };
      selectedDateStr = firstStr + ' - ' + lastStr;
      updateTriggerLabel();
      applyRange(firstStr, lastStr);
      break;
    }
    case 'custom':
      customRange.classList.add('open');
      document.getElementById('period-info').textContent = 'Selecione as datas e clique em Aplicar';
      break;
  }
}

function applyCustomPeriod() {
  var startVal = document.getElementById('period-start-date').value;
  var endVal = document.getElementById('period-end-date').value;
  if (!startVal || !endVal) { mostrarToast('Selecione as datas de in\u00edcio e fim'); return; }
  var startParts = startVal.split('-');
  var endParts = endVal.split('-');
  var startStr = pad(parseInt(startParts[2])) + '/' + pad(parseInt(startParts[1]));
  var endStr = pad(parseInt(endParts[2])) + '/' + pad(parseInt(endParts[1]));
  periodRange = { start: parseDateStr(startStr), end: parseDateStr(endStr) };
  selectedDateStr = startStr + ' - ' + endStr;
  updateTriggerLabel();
  applyRange(startStr, endStr);
  mostrarToast('Per\u00edodo personalizado: ' + startStr + ' a ' + endStr);
}
