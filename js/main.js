function atualizarDashboardCompleto() {
  if (!state.dados) return;
  atualizarCardsGerais();
  atualizarGraficosGerais();
  atualizarTabelaConsolidada();
  atualizarRanking();
  atualizarInsightGeral();

  atualizarCardsEmpresa('hp', 'hp-cards', 'HP');
  atualizarCardsEmpresa('urbi_recanto', 'rec-cards', 'URBI Recanto');
  atualizarCardsEmpresa('urbi_samambaia', 'sam-cards', 'URBI Samambaia');
  atualizarCardsMaas();

  atualizarGraficosEmpresa('hp', 'hp_bar', 'hp_pie');
  atualizarGraficosEmpresa('urbi_recanto', 'rec_bar', 'rec_pie');
  atualizarGraficosEmpresa('urbi_samambaia', 'sam_bar', 'sam_pie');
  atualizarGraficosMaas();

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
  atualizarInsightMaas();
}

window.atualizarDashboardCompleto = atualizarDashboardCompleto;

window.showPage = function(id, el) {
  setPaginaAtual(id);
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
  if (el) el.classList.add('active');
  var titles = { geral: 'Vis\u00e3o Geral', hp: 'HP', urbi_recanto: 'URBI Recanto', urbi_samambaia: 'URBI Samambaia', maas: 'MAAS' };
  document.getElementById('page-title').textContent = titles[id];
  if (periodRange.start && periodRange.end) {
    var s = pad(periodRange.start.day) + '/' + pad(periodRange.start.month);
    var e = pad(periodRange.end.day) + '/' + pad(periodRange.end.month);
    document.getElementById('page-sub').textContent = s === e ? 'Data: ' + s : 'Per\u00edodo: ' + s + ' a ' + e;
  }
};

function renderPersonSelector(companyId) {
  var container = document.getElementById('maas-person-selector');
  if (!container) return;
  var c = getCompany(companyId);
  if (!c || !c.responsaveis) return;
  var html = '<span class="ps-label">Respons\u00e1vel:</span>';
  html += '<button class="person-btn person-all' + (state.maasPersona === 'all' ? ' active' : '') + '" data-person="all" onclick="switchMaasPerson(\'all\')">Todos</button>';
  c.responsaveis.forEach(function(p) {
    var active = state.maasPersona === p.id ? ' active' : '';
    html += '<button class="person-btn' + active + '" style="' + (active ? 'background:' + p.corBg + ';border-color:' + p.cor + ';color:' + p.cor : '') + '" data-person="' + p.id + '" onclick="switchMaasPerson(\'' + p.id + '\')">' + p.nome + '</button>';
  });
  container.innerHTML = html;
}

window.switchMaasPerson = function(personId) {
  setMaasPersona(personId);
  renderPersonSelector('maas');
renderPersonSelector('maas');

atualizarDashboardCompleto();
  var c = getCompany('maas');
  var person = c.responsaveis.find(function(r) { return r.id === personId; });
  mostrarToast('Visualizando: ' + (person ? person.nome : 'Todos'));
};

if (loadSidebarState()) {
  document.body.classList.add('sidebar-collapsed');
}

buildDateLookup();

var todayStr = getTodayDateStr();
if (dateLookup[todayStr]) {
  periodRange = { start: parseDateStr(todayStr), end: parseDateStr(todayStr) };
  selectedDateStr = todayStr + ' - ' + todayStr;
  state.dados = getRangeAcumulado(todayStr, todayStr);
  updateTriggerLabel();
  document.getElementById('page-sub').textContent = 'Data: ' + todayStr;
} else {
  var firstDate = Object.keys(dateLookup)[0];
  if (firstDate) {
    periodRange = { start: parseDateStr(firstDate), end: parseDateStr(firstDate) };
    selectedDateStr = firstDate + ' - ' + firstDate;
    state.dados = getRangeAcumulado(firstDate, firstDate);
    updateTriggerLabel();
    document.getElementById('page-sub').textContent = 'Data: ' + firstDate;
  }
}

atualizarDashboardCompleto();
