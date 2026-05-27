var state = {
  activeYear: 2026,
  activeMonth: 'may',
  activeWeek: 2,
  activeDate: '11/05',
  dataAtual: 'd1',
  paginaAtual: 'geral',
  dados: null,
  dadosPorData: null
};

function setActiveYear(y) { state.activeYear = y; }
function setActiveMonth(m) { state.activeMonth = m; }
function setActiveWeek(n) { state.activeWeek = n; }
function setDataAtual(d) { state.dataAtual = d; }
function setPaginaAtual(p) { state.paginaAtual = p; }
function setDadosPorData(data) { state.dadosPorData = data; }
function setActiveDate(d) { state.activeDate = d; }

function updateDados() {
  state.dados = state.dataAtual === 'acumulado'
    ? getDadosAcumulados(state.dadosPorData)
    : state.dadosPorData[state.dataAtual];
}

function getActiveWeekData() {
  var m = DATA_REGISTRY[state.activeYear]?.[state.activeMonth];
  return m?.weeks[state.activeWeek] || null;
}

function getActiveMonthLabel() {
  var m = DATA_REGISTRY[state.activeYear]?.[state.activeMonth];
  return m ? m.month : '';
}

function getActiveYearLabel() {
  return String(state.activeYear);
}
