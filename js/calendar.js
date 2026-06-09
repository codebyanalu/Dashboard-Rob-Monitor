var dateLookup = {};
var monthDataCache = {};
var monthOrder = ['may','jun','jul','aug','sep','oct','nov','dec'];
var monthNames = { may:'Maio', jun:'Junho', jul:'Julho', aug:'Agosto', sep:'Setembro', oct:'Outubro', nov:'Novembro', dec:'Dezembro' };
var selectedDateStr = null;
var modalMonthKey = 'may';
var periodRange = { start: null, end: null };
var rangeStartPending = null;

function buildDateLookup() {
  var reg = DATA_REGISTRY[2026];
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
  var monthNum = DATA_REGISTRY[year][monthKey].monthNum;
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
    el.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' + s + ' \u2013 ' + e;
  } else {
    el.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:-2px;margin-right:4px"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>Selecionar per\u00edodo';
  }
}

function getTodayDateStr() { var d = new Date(); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); }
function getYesterdayDateStr() { var d = new Date(); d.setDate(d.getDate() - 1); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); }

function renderCalModalBody(monthKey) {
  var year = state.activeYear || 2026;
  var mData = getMonthData(monthKey, year);
  var tbody = document.getElementById('cal-modal-body');
  var title = document.getElementById('cal-modal-title');
  if (!tbody || !title) return;
  title.textContent = monthNames[monthKey] + ' ' + year;

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
      var inRange = false, isRangeStart = false, isRangeEnd = false, isPending = false;

      if (hasData && periodRange.start && periodRange.end) {
        var dNum = dateToNum(dateStr);
        var sNum = dateToNum(pad(periodRange.start.day) + '/' + pad(periodRange.start.month));
        var eNum = dateToNum(pad(periodRange.end.day) + '/' + pad(periodRange.end.month));
        if (dNum >= sNum && dNum <= eNum) inRange = true;
        if (dNum === sNum) isRangeStart = true;
        if (dNum === eNum) isRangeEnd = true;
      }

      if (rangeStartPending && dateStr === rangeStartPending) isPending = true;

      var classNames = 'cm-day';
      if (isWeekend) classNames += ' cm-weekend';
      if (!hasData) classNames += ' cm-disabled';
      if (isPending) classNames += ' cm-pending';
      if (inRange && !isRangeStart && !isRangeEnd) classNames += ' cm-in-range';
      if (isRangeStart) classNames += ' cm-range-start';
      if (isRangeEnd) classNames += ' cm-range-end';
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
  var now = new Date();
  var currentMonthNames = { 5:'may',6:'jun',7:'jul',8:'aug',9:'sep',10:'oct',11:'nov',12:'dec' };
  modalMonthKey = currentMonthNames[now.getMonth() + 1] || 'may';
  rangeStartPending = null;
  renderCalModalBody(modalMonthKey);
  overlay.classList.add('open');
  if (periodRange.start && periodRange.end) {
    var s = pad(periodRange.start.day) + '/' + pad(periodRange.start.month);
    var e = pad(periodRange.end.day) + '/' + pad(periodRange.end.month);
    document.getElementById('period-info').textContent = s + ' a ' + e + ' \u2014 clique para alterar';
  } else {
    document.getElementById('period-info').textContent = 'Clique em dois dias para definir o per\u00edodo';
  }
}

function closeCalModal() {
  var overlay = document.getElementById('cal-modal-overlay');
  if (overlay) overlay.classList.remove('open');
  rangeStartPending = null;
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

  if (!rangeStartPending) {
    rangeStartPending = dateStr;
    renderCalModalBody(modalMonthKey);
    document.getElementById('period-info').textContent = 'In\u00edcio: ' + dateStr + ' \u2014 clique no dia final';
    return;
  }

  var startNum = dateToNum(rangeStartPending);
  var endNum = dateToNum(dateStr);
  var startStr = startNum <= endNum ? rangeStartPending : dateStr;
  var endStr = startNum <= endNum ? dateStr : rangeStartPending;

  periodRange = { start: parseDateStr(startStr), end: parseDateStr(endStr) };
  rangeStartPending = null;
  selectedDateStr = startStr + ' - ' + endStr;

  updateTriggerLabel();
  closeCalModal();
  setTimeout(function() { applyRange(startStr, endStr); }, 0);
}

function applyRange(startStr, endStr) {
  var totalAcumulado = getRangeAcumulado(startStr, endStr);
  state.dados = totalAcumulado;
  var dayNames = { d1: 'Segunda-feira', d2: 'Ter\u00e7a-feira', d3: 'Quarta-feira', d4: 'Quinta-feira', d5: 'Sexta-feira' };
  document.getElementById('page-sub').textContent = 'Per\u00edodo: ' + startStr + ' a ' + endStr;
  var titles = { geral: 'Vis\u00e3o Geral', hp: 'HP', urbi_recanto: 'URBI Recanto', urbi_samambaia: 'URBI Samambaia', maas: 'MAAS' };
  document.getElementById('page-title').textContent = titles[state.paginaAtual];
  atualizarDashboardCompleto();
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
  var today = new Date();
  var todayStr = getTodayDateStr();

  switch (preset) {
    case 'day':
      if (dateLookup[todayStr]) {
        periodRange = { start: parseDateStr(todayStr), end: parseDateStr(todayStr) };
        selectedDateStr = todayStr + ' - ' + todayStr;
        updateTriggerLabel();
        applyRange(todayStr, todayStr);
      } else {
        document.getElementById('period-info').textContent = 'Hoje sem dados. Selecione um dia no calend\u00e1rio.';
      }
      break;
    case 'last7': {
      var sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);
      var startStr = pad(sevenDaysAgo.getDate()) + '/' + pad(sevenDaysAgo.getMonth() + 1);
      var endStr = todayStr;
      periodRange = { start: parseDateStr(startStr), end: parseDateStr(endStr) };
      selectedDateStr = startStr + ' - ' + endStr;
      updateTriggerLabel();
      applyRange(startStr, endStr);
      break;
    }
    case 'month': {
      var firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      var lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
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
