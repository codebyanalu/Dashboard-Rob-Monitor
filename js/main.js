function atualizarDashboardCompleto() {
  atualizarDateStatsCards();
  atualizarCardsGerais();
  atualizarGraficosGerais();
  atualizarTabelaConsolidada();
  atualizarRanking();
  atualizarInsightGeral();

  atualizarCardsEmpresa('hp', 'hp-cards', 'HP');
  atualizarCardsEmpresa('urbi_recanto', 'rec-cards', 'URBI Recanto');
  atualizarCardsEmpresa('urbi_samambaia', 'sam-cards', 'URBI Samambaia');
  atualizarCardsEmpresa('maas', 'maas-cards', 'MAAS');

  atualizarGraficosEmpresa('hp', 'hp_bar', 'hp_pie');
  atualizarGraficosEmpresa('urbi_recanto', 'rec_bar', 'rec_pie');
  atualizarGraficosEmpresa('urbi_samambaia', 'sam_bar', 'sam_pie');
  atualizarGraficosEmpresa('maas', 'maas_bar', 'maas_pie');

  atualizarProgressoEmpresa('hp', 'hp-progress');
  atualizarProgressoEmpresa('urbi_recanto', 'rec-progress');
  atualizarProgressoEmpresa('urbi_samambaia', 'sam-progress');
  atualizarProgressoEmpresa('maas', 'maas-progress');

  atualizarTabelaEmpresa('hp', 'tabela-hp', 'HP');
  atualizarTabelaEmpresa('urbi_recanto', 'tabela-rec', 'URBI Recanto');
  atualizarTabelaEmpresa('urbi_samambaia', 'tabela-sam', 'URBI Samambaia');
  atualizarTabelaEmpresa('maas', 'tabela-maas', 'MAAS');

  atualizarInsightEmpresa('hp', 'insight-hp', 'HP');
  atualizarInsightEmpresa('urbi_recanto', 'insight-rec', 'URBI Recanto');
  atualizarInsightEmpresa('urbi_samambaia', 'insight-sam', 'URBI Samambaia');
  atualizarInsightEmpresa('maas', 'insight-maas', 'MAAS');
}

window.atualizarDashboardCompleto = atualizarDashboardCompleto;

window.showPage = function(id, el) {
  setPaginaAtual(id);
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
  if (el) el.classList.add('active');
  var titles = { geral: 'Visão Geral', hp: 'HP', urbi_recanto: 'URBI Recanto', urbi_samambaia: 'URBI Samambaia', maas: 'MAAS' };
  document.getElementById('page-title').textContent = getActiveMonthLabel() + ' ' + getActiveYearLabel() + ' · ' + titles[id];
  atualizarDateStatsCards();
};

window.changeData = function(data) {
  setDataAtual(data);
  updateDados();
  var dayNames = { d1: 'Segunda-feira', d2: 'Terça-feira', d3: 'Quarta-feira', d4: 'Quinta-feira', d5: 'Sexta-feira' };
  var dataStr = data === 'acumulado' ? 'Total Acumulado' : (dayNames[data] || data);
  var weekData = getActiveWeekData();
  var cal = weekData?.calendar;
  var dataExibicao = (data !== 'acumulado' && cal?.dias[data]) ? ' ' + cal.dias[data].display : '';
  document.getElementById('page-sub').textContent = 'Semana ' + state.activeWeek + ' · ' + dataStr + dataExibicao;

  if (data !== 'acumulado' && cal?.dias[data]) {
    selectedDateStr = cal.dias[data].display;
    updateTriggerLabel();
  }

  atualizarDashboardCompleto();
  mostrarToast('Visualizando ' + dataStr);
};

window.switchDashboard = function(weekNum, dayKey) {
  setActiveWeek(weekNum);
  if (dayKey) setDataAtual(dayKey);

  var weekData = getActiveWeekData();
  if (!weekData) return;

  var saved = loadWeekData(weekNum);
  var dadosClone = JSON.parse(JSON.stringify(saved || weekData.defaults));
  setDadosPorData(dadosClone);
  updateDados();

  var cal = weekData.calendar;
  updateActiveRange(weekNum);

  var titles = { geral: 'Visão Geral', hp: 'HP', urbi_recanto: 'URBI Recanto', urbi_samambaia: 'URBI Samambaia', maas: 'MAAS' };
  document.getElementById('page-title').textContent = getActiveMonthLabel() + ' ' + getActiveYearLabel() + ' · ' + titles[state.paginaAtual];

  var dayNames = { d1: 'Segunda-feira', d2: 'Terça-feira', d3: 'Quarta-feira', d4: 'Quinta-feira', d5: 'Sexta-feira' };
  var dataStr = state.dataAtual === 'acumulado' ? 'Acumulado' : (dayNames[state.dataAtual] || state.dataAtual);
  var dataExibicao = (state.dataAtual !== 'acumulado' && cal?.dias[state.dataAtual]) ? ' ' + cal.dias[state.dataAtual].display : '';
  document.getElementById('page-sub').textContent = 'Semana ' + weekNum + ' · ' + dataStr + dataExibicao;

  atualizarDashboardCompleto();
  mostrarToast(dayKey ? 'Dia ' + dataStr : 'Semana ' + weekNum);
};

function rebuildMonthSelector() {
  var months = getYearMonths(state.activeYear);
  var container = document.getElementById('month-selector');
  container.innerHTML = '';
  months.forEach(function(m) {
    var btn = document.createElement('button');
    btn.className = 'filter-btn' + (m.key === state.activeMonth ? ' active' : '');
    btn.setAttribute('data-month', m.key);
    btn.textContent = m.label.slice(0, 3);
    btn.onclick = function() { switchMonth(m.key); };
    container.appendChild(btn);
  });
}

function rebuildWeekSelector() {
  var weeks = getMonthWeeks(state.activeYear, state.activeMonth);
  var container = document.getElementById('week-selector');
  container.innerHTML = '';
  weeks.forEach(function(w) {
    var btn = document.createElement('button');
    btn.className = 'filter-btn' + (w.num === state.activeWeek ? ' active' : '');
    btn.setAttribute('data-week', w.num);
    btn.textContent = 'S' + w.num;
    btn.onclick = function() { switchDashboard(w.num); };
    container.appendChild(btn);
  });
}

window.switchYear = function(year) {
  setActiveYear(year);
  var months = getYearMonths(year);
  if (months.length > 0) {
    switchMonth(months[0].key);
  }
  document.querySelectorAll('#year-selector .filter-btn').forEach(function(b) {
    b.classList.remove('active');
  });
  var btn = document.querySelector('#year-selector .filter-btn[data-year="' + year + '"]');
  if (btn) btn.classList.add('active');
};

window.switchMonth = function(monthKey) {
  setActiveMonth(monthKey);
  rebuildMonthSelector();
  var weeks = getMonthWeeks(state.activeYear, monthKey);
  if (weeks.length > 0) {
    var firstWeek = weeks[0].num;
    var reg = DATA_REGISTRY[state.activeYear][monthKey];
    var firstDayKey = Object.keys(reg.weeks[firstWeek].calendar.dias)[0];
    selectedDateStr = reg.weeks[firstWeek].calendar.dias[firstDayKey].display;
    switchDashboard(firstWeek, firstDayKey);
    updateTriggerLabel();
  }
};

if (loadSidebarState()) {
  document.body.classList.add('sidebar-collapsed');
}

rebuildMonthSelector();

buildDateLookup();
var initialDate = state.activeDate || '11/05';
var initLookup = dateLookup[initialDate] || null;
if (initLookup) {
  state.activeMonth = initLookup.monthKey;
  state.activeWeek = initLookup.weekNum;
}
selectedDateStr = initialDate;
updateMonthButtons(state.activeMonth);

var weekData = getActiveWeekData();
if (weekData) {
  var saved = loadWeekData(state.activeWeek);
  var dadosClone = JSON.parse(JSON.stringify(saved || weekData.defaults));
  setDadosPorData(dadosClone);
  updateDados();
}

atualizarDashboardCompleto();
updateTriggerLabel();
var pageTitles = { geral: 'Visão Geral', hp: 'HP', urbi_recanto: 'URBI Recanto', urbi_samambaia: 'URBI Samambaia', maas: 'MAAS' };
document.getElementById('page-title').textContent = getActiveMonthLabel() + ' ' + getActiveYearLabel() + ' · ' + pageTitles[state.paginaAtual];
var dayNames = { d1: 'Segunda-feira', d2: 'Terça-feira', d3: 'Quarta-feira', d4: 'Quinta-feira', d5: 'Sexta-feira' };
var dataStr = dayNames[state.dataAtual] || '';
var weekData2 = getActiveWeekData();
var cal = weekData2?.calendar;
var dataExibicao = cal?.dias[state.dataAtual] ? (' ' + cal.dias[state.dataAtual].display) : '';
document.getElementById('page-sub').textContent = 'Semana ' + state.activeWeek + ' · ' + dataStr + dataExibicao;
updateActiveRange(state.activeWeek);
