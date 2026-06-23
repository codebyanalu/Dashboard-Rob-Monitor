function atualizarDashboardCompleto() {
  if (!state.dados) return;

  atualizarKPICards();
  atualizarGraficosGerais();
  atualizarInsightGeral();

  var empresasIds = getEmpresaIdsPermitidos();

  if (empresasIds.indexOf('hp') !== -1) {
    atualizarCardsEmpresa('hp', 'hp-cards', 'HP');
    atualizarGraficosEmpresa('hp', 'hp_bar', 'hp_pie');
    atualizarProgressoEmpresa('hp', 'hp-progress');
    atualizarTabelaEmpresa('hp', 'hp-dist-detail', 'HP');
    atualizarInsightEmpresa('hp', 'insight-hp', 'HP');
    atualizarEmpresaExtra('hp', 'HP', '#1B1F5E');
  }

  if (empresasIds.indexOf('urbi_recanto') !== -1) {
    atualizarCardsEmpresa('urbi_recanto', 'rec-cards', 'URBI Recanto');
    atualizarGraficosEmpresa('urbi_recanto', 'rec_bar', 'rec_pie');
    atualizarProgressoEmpresa('urbi_recanto', 'rec-progress');
    atualizarTabelaEmpresa('urbi_recanto', 'rec-dist-detail', 'URBI Recanto');
    atualizarInsightEmpresa('urbi_recanto', 'insight-rec', 'URBI Recanto');
    atualizarEmpresaExtra('urbi_recanto', 'URBI Recanto', '#2E7D32', 'rec');
  }

  if (empresasIds.indexOf('urbi_samambaia') !== -1) {
    atualizarCardsEmpresa('urbi_samambaia', 'sam-cards', 'URBI Samambaia');
    atualizarGraficosEmpresa('urbi_samambaia', 'sam_bar', 'sam_pie');
    atualizarProgressoEmpresa('urbi_samambaia', 'sam-progress');
    atualizarTabelaEmpresa('urbi_samambaia', 'sam-dist-detail', 'URBI Samambaia');
    atualizarInsightEmpresa('urbi_samambaia', 'insight-sam', 'URBI Samambaia');
    atualizarEmpresaExtra('urbi_samambaia', 'URBI Samambaia', '#ED6C02', 'sam');
  }

  if (empresasIds.indexOf('maas') !== -1) {
    atualizarCardsMaas();
    atualizarGraficosMaas();
    atualizarProgressoEmpresa('maas', 'maas-progress');
    atualizarTabelaEmpresa('maas', 'maas-dist-detail', 'MAAS');
    atualizarInsightMaas();
    atualizarEmpresaExtraMaas();
  }
}

window.atualizarDashboardCompleto = atualizarDashboardCompleto;

function showPage(id, el) {
  if (!id) return;
  if (!authService.validarSessao()) {
    logoutUser();
    return;
  }
  if (id !== 'geral' && id !== 'alertas' && id !== 'relatorios' && id !== 'configuracoes') {
    if (!isEmpresaPermitida(id)) {
      mostrarToast('Acesso não autorizado a esta página');
      return;
    }
  }
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
  if (id === 'geral') atualizarGraficosGerais();
}
window.showPage = showPage;

function renderPersonSelector(companyId) {
  var container = document.getElementById('maas-person-selector');
  if (!container) return;
  var c = getCompany(companyId);
  if (!c || !c.responsaveis) return;
  var html = '<span class="ps-label">Responsável:</span>';
  html += '<button class="person-btn person-all' + (state.maasPersona === 'all' ? ' active' : '') + '" data-person="all">Todos</button>';
  c.responsaveis.forEach(function(p) {
    var active = state.maasPersona === p.id ? ' active' : '';
    var safeId = window.escapeHtml(p.id);
    var safeNome = window.escapeHtml(p.nome);
    html += '<button class="person-btn' + active + '" style="' + (active ? 'background:' + window.escapeHtml(p.corBg) + ';border-color:' + window.escapeHtml(p.cor) + ';color:' + window.escapeHtml(p.cor) : '') + '" data-person="' + safeId + '">' + safeNome + '</button>';
  });
  container.innerHTML = html;
}

document.addEventListener('click', function(e) {
  var btn = e.target.closest('#maas-person-selector .person-btn');
  if (btn) {
    switchMaasPerson(btn.getAttribute('data-person'));
  }
});

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
    var opt = document.createElement('option');
    opt.value = p.id;
    if (state.maasPersona === p.id) opt.selected = true;
    opt.textContent = p.nome;
    sel.appendChild(opt);
  });
  var cb = document.getElementById('cfg-sidebar-collapsed');
  if (cb) cb.checked = document.body.classList.contains('sidebar-collapsed');
}

if (loadSidebarState()) {
  document.body.classList.add('sidebar-collapsed');
}

function initDashboard() {
  dataLoader.load(function(err) {
    if (err) {
      mostrarToast('Erro ao carregar dados: ' + err.message);
      return;
    }
    buildDateLookup();

    var targetStr = findClosestAvailableDate();
    if (targetStr) {
      periodRange = { start: parseDateStr(targetStr), end: parseDateStr(targetStr) };
      selectedDateStr = targetStr + ' - ' + targetStr;
      state.dadosCompletos = getRangeAcumulado(targetStr, targetStr);
      filtrarDadosPorPermissao();
      updateTriggerLabel();
      document.getElementById('page-sub').textContent = 'Data: ' + targetStr;
    }
    aplicarRestricoesSidebar();
    atualizarDashboardCompleto();
    populateConfigSelect();
    esconderPaginasRestritas();
  });
}

function filtrarDadosPorPermissao() {
  if (!state.dadosCompletos) { state.dados = null; return; }
  if (!state.user || state.user.allowedCompanies === 'all') {
    state.dados = state.dadosCompletos;
    return;
  }
  var filtrado = {};
  state.user.allowedCompanies.forEach(function(id) {
    if (state.dadosCompletos[id]) {
      filtrado[id] = state.dadosCompletos[id];
    }
  });
  state.dados = filtrado;
}

function aplicarRestricoesSidebar() {
  var navItems = document.querySelectorAll('.nav-item[data-company]');
  navItems.forEach(function(item) {
    var company = item.getAttribute('data-company');
    if (isEmpresaPermitida(company)) {
      item.classList.remove('hidden');
    } else {
      item.classList.add('hidden');
    }
  });

  var empresasLabel = document.querySelector('.nav-label');
  var empresaNavs = document.querySelectorAll('.nav-item[data-company]');
  var visibleCount = 0;
  empresaNavs.forEach(function(n) { if (!n.classList.contains('hidden')) visibleCount++; });
  if (empresasLabel && visibleCount === 0) {
    empresasLabel.classList.add('hidden');
  } else if (empresasLabel) {
    empresasLabel.classList.remove('hidden');
  }
}

function esconderPaginasRestritas() {
  var paginas = ['hp', 'urbi_recanto', 'urbi_samambaia', 'maas'];
  paginas.forEach(function(id) {
    var el = document.getElementById(id);
    if (el && !isEmpresaPermitida(id)) {
      el.parentNode.removeChild(el);
    }
  });
}

function getEscopoLabel() {
  if (!state.user) return '';
  if (state.user.allowedCompanies === 'all') return 'Acesso total';
  var nomes = state.user.allowedCompanies.map(function(id) {
    var c = getCompany(id);
    return c ? c.nome : id;
  });
  return nomes.join(', ');
}

function atualizarTopbarUsuario() {
  var container = document.querySelector('.topbar-right');
  if (!container) return;

  var existing = document.getElementById('topbar-user-area');
  if (existing) existing.remove();

  if (!state.user) return;

  var div = document.createElement('div');
  div.id = 'topbar-user-area';
  div.style.cssText = 'display:flex;align-items:center;gap:6px;margin-right:8px';

  var initials = state.user.name.split(' ').map(function(s) { return s[0]; }).join('').substring(0, 2).toUpperCase();

  div.innerHTML =
    '<div class="topbar-user" onclick="toggleUserMenu()" title="' + state.user.name + '">' +
      '<div class="topbar-user-avatar">' + initials + '</div>' +
      '<span class="topbar-user-name">' + state.user.name.split(' ')[0] + '</span>' +
      '<span style="font-size:9px;color:#94A3B8;background:#F1F5F9;padding:1px 6px;border-radius:4px;margin-left:4px;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + getEscopoLabel() + '</span>' +
    '</div>';

  container.insertBefore(div, container.firstChild);
}

window.toggleUserMenu = function() {
  var menu = document.getElementById('user-menu-dropdown');
  if (menu) {
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
  } else {
    var div = document.createElement('div');
    div.id = 'user-menu-dropdown';
    div.style.cssText = 'position:absolute;top:100%;right:0;background:#fff;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,0.12);padding:4px;z-index:1000;min-width:180px;margin-top:4px';
    div.innerHTML =
      '<div style="padding:8px 12px;font-size:11px;color:#64748B;border-bottom:1px solid #F1F5F9">' + state.user.name + '</div>' +
      '<div style="padding:8px 12px;font-size:11px;color:#64748B">' + state.user.email + '</div>' +
      '<hr style="border:none;border-top:1px solid #F1F5F9;margin:4px 0">' +
      '<button onclick="logoutUser()" style="width:100%;background:none;border:none;padding:8px 12px;font-size:12px;color:#DC2626;cursor:pointer;border-radius:4px;display:flex;align-items:center;gap:6px;font-family:inherit">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
        'Sair' +
      '</button>' +
    '</div>';
    var btn = document.querySelector('.topbar-user');
    if (btn) {
      btn.style.position = 'relative';
      btn.parentElement.style.position = 'relative';
      btn.parentElement.appendChild(div);
    }
  }
};

document.addEventListener('click', function(e) {
  if (!e.target.closest('.topbar-user') && !e.target.closest('#user-menu-dropdown')) {
    var menu = document.getElementById('user-menu-dropdown');
    if (menu) menu.style.display = 'none';
  }
});

window.logoutUser = function() {
  authService.logout(function() {
    var overlay = document.getElementById('login-overlay');
    if (overlay) overlay.classList.remove('hidden');

    var menu = document.getElementById('user-menu-dropdown');
    if (menu) menu.style.display = 'none';

    state.user = null;
    state.isAuthenticated = false;
    state.dados = null;
    state.dadosCompletos = null;

    var userArea = document.getElementById('topbar-user-area');
    if (userArea) userArea.remove();

    mostrarToast('Sessão encerrada');
  });
};

var sessao = authService.checkSession();
if (sessao) {
  state.user = {
    email: sessao.email,
    name: sessao.name,
    role: sessao.role,
    allowedCompanies: sessao.allowedCompanies
  };
  state.isAuthenticated = true;
  document.getElementById('login-overlay').classList.add('hidden');
  atualizarTopbarUsuario();
  dataLoader.load(function(err) {
    if (err) {
      mostrarToast('Erro ao carregar dados');
      return;
    }
    buildDateLookup();
    var targetStr = findClosestAvailableDate();
    if (targetStr) {
      periodRange = { start: parseDateStr(targetStr), end: parseDateStr(targetStr) };
      selectedDateStr = targetStr + ' - ' + targetStr;
      state.dadosCompletos = getRangeAcumulado(targetStr, targetStr);
      filtrarDadosPorPermissao();
      updateTriggerLabel();
      document.getElementById('page-sub').textContent = 'Data: ' + targetStr;
    }
    aplicarRestricoesSidebar();
    atualizarDashboardCompleto();
    populateConfigSelect();
    esconderPaginasRestritas();
  });
} else {
  document.getElementById('login-overlay').classList.remove('hidden');
}
