var dateLookup = {};
var monthDataCache = {};
var monthOrder = ['may','jun','jul','aug','sep','oct','nov','dec'];
var monthNames = { may:'Maio', jun:'Junho', jul:'Julho', aug:'Agosto', sep:'Setembro', oct:'Outubro', nov:'Novembro', dec:'Dezembro' };
var selectedDateStr = null;
var modalMonthKey = 'may';

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
  for (var i = 0; i < blankStart; i++) {
    currentWeek.push(null);
  }
  for (var d = 1; d <= daysInMonth; d++) {
    currentWeek.push(d);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  var result = { monthKey: monthKey, monthNum: monthNum, daysInMonth: daysInMonth, weeks: weeks };
  monthDataCache[cacheKey] = result;
  return result;
}

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function makeDateStr(dayNum, monthNum) {
  return pad(dayNum) + '/' + pad(monthNum);
}

function updateTriggerLabel() {
  var el = document.getElementById('cal-trigger-label');
  if (!el) return;
  if (selectedDateStr) {
    var parts = selectedDateStr.split('/');
    var day = parseInt(parts[0]);
    var monthNum = parseInt(parts[1]);
    var monthIdx = monthNum - 5;
    var monthLabel = (monthIdx >= 0 && monthIdx < monthOrder.length) ? monthNames[monthOrder[monthIdx]] : '';
    el.textContent = '📅 ' + day + ' ' + monthLabel;
  } else {
    el.textContent = '📅 Selecionar data';
  }
}

function updateActiveRange(weekNum) {
  var el = document.getElementById('db-active-range');
  if (!el) return;
  var reg = DATA_REGISTRY[2026];
  var mk = state.activeMonth;
  if (reg[mk] && reg[mk].weeks[weekNum]) {
    var c = reg[mk].weeks[weekNum].calendar;
    el.textContent = c.label + ' (' + c.periodo + ')';
  } else {
    el.textContent = '—';
  }
}

function updateMonthButtons(monthKey) {
  var btns = document.querySelectorAll('#month-selector .filter-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('active', btns[i].dataset.month === monthKey);
  }
}

function applyMonthActivation(monthKey) {
  var year = state.activeYear || 2026;
  var reg = DATA_REGISTRY[year];
  if (reg && reg[monthKey]) {
    state.activeMonth = monthKey;
  }
}

function renderCalModalBody(monthKey) {
  var year = state.activeYear || 2026;
  var mData = getMonthData(monthKey, year);
  var tbody = document.getElementById('cal-modal-body');
  var title = document.getElementById('cal-modal-title');
  var info = document.getElementById('cal-modal-info');
  if (!tbody || !title) return;

  title.textContent = monthNames[monthKey] + ' ' + year;
  info.textContent = 'Clique em um dia para visualizar';

  var html = '';
  for (var wi = 0; wi < mData.weeks.length; wi++) {
    var week = mData.weeks[wi];
    html += '<tr>';
    for (var di = 0; di < week.length; di++) {
      var dayNum = week[di];
      if (dayNum === null) {
        html += '<td class="cm-empty"></td>';
      } else {
        var dateStr = makeDateStr(dayNum, mData.monthNum);
        var lookup = dateLookup[dateStr];
        var hasData = !!lookup;
        var isSelected = (selectedDateStr === dateStr);
        var isWeekend = (di >= 5);
        var classNames = 'cm-day';
        if (isWeekend) classNames += ' cm-weekend';
        if (!hasData) classNames += ' cm-disabled';
        if (isSelected) classNames += ' cm-selected';
        if (lookup && lookup.monthKey === monthKey && !isWeekend) classNames += ' cm-clickable';
        var onClick = (hasData && !isWeekend) ? 'onclick="calendarDayClick(\'' + dateStr + '\')"' : '';
        html += '<td class="' + classNames + '" ' + onClick + '><div class="cm-day-inner">' + dayNum + '</div></td>';
      }
    }
    html += '</tr>';
  }
  tbody.innerHTML = html;
}

function toggleCalModal() {
  var overlay = document.getElementById('cal-modal-overlay');
  if (!overlay) return;
  if (overlay.classList.contains('open')) {
    closeCalModal();
  } else {
    openCalModal();
  }
}

function openCalModal() {
  buildDateLookup();
  var overlay = document.getElementById('cal-modal-overlay');
  if (!overlay) return;
  modalMonthKey = state.activeMonth || 'may';
  renderCalModalBody(modalMonthKey);
  overlay.classList.add('open');
}

function closeCalModal() {
  var overlay = document.getElementById('cal-modal-overlay');
  if (overlay) overlay.classList.remove('open');
}

function modalPrevMonth() {
  var idx = monthOrder.indexOf(modalMonthKey);
  if (idx > 0) {
    modalMonthKey = monthOrder[idx - 1];
    renderCalModalBody(modalMonthKey);
  }
}

function modalNextMonth() {
  var idx = monthOrder.indexOf(modalMonthKey);
  if (idx < monthOrder.length - 1) {
    modalMonthKey = monthOrder[idx + 1];
    renderCalModalBody(modalMonthKey);
  }
}

function calendarDayClick(dateStr) {
  var lookup = dateLookup[dateStr];
  if (!lookup) return;
  selectedDateStr = dateStr;
  state.activeMonth = lookup.monthKey;
  state.activeWeek = lookup.weekNum;
  state.activeDate = dateStr;

  applyMonthActivation(lookup.monthKey);
  switchDashboard(lookup.weekNum, lookup.dayKey);

  updateTriggerLabel();
  updateMonthButtons(lookup.monthKey);
  updateActiveRange(lookup.weekNum);
  closeCalModal();
}
