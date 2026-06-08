/* ── SPARKLINE GENERATOR ── */
function generateSparkline(values, color, w, h) {
  w = w || 100; h = h || 36;
  if (!values || values.length < 2) return '';
  var min = Math.min.apply(Math, values);
  var max = Math.max.apply(Math, values);
  if (max === min) { min = 0; }
  var range = max - min || 1;
  var step = w / (values.length - 1);
  var pts = values.map(function(v, i) {
    return (i * step).toFixed(1) + ',' + (h - ((v - min) / range * h)).toFixed(1);
  }).join(' ');
  return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" style="display:block">' +
    '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
    '</svg>';
}

/* ── TREND CALCULATION ── */
function calcTrend(current, previous) {
  if (!previous || previous === 0) return null;
  var diff = current - previous;
  var pct = ((diff / previous) * 100).toFixed(1);
  return { diff: diff, pct: parseFloat(pct), positive: diff >= 0 };
}

function renderTrendHTML(trend, invertGood) {
  if (!trend) return '<span class="trend-neutral">— vs período anterior</span>';
  var isGood = invertGood ? !trend.positive : trend.positive;
  var cls = isGood ? 'trend-up' : 'trend-down';
  var arrow = trend.positive ? '▲' : '▼';
  var abs = Math.abs(trend.pct);
  return '<span class="' + cls + '">' + arrow + ' ' + abs + '%</span> vs período anterior';
}

/* ── KPI CARDS ── */
function atualizarKPICards() {
  if (!state.dados) return;
  var totais = getTotaisGeral(state.dados);
  var monitor = totais.totalMonitor;
  var robo    = totais.totalRobo;
  var prenota = totais.totalPrenota;
  var gap     = Math.max(0, monitor - robo);
  var efic    = monitor > 0 ? ((robo / monitor) * 100).toFixed(1) : 0;

  var dias = [];
  if (periodRange.start && periodRange.end) {
    var s = pad(periodRange.start.day) + '/' + pad(periodRange.start.month);
    var e = pad(periodRange.end.day) + '/' + pad(periodRange.end.month);
    dias = getRangeDiario(s, e);
  }

  var prevTotais = null;
  if (periodRange.start && periodRange.end) {
    var pS = pad(periodRange.start.day) + '/' + pad(periodRange.start.month);
    var pE = pad(periodRange.end.day) + '/' + pad(periodRange.end.month);
    var prevDados = getPrevPeriodTotals(pS, pE);
    prevTotais = getTotaisGeral(prevDados);
  }

  var monitorSeries = dias.map(function(d) { return d.monitor; });
  var roboSeries    = dias.map(function(d) { return d.robo; });
  var prenotaSeries = dias.map(function(d) { return d.prenota; });
  var gapSeries     = dias.map(function(d) { return d.gap; });

  var tMonitor = prevTotais ? calcTrend(monitor, prevTotais.totalMonitor) : null;
  var tRobo    = prevTotais ? calcTrend(robo, prevTotais.totalRobo) : null;
  var tPrenota = prevTotais ? calcTrend(prenota, prevTotais.totalPrenota) : null;
  var prevGap  = prevTotais ? Math.max(0, prevTotais.totalMonitor - prevTotais.totalRobo) : 0;
  var tGap     = prevTotais ? calcTrend(gap, prevGap) : null;
  var prevEfic = prevTotais && prevTotais.totalMonitor > 0 ? ((prevTotais.totalRobo / prevTotais.totalMonitor) * 100) : 0;
  var tEfic    = prevEfic > 0 ? { diff: parseFloat(efic) - prevEfic, pct: (parseFloat(efic) - prevEfic).toFixed(1), positive: parseFloat(efic) >= prevEfic } : null;

  function setCard(id, val, sparkData, color, trend, invertGood, extraHTML) {
    var el = document.getElementById(id);
    if (!el) return;
    var spark = generateSparkline(sparkData, 'rgba(255,255,255,0.7)');
    var trendHTML = renderTrendHTML(trend, invertGood);
    el.querySelector('.kpi-value-num').textContent = val;
    var sp = el.querySelector('.kpi-sparkline-wrap');
    if (sp) sp.innerHTML = spark;
    var tr = el.querySelector('.kpi-trend');
    if (tr) tr.innerHTML = trendHTML;
    if (extraHTML) {
      var ext = el.querySelector('.kpi-extra');
      if (ext) ext.innerHTML = extraHTML;
    }
  }

  setCard('kpi-monitor', monitor, monitorSeries, 'white', tMonitor, false);
  setCard('kpi-robo', robo, roboSeries, 'white', tRobo, false);
  setCard('kpi-prenota', prenota, prenotaSeries, 'white', tPrenota, false);
  setCard('kpi-gap', gap, gapSeries, 'white', tGap, true);

  var efEl = document.getElementById('kpi-eficiencia');
  if (efEl) {
    efEl.querySelector('.kpi-value-num').textContent = efic + '%';
    var pf = efEl.querySelector('.kpi-progress-fill');
    if (pf) pf.style.width = Math.min(100, efic) + '%';
    var tr = efEl.querySelector('.kpi-trend');
    if (tr) {
      if (tEfic) {
        var sign = tEfic.positive ? '▲' : '▼';
        var cls = tEfic.positive ? 'trend-up' : 'trend-down';
        tr.innerHTML = '<span class="' + cls + '">' + sign + ' ' + Math.abs(tEfic.pct) + 'pp</span> vs período anterior';
      } else {
        tr.innerHTML = '<span class="trend-neutral">— vs período anterior</span>';
      }
    }
  }

  atualizarSidebarFooter();
}

/* ── SIDEBAR FOOTER ── */
function atualizarSidebarFooter() {
  var fp = document.getElementById('footer-period');
  if (fp) {
    if (periodRange.start && periodRange.end) {
      var s = pad(periodRange.start.day) + '/' + pad(periodRange.start.month) + '/2026';
      var e = pad(periodRange.end.day) + '/' + pad(periodRange.end.month) + '/2026';
      fp.textContent = s + ' a ' + e;
    } else {
      fp.textContent = '—';
    }
  }
  var fu = document.getElementById('footer-updated-time');
  if (fu) {
    var now = new Date();
    fu.textContent = pad(now.getDate()) + '/' + pad(now.getMonth()+1) + '/2026 ' +
      pad(now.getHours()) + ':' + pad(now.getMinutes());
  }
}

/* ── STATUS DA OPERAÇÃO ── */
function atualizarStatusOperacao() {
  if (!state.dados) return;
  var totais = getTotaisGeral(state.dados);
  var monitor = totais.totalMonitor;
  var robo    = totais.totalRobo;
  var prenota = totais.totalPrenota;
  var gap     = Math.max(0, monitor - robo);
  var total   = monitor + prenota;

  function pct(v) { return total > 0 ? ((v / total) * 100).toFixed(0) : 0; }

  var leg = document.getElementById('status-legend');
  if (leg) {
    var items = [
      { label: 'Escrituradas (Robô)', val: robo, color: '#FF6B35' },
      { label: 'Pré-Nota', val: prenota, color: '#ED6C02' },
      { label: 'Pendentes (GAP)', val: gap, color: '#DC2626' }
    ];
    leg.innerHTML = items.map(function(it) {
      return '<div class="status-legend-item">' +
        '<span class="legend-dot" style="background:' + it.color + '"></span>' +
        '<span class="legend-name">' + it.label + '</span>' +
        '<span class="legend-val">' + it.val + '</span>' +
        '<span class="legend-pct">(' + pct(it.val) + '%)</span>' +
      '</div>';
    }).join('');
  }

  Plotly.newPlot('g_status_donut', [{
    labels: ['Escrituradas (Robô)', 'Pré-Nota', 'Pendentes (GAP)'],
    values: [Math.max(0, robo), Math.max(0, prenota), Math.max(0, gap)],
    type: 'pie',
    textinfo: 'none',
    hovertemplate: '%{label}: %{value}<extra></extra>',
    marker: { colors: ['#FF6B35', '#ED6C02', '#DC2626'], line: { color: '#ffffff', width: 2 } },
    hole: 0.62,
    sort: false, direction: 'clockwise', rotation: 90
  }], {
    margin: { t: 10, l: 10, r: 10, b: 10 },
    showlegend: false,
    annotations: [{
      x: 0.5, y: 0.5,
      text: '<b>' + total + '</b><br><span style="font-size:9px;color:#94A3B8">Total de notas<br>no período</span>',
      showarrow: false, font: { family: 'Inter, sans-serif', size: 14, color: '#1E293B' },
      align: 'center'
    }],
    paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
    hoverlabel: { bgcolor: '#1E293B', font: { family: 'Inter, sans-serif', size: 11, color: '#fff' } }
  }, { displayModeBar: false, responsive: true });
}

/* ── PERFORMANCE POR EMPRESA ── */
function atualizarPerformancePorEmpresa() {
  if (!state.dados) return;
  var container = document.getElementById('performance-empresas');
  if (!container) return;

  var empresasDef = [
    { id: 'maas',          nome: 'MAAS',          sigla: 'M',  cor: '#FF6B35' },
    { id: 'hp',            nome: 'HP',            sigla: 'hp', cor: '#1B1F5E' },
    { id: 'urbi_recanto',  nome: 'URBI Recanto',  sigla: 'UR', cor: '#2E7D32' },
    { id: 'urbi_samambaia',nome: 'URBI Samambaia', sigla: 'US', cor: '#ED6C02' }
  ];

  var html = empresasDef.map(function(emp) {
    var d = state.dados[emp.id];
    if (!d) return '';
    var efic = d.monitor > 0 ? ((d.robo / d.monitor) * 100).toFixed(1) : 0;
    return '<div class="perf-item">' +
      '<div class="perf-company-icon" style="background:' + emp.cor + '">' + emp.sigla + '</div>' +
      '<span class="perf-name">' + emp.nome + '</span>' +
      '<div class="perf-bar-wrap"><div class="perf-bar-fill" style="width:' + Math.min(100, efic) + '%;background:' + emp.cor + '"></div></div>' +
      '<span class="perf-pct">' + efic + '%</span>' +
    '</div>';
  }).join('');

  container.innerHTML = html;
}

/* ── TOP PENDÊNCIAS ── */
function atualizarTopPendencias() {
  if (!state.dados) return;
  var container = document.getElementById('top-pendencias');
  if (!container) return;

  var empresasDef = [
    { id: 'maas',          nome: 'MAAS',           cor: '#FF6B35' },
    { id: 'hp',            nome: 'HP',             cor: '#1B1F5E' },
    { id: 'urbi_recanto',  nome: 'URBI Recanto',   cor: '#2E7D32' },
    { id: 'urbi_samambaia',nome: 'URBI Samambaia',  cor: '#ED6C02' }
  ];

  var items = empresasDef.map(function(emp) {
    var d = state.dados[emp.id];
    if (!d) return null;
    var gap = Math.max(0, d.monitor - d.robo);
    var gapPct = d.monitor > 0 ? ((gap / d.monitor) * 100).toFixed(0) : 0;
    var cls = parseInt(gapPct) >= 50 ? 'critico' : parseInt(gapPct) >= 30 ? 'atencao' : 'normal';
    return { nome: emp.nome, gap: gap, gapPct: parseInt(gapPct), cls: cls };
  }).filter(Boolean).sort(function(a, b) { return b.gap - a.gap; });

  var maxGap = items.length > 0 ? Math.max.apply(Math, items.map(function(i) { return i.gap; })) : 1;

  container.innerHTML = items.map(function(it) {
    var barW = maxGap > 0 ? (it.gap / maxGap * 100).toFixed(1) : 0;
    return '<div class="pend-item">' +
      '<span class="pend-name">' + it.nome + '</span>' +
      '<div class="pend-bar-wrap"><div class="pend-bar-fill ' + it.cls + '" style="width:' + barW + '%"></div></div>' +
      '<span class="pend-count">' + it.gap + '</span>' +
      '<span class="pend-badge ' + it.cls + '">' + it.gapPct + '%</span>' +
    '</div>';
  }).join('') +
  '<div class="pend-legend">' +
    '<span class="pend-leg-item"><span class="pend-leg-dot" style="background:#DC2626"></span>Crítico (≥50%)</span>' +
    '<span class="pend-leg-item"><span class="pend-leg-dot" style="background:#ED6C02"></span>Atenção (≥30%)</span>' +
    '<span class="pend-leg-item"><span class="pend-leg-dot" style="background:#1B1F5E"></span>Normal (&lt;30%)</span>' +
  '</div>';
}

/* ── DESTAQUES POR EMPRESA ── */
function atualizarDestaques() {
  if (!state.dados) return;
  var container = document.getElementById('destaques-cards');
  if (!container) return;

  var empresasDef = [
    { id: 'maas',          nome: 'MAAS',           sigla: 'M',  cor: '#FF6B35', page: 'maas' },
    { id: 'hp',            nome: 'HP',             sigla: 'hp', cor: '#1B1F5E', page: 'hp' },
    { id: 'urbi_recanto',  nome: 'URBI Recanto',   sigla: 'UR', cor: '#2E7D32', page: 'urbi_recanto' },
    { id: 'urbi_samambaia',nome: 'URBI Samambaia',  sigla: 'US', cor: '#ED6C02', page: 'urbi_samambaia' }
  ];

  var allEfic = empresasDef.map(function(emp) {
    var d = state.dados[emp.id];
    return d && d.monitor > 0 ? (d.robo / d.monitor * 100) : 0;
  });
  var maxEfic = Math.max.apply(Math, allEfic);

  container.innerHTML = empresasDef.map(function(emp, idx) {
    var d = state.dados[emp.id];
    if (!d) return '';
    var efic = d.monitor > 0 ? ((d.robo / d.monitor) * 100).toFixed(1) : 0;
    var gap = Math.max(0, d.monitor - d.robo);
    var gapPct = d.monitor > 0 ? ((gap / d.monitor) * 100) : 0;
    var thisEfic = parseFloat(efic);
    var statusCls, statusLabel;
    if (thisEfic >= maxEfic - 2 && maxEfic > 0) { statusCls = 'lider'; statusLabel = 'LÍDER'; }
    else if (gapPct >= 50) { statusCls = 'critico'; statusLabel = 'CRÍTICO'; }
    else { statusCls = 'atencao'; statusLabel = 'ATENÇÃO'; }

    return '<div class="destaque-card" onclick="showPage(\'' + emp.page + '\',null)">' +
      '<div class="destaque-header">' +
        '<div class="destaque-icon" style="background:' + emp.cor + '">' + emp.sigla + '</div>' +
        '<span class="destaque-company-name">' + emp.nome + '</span>' +
        '<span class="destaque-status ' + statusCls + '">' + statusLabel + '</span>' +
      '</div>' +
      '<div class="destaque-eficiencia-label">Eficiência</div>' +
      '<div class="destaque-eficiencia">' + efic + '%</div>' +
      '<div class="destaque-metrics">' +
        '<div class="destaque-metric"><div class="destaque-metric-val">' + d.robo + '</div><div class="destaque-metric-label">Robô</div></div>' +
        '<div class="destaque-metric"><div class="destaque-metric-val">' + gap + '</div><div class="destaque-metric-label">Pendentes</div></div>' +
      '</div>' +
      '<button class="destaque-btn">Ver detalhes →</button>' +
    '</div>';
  }).join('');
}

/* ── ALERTAS INTELIGENTES ── */
function atualizarAlertas() {
  if (!state.dados) return;
  var container = document.getElementById('alertas-lista');
  if (!container) return;

  var empresasDef = [
    { id: 'maas', nome: 'MAAS' },
    { id: 'hp', nome: 'HP' },
    { id: 'urbi_recanto', nome: 'URBI Recanto' },
    { id: 'urbi_samambaia', nome: 'URBI Samambaia' }
  ];

  var alertas = [];
  var totais = getTotaisGeral(state.dados);

  empresasDef.forEach(function(emp) {
    var d = state.dados[emp.id];
    if (!d || d.monitor === 0) return;
    var gap = Math.max(0, d.monitor - d.robo);
    var gapPct = ((gap / d.monitor) * 100).toFixed(0);
    if (parseInt(gapPct) >= 50) {
      alertas.push({
        tipo: 'critico',
        titulo: emp.nome + ' com ' + gap + ' notas pendentes (' + gapPct + '%)',
        sub: 'GAP muito acima do aceitável'
      });
    } else if (parseInt(gapPct) >= 30) {
      alertas.push({
        tipo: 'atencao',
        titulo: emp.nome + ' com ' + gap + ' notas pendentes (' + gapPct + '%)',
        sub: 'Acompanhar evolução das pendências'
      });
    }
  });

  if (totais.totalPrenota > 0 && totais.geral > 0) {
    var pctPrenota = ((totais.totalPrenota / totais.geral) * 100).toFixed(0);
    alertas.push({
      tipo: 'info',
      titulo: 'Pré-Nota representa ' + pctPrenota + '% do total no período',
      sub: 'Acompanhar dependência da Pré-Nota'
    });
  }

  var badge = document.getElementById('alertas-count');
  if (badge) badge.textContent = alertas.length;

  function iconSVG(tipo) {
    if (tipo === 'critico') return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    if (tipo === 'atencao') return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ED6C02" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    return '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
  }

  if (alertas.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;font-size:12px;color:var(--gray-400)">✓ Nenhum alerta no período</div>';
    return;
  }

  container.innerHTML = alertas.map(function(a) {
    return '<div class="alerta-item">' +
      '<div class="alerta-icon-wrap ' + a.tipo + '">' + iconSVG(a.tipo) + '</div>' +
      '<div class="alerta-body">' +
        '<div class="alerta-top"><span class="alerta-badge ' + a.tipo + '">' + a.tipo.toUpperCase() + '</span></div>' +
        '<div class="alerta-title">' + a.titulo + '</div>' +
        '<div class="alerta-sub">' + a.sub + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

/* ── COMPANY DETAIL CARDS ── */
function atualizarCardsGerais() {
  atualizarKPICards();
}

function atualizarCardsEmpresa(emp, containerId, nome) {
  if (!state.dados || !state.dados[emp]) return;
  var d = state.dados[emp];
  var total = d.total;
  var pctMonitor = total > 0 ? (d.monitor / total * 100).toFixed(1) : 0;
  var pctPrenota = total > 0 ? (d.prenota / total * 100).toFixed(1) : 0;
  var pctRoboMonitor = d.monitor > 0 ? ((d.robo / d.monitor) * 100).toFixed(1) : 0;
  var gap = Math.max(0, d.monitor - d.robo);
  var c = getCompany(emp);
  var respText = formatResponsaveis(c);
  document.getElementById(containerId).innerHTML =
    '<div class="card"><div class="card-accent" style="background:#1B1F5E"></div><div class="card-title">Total ' + nome + '</div><div class="card-value">' + total + '</div><div class="card-sub">' + respText + '</div></div>' +
    '<div class="card"><div class="card-accent" style="background:#2E7D32"></div><div class="card-title">Monitor</div><div class="card-value">' + d.monitor + '</div><div class="card-badge" style="background:#E8F5E9;color:#2E7D32">' + pctMonitor + '%</div></div>' +
    '<div class="card"><div class="card-accent" style="background:#ED6C02"></div><div class="card-title">Pré-nota</div><div class="card-value">' + d.prenota + '</div><div class="card-badge" style="background:#FFF3E0;color:#ED6C02">' + pctPrenota + '%</div></div>' +
    '<div class="card"><div class="card-accent" style="background:#FF6B35"></div><div class="card-title">Robô / GAP</div><div class="card-value">' + d.robo + '</div><div class="card-badge" style="background:#FFF0EB;color:#FF6B35">' + pctRoboMonitor + '% efic. | GAP:' + gap + '</div></div>';
}

function atualizarCardsMaas() {
  if (!state.dados || !state.dados['maas']) return;
  var personId = getMaasPersona();
  var d = state.dados['maas'];

  if (personId === 'all') {
    atualizarCardsEmpresa('maas', 'maas-cards', 'MAAS');
    atualizarPersonMetrics(d);
  } else {
    var personData = getDadosMaasPorPessoa(state.dados, personId);
    var p = getCompany('maas');
    var person = p.responsaveis.find(function(r) { return r.id === personId; }) || p.responsaveis[0];
    var pctMonitor = personData.total > 0 ? (personData.monitor / personData.total * 100).toFixed(1) : 0;
    var pctPrenota = personData.total > 0 ? (personData.prenota / personData.total * 100).toFixed(1) : 0;
    var pctRoboMonitor = personData.monitor > 0 ? ((personData.robo / personData.monitor) * 100).toFixed(1) : 0;
    var gap = Math.max(0, personData.monitor - personData.robo);
    document.getElementById('maas-cards').innerHTML =
      '<div class="card"><div class="card-accent" style="background:' + person.cor + '"></div><div class="card-title">Total ' + person.nome + '</div><div class="card-value">' + personData.total + '</div><div class="card-sub">Monitor + Pré-nota</div></div>' +
      '<div class="card"><div class="card-accent" style="background:#2E7D32"></div><div class="card-title">Monitor</div><div class="card-value">' + personData.monitor + '</div><div class="card-badge" style="background:#E8F5E9;color:#2E7D32">' + pctMonitor + '%</div></div>' +
      '<div class="card"><div class="card-accent" style="background:#ED6C02"></div><div class="card-title">Pré-nota</div><div class="card-value">' + personData.prenota + '</div><div class="card-badge" style="background:#FFF3E0;color:#ED6C02">' + pctPrenota + '%</div></div>' +
      '<div class="card"><div class="card-accent" style="background:#FF6B35"></div><div class="card-title">Robô / GAP</div><div class="card-value">' + personData.robo + '</div><div class="card-badge" style="background:#FFF0EB;color:#FF6B35">' + pctRoboMonitor + '% efic. | GAP:' + gap + '</div></div>';
    atualizarPersonMetrics(personData);
  }
}

function atualizarPersonMetrics(d) {
  var eficiencia = d.monitor > 0 ? ((d.robo / d.monitor) * 100).toFixed(1) : 0;
  var pctPrenota = d.total > 0 ? ((d.prenota / d.total) * 100).toFixed(1) : 0;
  document.getElementById('maas-person-metrics').innerHTML =
    '<div class="person-metric"><div class="pm-label">Volume Total</div><div class="pm-value">' + d.total + '</div><div class="pm-sub">notas recebidas</div></div>' +
    '<div class="person-metric"><div class="pm-label">Eficiência do Robô</div><div class="pm-value">' + eficiencia + '%</div><div class="pm-sub">' + d.robo + ' de ' + d.monitor + ' monitor</div></div>' +
    '<div class="person-metric"><div class="pm-label">Pré-nota</div><div class="pm-value">' + pctPrenota + '%</div><div class="pm-sub">' + d.prenota + ' de ' + d.total + ' total</div></div>';
}

function atualizarTabelaConsolidada() {
  if (!state.dados) return;
  var keys  = ['maas', 'hp', 'urbi_recanto', 'urbi_samambaia'];
  var nomes = ['MAAS', 'HP', 'URBI Recanto', 'URBI Samambaia'];
  var totais = getTotaisGeral(state.dados);
  var totalGeral = totais.geral;

  var html = '<thead><tr><th>Empresa</th><th class="num">Total</th><th class="num">Monitor</th><th class="num">Pré-nota</th><th class="num">Robô</th><th class="num">GAP</th><th class="num">Efic.%</th></tr></thead><tbody>';
  keys.forEach(function(k, i) {
    var d = state.dados[k];
    if (!d) return;
    var gap = Math.max(0, d.monitor - d.robo);
    var pctRoboStr = d.monitor > 0 ? ((d.robo / d.monitor) * 100).toFixed(1) + '%' : '—';
    html += '<tr><td>' + nomes[i] + '</td><td class="num">' + d.total + '</td><td class="num">' + d.monitor + '</td><td class="num">' + d.prenota + '</td><td class="num">' + d.robo + '</td><td class="num">' + gap + '</td><td class="num">' + pctRoboStr + '</td></tr>';
  });
  html += '<tr class="table-total"><td>Total</td><td class="num">' + totalGeral + '</td><td class="num">' + totais.totalMonitor + '</td><td class="num">' + totais.totalPrenota + '</td><td class="num">' + totais.totalRobo + '</td><td class="num">' + Math.max(0, totais.totalMonitor - totais.totalRobo) + '</td><td class="num">—</td></tr>';
  html += '</tbody>';
  document.getElementById('tabela-consolidada').innerHTML = '<table>' + html + '</table>';
}

function atualizarRanking() {
  if (!state.dados) return;
  var ranking = getEmpresaRanking(state.dados);
  var html = ranking.map(function(r, idx) {
    var efic = r.monitor > 0 ? ((r.robo / r.monitor) * 100).toFixed(1) : 0;
    return '<div class="rank-item">' +
      '<div class="rank-num">' + (idx + 1) + '</div>' +
      '<div class="rank-info"><div class="rank-name">' + r.nome + '</div><div class="rank-sub">Monitor: ' + r.monitor + ' | Pré-nota: ' + r.prenota + ' | Robô: ' + r.robo + ' | Efic.: ' + efic + '%</div></div>' +
      '<div class="rank-val">' + r.total + '</div>' +
    '</div>';
  }).join('');
  document.getElementById('ranking-list').innerHTML = html;
}

function atualizarProgressoEmpresa(emp, containerId) {
  if (!state.dados || !state.dados[emp]) return;
  var d = state.dados[emp];
  var total = d.total;
  var gap = Math.max(0, d.monitor - d.robo);
  var pctMonitor = total > 0 ? (d.monitor / total * 100).toFixed(1) : 0;
  var pctPrenota = total > 0 ? (d.prenota / total * 100).toFixed(1) : 0;
  var pctRobo = d.monitor > 0 ? (d.robo / d.monitor * 100).toFixed(1) : 0;
  var pctGap  = d.monitor > 0 ? (gap / d.monitor * 100).toFixed(1) : 0;
  document.getElementById(containerId).innerHTML =
    '<h3 style="font-size:11px;font-weight:700;color:var(--gray-600);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:14px">Distribuição (' + total + ' notas)</h3>' +
    '<div class="prog-row"><span class="prog-label">Recebidas pelo Monitor</span><div class="prog-wrap"><div class="prog-fill" style="width:' + pctMonitor + '%;background:#2E7D32"></div></div><span class="prog-val">' + d.monitor + '</span><span class="prog-pct">' + pctMonitor + '%</span></div>' +
    '<div class="prog-row"><span class="prog-label">Recebidas pela Pré-nota</span><div class="prog-wrap"><div class="prog-fill" style="width:' + pctPrenota + '%;background:#ED6C02"></div></div><span class="prog-val">' + d.prenota + '</span><span class="prog-pct">' + pctPrenota + '%</span></div>' +
    '<div class="prog-row"><span class="prog-label">Escrituradas pelo robô</span><div class="prog-wrap"><div class="prog-fill" style="width:' + pctRobo + '%;background:#FF6B35"></div></div><span class="prog-val">' + d.robo + '</span><span class="prog-pct">' + pctRobo + '%</span></div>' +
    '<div class="prog-row"><span class="prog-label">Pendentes (GAP)</span><div class="prog-wrap"><div class="prog-fill" style="width:' + pctGap + '%;background:#DC2626"></div></div><span class="prog-val">' + gap + '</span><span class="prog-pct">' + pctGap + '%</span></div>';
}

function atualizarTabelaEmpresa(emp, containerId, nome) {
  if (!state.dados || !state.dados[emp]) return;
  var d = state.dados[emp];
  var total = d.total;
  var naoEscriturado = Math.max(0, d.monitor - d.robo);
  var pctRobo = total > 0 ? (d.robo / total * 100).toFixed(1) : 0;
  var pctNaoEscriturado = total > 0 ? (naoEscriturado / total * 100).toFixed(1) : 0;
  var pctPrenota = total > 0 ? (d.prenota / total * 100).toFixed(1) : 0;
  var efic = d.monitor > 0 ? ((d.robo / d.monitor) * 100).toFixed(1) : 0;
  document.getElementById(containerId).innerHTML =
    '<h3 style="font-size:11px;font-weight:700;color:var(--gray-600);text-transform:uppercase;letter-spacing:0.07em;margin-bottom:12px">Tabela — ' + nome + '</h3>' +
    '<table><thead><tr><th>Composição</th><th class="num">Qtd</th><th class="num">% Total</th></tr></thead>' +
    '<tbody>' +
      '<tr><td>Escriturado pelo robô</td><td class="num">' + d.robo + '</td><td class="num">' + pctRobo + '%</td></tr>' +
      '<tr><td>Pendentes (GAP)</td><td class="num">' + naoEscriturado + '</td><td class="num">' + pctNaoEscriturado + '%</td></tr>' +
      '<tr><td>Recebidas pela Pré-nota</td><td class="num">' + d.prenota + '</td><td class="num">' + pctPrenota + '%</td></tr>' +
      '<tr><td>Eficiência do Robô</td><td class="num" colspan="2">' + efic + '% do Monitor</td></tr>' +
      '<tr><td><strong>Total</strong></td><td class="num"><strong>' + total + '</strong></td><td class="num">100%</td></tr>' +
    '</tbody></table>';
}
