function atualizarDashboardCompleto() {
  if (!state.dados) return;

  atualizarKPICards();
  atualizarGraficosGerais();
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

  atualizarTabelaEmpresa('hp', 'hp-dist-detail', 'HP');
  atualizarTabelaEmpresa('urbi_recanto', 'rec-dist-detail', 'URBI Recanto');
  atualizarTabelaEmpresa('urbi_samambaia', 'sam-dist-detail', 'URBI Samambaia');
  atualizarTabelaEmpresa('maas', 'maas-dist-detail', 'MAAS');

  atualizarInsightEmpresa('hp', 'insight-hp', 'HP');
  atualizarInsightEmpresa('urbi_recanto', 'insight-rec', 'URBI Recanto');
  atualizarInsightEmpresa('urbi_samambaia', 'insight-sam', 'URBI Samambaia');
  atualizarInsightMaas();

  atualizarEmpresaExtra('hp', 'HP', '#1B1F5E');
  atualizarEmpresaExtra('urbi_recanto', 'URBI Recanto', '#2E7D32');
  atualizarEmpresaExtra('urbi_samambaia', 'URBI Samambaia', '#ED6C02');
  atualizarEmpresaExtraMaas();
}

window.atualizarDashboardCompleto = atualizarDashboardCompleto;

function showPage(id, el) {
  if (!id) return;
  setPaginaAtual(id);
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
  var pg = document.getElementById(id);
  if (pg) pg.classList.add('active');
  if (el) el.classList.add('active');
  var titles = { geral: 'Visão Geral', hp: 'HP', urbi_recanto: 'URBI Recanto', urbi_samambaia: 'URBI Samambaia', maas: 'MAAS', alertas: 'Alertas', relatorios: 'Relatórios', configuracoes: 'Configurações' };
  var subs = { geral: 'Resumo executivo da operação', hp: 'Detalhamento HP', urbi_recanto: 'Detalhamento URBI Recanto', urbi_samambaia: 'Detalhamento URBI Samambaia', maas: 'Detalhamento MAAS', alertas: 'Alertas inteligentes da operação', relatorios: 'Exportação e tabelas consolidadas', configuracoes: 'Preferências do dashboard' };
  document.getElementById('page-title').textContent = titles[id] || id;
  if (periodRange.start && periodRange.end) {
    var s = pad(periodRange.start.day) + '/' + pad(periodRange.start.month);
    var e = pad(periodRange.end.day) + '/' + pad(periodRange.end.month);
    document.getElementById('page-sub').textContent = s === e ? 'Data: ' + s : 'Período: ' + s + ' a ' + e;
  } else {
    document.getElementById('page-sub').textContent = subs[id] || '';
  }
  if (id === 'maas') renderPersonSelector('maas');
  if (id === 'relatorios') { atualizarTabelaConsolidada(); atualizarRanking(); }
  if (id === 'alertas') { atualizarAlertas(); }
}
window.showPage = showPage;

function renderPersonSelector(companyId) {
  var container = document.getElementById('maas-person-selector');
  if (!container) return;
  var c = getCompany(companyId);
  if (!c || !c.responsaveis) return;
  var html = '<span class="ps-label">Responsável:</span>';
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
  atualizarDashboardCompleto();
  populateConfigSelect();
  var c = getCompany('maas');
  var person = c.responsaveis.find(function(r) { return r.id === personId; });
  mostrarToast('Visualizando: ' + (person ? person.nome : 'Todos'));
};

/* ── CONFIG FUNCTIONS ── */
function toggleSidebarPref(collapsed) {
  if (collapsed) { document.body.classList.add('sidebar-collapsed'); saveSidebarState(true); }
  else { document.body.classList.remove('sidebar-collapsed'); saveSidebarState(false); }
}
window.toggleSidebarPref = toggleSidebarPref;

function setMaasPersonaPref(personId) {
  setMaasPersona(personId);
  renderPersonSelector('maas');
  atualizarDashboardCompleto();
  populateConfigSelect();
  mostrarToast('Responsável padrão: ' + (personId === 'all' ? 'Todos' : personId));
}

window.setMaasPersonaPref = setMaasPersonaPref;

function populateConfigSelect() {
  var sel = document.getElementById('cfg-maas-persona');
  if (!sel) return;
  var c = getCompany('maas');
  if (!c || !c.responsaveis) return;
  sel.innerHTML = '<option value="all">Todos</option>';
  c.responsaveis.forEach(function(p) {
    var selected = state.maasPersona === p.id ? ' selected' : '';
    sel.innerHTML += '<option value="' + p.id + '"' + selected + '>' + p.nome + '</option>';
  });
  var cb = document.getElementById('cfg-sidebar-collapsed');
  if (cb) cb.checked = document.body.classList.contains('sidebar-collapsed');
}

if (loadSidebarState()) {
  document.body.classList.add('sidebar-collapsed');
}

buildDateLookup();

var targetStr = getYesterdayDateStr();
if (!dateLookup[targetStr]) {
  var keys = Object.keys(dateLookup);
  targetStr = keys[keys.length - 1] || null;
}
if (targetStr) {
  periodRange = { start: parseDateStr(targetStr), end: parseDateStr(targetStr) };
  selectedDateStr = targetStr + ' - ' + targetStr;
  state.dados = getRangeAcumulado(targetStr, targetStr);
  updateTriggerLabel();
  document.getElementById('page-sub').textContent = 'Data: ' + targetStr;
}

atualizarDashboardCompleto();
populateConfigSelect();
