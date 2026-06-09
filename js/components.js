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
  var monitor    = totais.totalMonitor;
  var robo       = totais.totalRobo;
  var prenota    = totais.totalPrenota;
  var totalNotas = monitor + prenota;   // Total de Notas = Monitor + Pré-nota
  var gap        = Math.max(0, monitor - robo);
  var efic       = monitor > 0 ? ((robo / monitor) * 100).toFixed(1) : 0;

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

  var monitorSeries    = dias.map(function(d) { return d.monitor; });
  var roboSeries       = dias.map(function(d) { return d.robo; });
  var prenotaSeries    = dias.map(function(d) { return d.prenota; });
  var totalNotasSeries = dias.map(function(d) { return d.monitor + d.prenota; });

  var tMonitor    = prevTotais ? calcTrend(monitor, prevTotais.totalMonitor) : null;
  var tRobo       = prevTotais ? calcTrend(robo, prevTotais.totalRobo) : null;
  var tPrenota    = prevTotais ? calcTrend(prenota, prevTotais.totalPrenota) : null;
  var prevTotalNotas = prevTotais ? (prevTotais.totalMonitor + prevTotais.totalPrenota) : 0;
  var tTotalNotas = prevTotais ? calcTrend(totalNotas, prevTotalNotas) : null;
  var prevEfic    = prevTotais && prevTotais.totalMonitor > 0 ? ((prevTotais.totalRobo / prevTotais.totalMonitor) * 100) : 0;
  var tEfic       = prevEfic > 0 ? { diff: parseFloat(efic) - prevEfic, pct: (parseFloat(efic) - prevEfic).toFixed(1), positive: parseFloat(efic) >= prevEfic } : null;

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
  // Total de Notas = Monitor + Pré-nota
  setCard('kpi-gap', totalNotas, totalNotasSeries, 'white', tTotalNotas, false);

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
      { label: 'Robô (Escrituradas)', val: robo, color: '#FF6B35' },
      { label: 'GAP (Pendentes)', val: gap, color: '#DC2626' },
      { label: 'Pré-Nota', val: prenota, color: '#ED6C02' }
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

  var donutLabels = [], donutValues = [], donutColors = [];
  if (robo > 0)    { donutLabels.push('Robô (Escrituradas)'); donutValues.push(robo);   donutColors.push('#FF6B35'); }
  if (gap > 0)     { donutLabels.push('GAP (Pendentes)');     donutValues.push(gap);    donutColors.push('#DC2626'); }
  if (prenota > 0) { donutLabels.push('Pré-Nota');            donutValues.push(prenota); donutColors.push('#ED6C02'); }
  if (donutLabels.length === 0) { donutLabels.push('Sem dados'); donutValues.push(1); donutColors.push('#D1D5DB'); }

  Plotly.newPlot('g_status_donut', [{
    labels: donutLabels,
    values: donutValues,
    type: 'pie',
    textinfo: 'none',
    hovertemplate: '%{label}: %{value}<extra></extra>',
    marker: { colors: donutColors, line: { color: '#ffffff', width: 2 } },
    hole: 0.65,
    sort: false, direction: 'clockwise', rotation: 90
  }], {
    margin: { t: 5, l: 5, r: 5, b: 5 },
    showlegend: false,
    annotations: [{
      x: 0.5, y: 0.5,
      text: '<span style="font-size:18px;font-weight:700;color:#1E293B">' + total + '</span><br><span style="font-size:10px;color:#94A3B8">Total de notas</span>',
      showarrow: false,
      font: { family: 'Inter, sans-serif', size: 14, color: '#1E293B' },
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
    { id: 'hp',            nome: 'HP',            sigla: 'HP', cor: '#1B1F5E' },
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

  var chartEl = document.getElementById('top-pendencias-chart');
  if (!chartEl || items.length === 0) return;
  var nomes = items.map(function(i) { return i.nome; });
  var gaps = items.map(function(i) { return i.gap; });
  var pcts = items.map(function(i) { return i.gapPct; });
  var empresaCores = { 'MAAS':'#FF6B35', 'HP':'#1B1F5E', 'URBI Recanto':'#2E7D32', 'URBI Samambaia':'#ED6C02' };
  var cores = items.map(function(i) { return empresaCores[i.nome] || '#64748B'; });
  Plotly.newPlot(chartEl, [{
    x: gaps, y: nomes, type: 'bar', orientation: 'h',
    marker: { color: cores, line: { color: '#ffffff', width: 1 } },
    text: gaps, textposition: 'outside',
    textfont: { family: 'Inter, sans-serif', size: 10, color: '#334155' },
    hovertemplate: '%{y}: %{x} pendências (%{customdata}%)<extra></extra>',
    customdata: pcts,
    cliponaxis: false
  }], {
    margin: { t: 10, l: 90, r: 36, b: 4 },
    xaxis: { showgrid: true, gridcolor: '#F1F5F9', zeroline: false, showticklabels: false },
    yaxis: { tickfont: { family: 'Inter, sans-serif', size: 10, color: '#334155' }, showgrid: false, zeroline: false },
    font: { family: 'Inter, sans-serif', size: 10, color: '#64748B' },
    plot_bgcolor: 'transparent', paper_bgcolor: 'transparent',
    hoverlabel: { bgcolor: '#1E293B', font: { family: 'Inter, sans-serif', size: 11, color: '#fff' } }
  }, { displayModeBar: false, responsive: true });
}

/* ── DESTAQUES POR EMPRESA ── */
function atualizarDestaques() {
  if (!state.dados) return;
  var container = document.getElementById('destaques-cards');
  if (!container) return;

  var empresasDef = [
    { id: 'maas',          nome: 'MAAS',           sigla: 'M',  cor: '#FF6B35', page: 'maas' },
    { id: 'hp',            nome: 'HP',             sigla: 'HP', cor: '#1B1F5E', page: 'hp' },
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
      '<div class="destaque-metric"><div class="destaque-metric-val">' + gap + '</div><div class="destaque-metric-label">GAP</div></div>' +
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

  var html;
  if (alertas.length === 0) {
    html = '<div style="text-align:center;padding:20px;font-size:12px;color:var(--gray-400)">✓ Nenhum alerta no período</div>';
  } else {
    html = alertas.map(function(a) {
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
  container.innerHTML = html;
  var pageContainer = document.getElementById('alertas-lista-page');
  if (pageContainer) pageContainer.innerHTML = html;
}

/* ── COMPANY DETAIL CARDS ── */
function atualizarCardsGerais() {
  atualizarKPICards();
}

/**
 * Gera o HTML padronizado de um card de empresa com a estética premium da Visão Geral.
 */
function buildKpiCardHtml(gradient, title, value, iconSvg, trendText) {
  var trendHtml = trendText 
    ? '<div class="kpi-trend"><span class="trend-neutral">' + trendText + '</span></div>'
    : '<div class="kpi-trend"></div>';
    
  return '<div class="kpi-card" style="background:' + gradient + '">' +
    '<div class="kpi-header">' +
      '<span class="kpi-label">' + title + '</span>' +
      '<div class="kpi-icon-wrap">' + iconSvg + '</div>' +
    '</div>' +
    '<div class="kpi-value-num">' + value + '</div>' +
    '<div class="kpi-sparkline-wrap"></div>' +
    trendHtml +
  '</div>';
}

function getCompanyCardIcons() {
  return {
    total: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>',
    monitor: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    prenota: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    robo: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>',
    gap: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };
}

function atualizarCardsEmpresa(emp, containerId, nome) {
  if (!state.dados || !state.dados[emp]) return;
  var d   = state.dados[emp];
  var totalNotas   = d.monitor + d.prenota;
  var pctMonitor   = totalNotas > 0 ? (d.monitor  / totalNotas * 100).toFixed(1) : '0.0';
  var pctPrenota   = totalNotas > 0 ? (d.prenota  / totalNotas * 100).toFixed(1) : '0.0';
  var pctRoboMon   = d.monitor  > 0 ? (d.robo     / d.monitor  * 100).toFixed(1) : '0.0';
  var gap          = Math.max(0, d.monitor - d.robo);
  var c            = getCompany(emp);
  var respText     = formatResponsaveis(c);
  var icons        = getCompanyCardIcons();

  document.getElementById(containerId).innerHTML =
    buildKpiCardHtml('linear-gradient(135deg,#1565C0,#1976D2)', 'Total de Notas', totalNotas, icons.total, respText || 'Monitor + Pré-nota') +
    buildKpiCardHtml('linear-gradient(135deg,#047857,#059669)', 'Monitor', d.monitor, icons.monitor, pctMonitor + '% do total') +
    buildKpiCardHtml('linear-gradient(135deg,#5B21B6,#7C3AED)', 'Pré-nota', d.prenota, icons.prenota, pctPrenota + '% do total') +
    buildKpiCardHtml('linear-gradient(135deg,#B45309,#D97706)', 'Robô', d.robo, icons.robo, pctRoboMon + '% de eficiência') +
    buildKpiCardHtml('linear-gradient(135deg,#991B1B,#DC2626)', 'GAP (Pendentes)', gap, icons.gap, 'Monitor - Robô');
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
    var p          = getCompany('maas');
    var person     = p.responsaveis.find(function(r) { return r.id === personId; }) || p.responsaveis[0];
    var totalNotas = personData.monitor + personData.prenota;
    var pctMonitor = totalNotas > 0 ? (personData.monitor / totalNotas * 100).toFixed(1) : '0.0';
    var pctPrenota = totalNotas > 0 ? (personData.prenota / totalNotas * 100).toFixed(1) : '0.0';
    var pctRoboMon = personData.monitor > 0 ? (personData.robo / personData.monitor * 100).toFixed(1) : '0.0';
    var gap        = Math.max(0, personData.monitor - personData.robo);
    var icons      = getCompanyCardIcons();
    var personGrad = 'linear-gradient(135deg,' + person.cor + ',' + person.cor + ')';

    document.getElementById('maas-cards').innerHTML =
      buildKpiCardHtml(personGrad, 'Total de Notas', totalNotas, icons.total, person.nome.split(' ')[0]) +
      buildKpiCardHtml('linear-gradient(135deg,#047857,#059669)', 'Monitor', personData.monitor, icons.monitor, pctMonitor + '% do total') +
      buildKpiCardHtml('linear-gradient(135deg,#5B21B6,#7C3AED)', 'Pré-nota', personData.prenota, icons.prenota, pctPrenota + '% do total') +
      buildKpiCardHtml('linear-gradient(135deg,#B45309,#D97706)', 'Robô', personData.robo, icons.robo, pctRoboMon + '% de eficiência') +
      buildKpiCardHtml('linear-gradient(135deg,#991B1B,#DC2626)', 'GAP (Pendentes)', gap, icons.gap, 'Monitor - Robô');
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
  var d          = state.dados[emp];
  var totalNotas = d.monitor + d.prenota;  // Total de Notas
  var gap        = Math.max(0, d.monitor - d.robo);
  var pctMonitor = totalNotas > 0 ? (d.monitor / totalNotas * 100).toFixed(1) : 0;
  var pctPrenota = totalNotas > 0 ? (d.prenota / totalNotas * 100).toFixed(1) : 0;
  var pctRobo    = d.monitor  > 0 ? (d.robo    / d.monitor  * 100).toFixed(1) : 0;
  var pctGap     = d.monitor  > 0 ? (gap       / d.monitor  * 100).toFixed(1) : 0;
  document.getElementById(containerId).innerHTML =
    '<div class="prog-header">Distribuição (' + totalNotas + ' notas)</div>' +
    '<div class="prog-row"><span class="prog-label">Recebidas pelo Monitor</span><div class="prog-wrap"><div class="prog-fill" style="width:' + pctMonitor + '%;background:#2E7D32"></div></div><span class="prog-val">' + d.monitor + '</span><span class="prog-pct">' + pctMonitor + '%</span></div>' +
    '<div class="prog-row"><span class="prog-label">Recebidas pela Pré-nota</span><div class="prog-wrap"><div class="prog-fill" style="width:' + pctPrenota + '%;background:#ED6C02"></div></div><span class="prog-val">' + d.prenota + '</span><span class="prog-pct">' + pctPrenota + '%</span></div>' +
    '<div class="prog-row"><span class="prog-label">Escrituradas pelo robô</span><div class="prog-wrap"><div class="prog-fill" style="width:' + pctRobo + '%;background:#FF6B35"></div></div><span class="prog-val">' + d.robo + '</span><span class="prog-pct">' + pctRobo + '%</span></div>' +
    '<div class="prog-row"><span class="prog-label">GAP (não escrituradas)</span><div class="prog-wrap"><div class="prog-fill" style="width:' + pctGap + '%;background:#DC2626"></div></div><span class="prog-val">' + gap + '</span><span class="prog-pct">' + pctGap + '%</span></div>';
}

function atualizarTabelaEmpresa(emp, containerId, nome) {
  if (!state.dados || !state.dados[emp]) return;
  var d          = state.dados[emp];
  var totalNotas = d.monitor + d.prenota;  // Total de Notas
  var gap        = Math.max(0, d.monitor - d.robo);
  var pctRobo    = totalNotas > 0 ? (d.robo    / totalNotas * 100).toFixed(1) : 0;
  var pctGap     = totalNotas > 0 ? (gap       / totalNotas * 100).toFixed(1) : 0;
  var pctPrenota = totalNotas > 0 ? (d.prenota / totalNotas * 100).toFixed(1) : 0;
  var efic       = d.monitor  > 0 ? (d.robo    / d.monitor  * 100).toFixed(1) : 0;
  document.getElementById(containerId).innerHTML =
    '<div class="prog-header">Tabela — ' + nome + '</div>' +
    '<table><thead><tr><th>Composição</th><th class="num">Qtd</th><th class="num">% Total de Notas</th></tr></thead>' +
    '<tbody>' +
      '<tr><td>Escriturado pelo robô</td><td class="num">' + d.robo + '</td><td class="num">' + pctRobo + '%</td></tr>' +
      '<tr><td>GAP (não escrituradas)</td><td class="num">' + gap + '</td><td class="num">' + pctGap + '%</td></tr>' +
      '<tr><td>Recebidas pela Pré-nota</td><td class="num">' + d.prenota + '</td><td class="num">' + pctPrenota + '%</td></tr>' +
      '<tr><td>Eficiência do Robô</td><td class="num" colspan="2">' + efic + '% do Monitor</td></tr>' +
      '<tr><td><strong>Total de Notas</strong></td><td class="num"><strong>' + totalNotas + '</strong></td><td class="num">100%</td></tr>' +
    '</tbody></table>';
}

/* ── EMPRESA EXTRA SECTIONS ── */
function renderEmpresaTrendChart(containerId, days, empCor) {
  if (!days || days.length < 2) return;
  var labels  = days.map(function(d) { return d.dateStr; });
  var monitor = days.map(function(d) { return d.monitor; });
  var prenota = days.map(function(d) { return d.prenota; });
  var robo    = days.map(function(d) { return d.robo; });
  var gap     = days.map(function(d) { return d.gap; });
  var el = document.getElementById(containerId);
  if (!el) return;

  var lo = {
    margin: { t: 10, l: 36, r: 8, b: 40 },
    xaxis: { tickfont: { family: 'Inter, sans-serif', size: 9, color: '#94A3B8' }, showgrid: false, zeroline: false, tickangle: -45 },
    yaxis: { tickfont: { family: 'Inter, sans-serif', size: 9, color: '#94A3B8' }, showgrid: true, gridcolor: '#F1F5F9', zeroline: false },
    showlegend: true,
    legend: { orientation: 'h', y: -0.3, x: 0.5, xanchor: 'center', font: { family: 'Inter, sans-serif', size: 9, color: '#64748B' } },
    font: CHART_FONT, plot_bgcolor: CHART_BG, paper_bgcolor: CHART_BG,
    hoverlabel: { bgcolor: '#1E293B', font: { family: 'Inter, sans-serif', size: 10, color: '#fff' } }
  };

  Plotly.newPlot(el, [
    { x: labels, y: monitor, name: 'Monitor', type: 'scatter', mode: 'lines+markers',
      line: { color: '#2E7D32', width: 2 }, marker: { color: '#2E7D32', size: 4 },
      hovertemplate: '%{y}<extra>Monitor</extra>' },
    { x: labels, y: robo, name: 'Robô', type: 'scatter', mode: 'lines+markers',
      line: { color: '#FF6B35', width: 2 }, marker: { color: '#FF6B35', size: 4 },
      hovertemplate: '%{y}<extra>Robô</extra>' },
    { x: labels, y: gap, name: 'GAP', type: 'scatter', mode: 'lines+markers',
      line: { color: '#DC2626', width: 2, dash: 'dot' }, marker: { color: '#DC2626', size: 4 },
      hovertemplate: '%{y}<extra>GAP</extra>' }
  ], lo, { displayModeBar: false, responsive: true });

  var volId = containerId.replace('trend_vol','trend_pct');
  var pctEl = document.getElementById(volId);
  if (!pctEl) return;
  var eficPct = days.map(function(d) { return d.monitor > 0 ? parseFloat((d.robo / d.monitor * 100).toFixed(1)) : 0; });
  var prenotaPct = days.map(function(d) { return (d.monitor + d.prenota) > 0 ? parseFloat((d.prenota / (d.monitor + d.prenota) * 100).toFixed(1)) : 0; });
  Plotly.newPlot(pctEl, [
    { x: labels, y: eficPct, name: '% Robô', type: 'scatter', mode: 'lines+markers',
      line: { color: empCor, width: 2 }, marker: { color: empCor, size: 4 },
      hovertemplate: '%{y}%<extra>Efic. Robô</extra>' },
    { x: labels, y: prenotaPct, name: '% Pré-Nota', type: 'scatter', mode: 'lines+markers',
      line: { color: '#7C3AED', width: 2, dash: 'dot' }, marker: { color: '#7C3AED', size: 4 },
      hovertemplate: '%{y}%<extra>% Pré-Nota</extra>' }
  ], Object.assign({}, lo, {
    yaxis: { tickfont: { family: 'Inter, sans-serif', size: 9, color: '#94A3B8' }, showgrid: true, gridcolor: '#F1F5F9', zeroline: false, ticksuffix: '%', range: [0, 110] }
  }), { displayModeBar: false, responsive: true });
}

function getEmpresaDados(empresaId, personId) {
  if (personId && personId !== 'all' && empresaId === 'maas') {
    return getDadosMaasPorPessoa(state.dados, personId);
  }
  return state.dados && state.dados[empresaId] ? state.dados[empresaId] : { monitor: 0, prenota: 0, robo: 0, total: 0 };
}

function renderTopGapEmpresa(containerId, empresaId, personId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  if (!periodRange.start || !periodRange.end) { el.innerHTML = ''; return; }
  var s = pad(periodRange.start.day) + '/' + pad(periodRange.start.month);
  var e = pad(periodRange.end.day) + '/' + pad(periodRange.end.month);
  var days = getRangeDiarioEmpresa(empresaId, s, e);
  if (!days || days.length === 0) { el.innerHTML = '<div style="text-align:center;padding:12px;font-size:11px;color:var(--gray-400)">Nenhum dado no período</div>'; return; }
  days.sort(function(a, b) { return b.gap - a.gap; });
  var top5 = days.slice(0, 5).filter(function(d) { return d.gap > 0; });
  if (top5.length === 0) { el.innerHTML = '<div style="text-align:center;padding:12px;font-size:11px;color:var(--gray-400)">✓ Nenhum GAP no período</div>'; return; }

  var html = '<table><thead><tr><th>Data</th><th class="num">Monitor</th><th class="num">Pré-Nota</th><th class="num">Robô</th><th class="num">GAP</th></tr></thead><tbody>';
  top5.forEach(function(d) {
    var pct = d.monitor > 0 ? (d.gap / d.monitor * 100).toFixed(0) : 0;
    html += '<tr><td>' + d.dateStr + '</td><td class="num">' + d.monitor + '</td><td class="num">' + d.prenota + '</td><td class="num">' + d.robo + '</td><td class="num"><strong style="color:#DC2626">' + d.gap + '</strong> <span style="color:var(--gray-400);font-size:10px">(' + pct + '%)</span></td></tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function renderAlertasEmpresa(containerId, empresaId, empresaNome, personId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  var d = getEmpresaDados(empresaId, personId && empresaId === 'maas' ? personId : null);
  if (!d || d.monitor === 0) { el.innerHTML = '<div style="text-align:center;padding:12px;font-size:11px;color:var(--gray-400)">✓ Sem alertas</div>'; return; }

  var gap = Math.max(0, d.monitor - d.robo);
  var gapPct = d.monitor > 0 ? ((gap / d.monitor) * 100).toFixed(0) : 0;
  var pctPrenota = (d.monitor + d.prenota) > 0 ? (d.prenota / (d.monitor + d.prenota) * 100).toFixed(0) : 0;
  var efic = d.monitor > 0 ? (d.robo / d.monitor * 100).toFixed(1) : 0;

  var alertas = [];
  if (parseInt(gapPct) >= 50) alertas.push({ tipo:'critico', titulo: gap + ' notas pendentes (' + gapPct + '%)', sub: 'GAP crítico — acima de 50% do Monitor' });
  else if (parseInt(gapPct) >= 30) alertas.push({ tipo:'atencao', titulo: gap + ' notas pendentes (' + gapPct + '%)', sub: 'GAP em atenção — entre 30% e 50%' });
  else alertas.push({ tipo:'info', titulo: 'GAP de ' + gap + ' notas (' + gapPct + '%)', sub: 'GAP controlado — abaixo de 30%' });

  if (parseFloat(efic) < 50) alertas.push({ tipo:'critico', titulo: 'Eficiência do robô em ' + efic + '%', sub: 'Abaixo de 50% — revisar processo' });
  else if (parseFloat(efic) < 70) alertas.push({ tipo:'atencao', titulo: 'Eficiência do robô em ' + efic + '%', sub: 'Entre 50% e 70% — monitorar' });
  else alertas.push({ tipo:'info', titulo: 'Eficiência do robô em ' + efic + '%', sub: 'Acima de 70% — dentro do esperado' });

  if (parseInt(pctPrenota) >= 50) alertas.push({ tipo:'info', titulo: 'Pré-Nota representa ' + pctPrenota + '% do total', sub: 'Dependência alta de Pré-Nota' });

  el.innerHTML = alertas.map(function(a) {
    var cor = a.tipo === 'critico' ? '#DC2626' : a.tipo === 'atencao' ? '#ED6C02' : '#2563EB';
    var icon = a.tipo === 'critico'
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
      : a.tipo === 'atencao'
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ED6C02" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
      : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    return '<div class="alerta-item" style="padding:7px 0"><div class="alerta-icon-wrap ' + a.tipo + '">' + icon + '</div><div class="alerta-body"><div class="alerta-title" style="font-size:11px">' + a.titulo + '</div><div class="alerta-sub" style="font-size:10px">' + a.sub + '</div></div></div>';
  }).join('');
}

function renderTrendCards(containerId, empresaId, empCor, personId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  var d = getEmpresaDados(empresaId, personId && empresaId === 'maas' ? personId : null);
  if (!d) return;
  var gap = Math.max(0, d.monitor - d.robo);
  var efic = d.monitor > 0 ? (d.robo / d.monitor * 100).toFixed(1) : 0;

  var prevDados = null;
  if (periodRange.start && periodRange.end) {
    var s = pad(periodRange.start.day) + '/' + pad(periodRange.start.month);
    var e = pad(periodRange.end.day) + '/' + pad(periodRange.end.month);
    prevDados = getPrevPeriodTotals(s, e);
  }
  var prev = prevDados && prevDados[empresaId] ? prevDados[empresaId] : null;
  function trendHTML(val, prevVal, invert) {
    if (!prevVal || prevVal === 0) return '<span style="font-size:10px;color:var(--gray-400)">—</span>';
    var pct = ((val - prevVal) / prevVal * 100).toFixed(1);
    var cls = pct >= 0 ? 'trend-up' : 'trend-down';
    var arrow = pct >= 0 ? '▲' : '▼';
    return '<span class="' + cls + '" style="font-size:10px">' + arrow + ' ' + Math.abs(pct) + '%</span>';
  }

  el.innerHTML =
    '<div class="tc-row">' +
      '<div class="tc-item"><div class="tc-label">Monitor</div><div class="tc-val">' + d.monitor + '</div><div class="tc-trend">' + trendHTML(d.monitor, prev ? prev.monitor : null) + '</div></div>' +
      '<div class="tc-item"><div class="tc-label">Robô</div><div class="tc-val">' + d.robo + '</div><div class="tc-trend">' + trendHTML(d.robo, prev ? prev.robo : null) + '</div></div>' +
      '<div class="tc-item"><div class="tc-label">GAP</div><div class="tc-val" style="color:#DC2626">' + gap + '</div><div class="tc-trend">' + trendHTML(gap, prev ? Math.max(0, prev.monitor - prev.robo) : null, true) + '</div></div>' +
      '<div class="tc-item"><div class="tc-label">Eficiência</div><div class="tc-val" style="color:' + empCor + '">' + efic + '%</div><div class="tc-trend">—</div></div>' +
    '</div>';
}

function renderTrendDetailTable(containerId, days) {
  var el = document.getElementById(containerId);
  if (!el || !days || days.length === 0) return;
  var html = '<table><thead><tr><th>Data</th><th class="num">Total</th><th class="num">Monitor</th><th class="num">Pré-Nota</th><th class="num">Robô</th><th class="num">GAP</th><th class="num">Efic.</th></tr></thead><tbody>';
  days.forEach(function(d) {
    var wEfic = d.monitor > 0 ? (d.robo / d.monitor * 100).toFixed(1) : 0;
    html += '<tr><td>' + d.dateStr + '</td><td class="num">' + (d.monitor + d.prenota) + '</td><td class="num">' + d.monitor + '</td><td class="num">' + d.prenota + '</td><td class="num">' + d.robo + '</td><td class="num">' + d.gap + '</td><td class="num">' + wEfic + '%</td></tr>';
  });
  html += '</tbody></table>';
  el.innerHTML = html;
}

function renderBarDetailTable(containerId, empresaId, personId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  var d = getEmpresaDados(empresaId, personId);
  if (!d) return;
  var gap = Math.max(0, d.monitor - d.robo);
  var total = d.monitor + d.prenota;
  var html = '<table><thead><tr><th>Indicador</th><th class="num">Valor</th></tr></thead><tbody>' +
    '<tr><td>Monitor</td><td class="num">' + d.monitor + '</td></tr>' +
    '<tr><td>Pré-Nota</td><td class="num">' + d.prenota + '</td></tr>' +
    '<tr><td>Robô</td><td class="num">' + d.robo + '</td></tr>' +
    '<tr><td>GAP</td><td class="num">' + gap + '</td></tr>' +
    '<tr><td><strong>Total de Notas</strong></td><td class="num"><strong>' + total + '</strong></td></tr>' +
  '</tbody></table>';
  el.innerHTML = html;
}

function renderPieDetailTable(containerId, empresaId, personId) {
  var el = document.getElementById(containerId);
  if (!el) return;
  var d = getEmpresaDados(empresaId, personId);
  if (!d) return;
  var total = d.monitor + d.prenota;
  var gap = Math.max(0, d.monitor - d.robo);
  var pctRobo = total > 0 ? (d.robo / total * 100).toFixed(1) : 0;
  var pctGap = total > 0 ? (gap / total * 100).toFixed(1) : 0;
  var pctPrenota = total > 0 ? (d.prenota / total * 100).toFixed(1) : 0;
  var pctMonitor = total > 0 ? (d.monitor / total * 100).toFixed(1) : 0;
  var html = '<table><thead><tr><th>Composição</th><th class="num">Qtd</th><th class="num">%</th></tr></thead><tbody>' +
    '<tr><td>Escriturado pelo Robô</td><td class="num">' + d.robo + '</td><td class="num">' + pctRobo + '%</td></tr>' +
    '<tr><td>GAP</td><td class="num">' + gap + '</td><td class="num">' + pctGap + '%</td></tr>' +
    '<tr><td>Pré-Nota</td><td class="num">' + d.prenota + '</td><td class="num">' + pctPrenota + '%</td></tr>' +
    '<tr><td>Monitor</td><td class="num">' + d.monitor + '</td><td class="num">' + pctMonitor + '%</td></tr>' +
    '<tr><td><strong>Total</strong></td><td class="num"><strong>' + total + '</strong></td><td class="num">100%</td></tr>' +
  '</tbody></table>';
  el.innerHTML = html;
}

function atualizarEmpresaExtra(empresaId, empresaNome, empCor) {
  var personId = empresaId === 'maas' ? getMaasPersona() : null;
  if (!periodRange.start || !periodRange.end) return;
  var s = pad(periodRange.start.day) + '/' + pad(periodRange.start.month);
  var e = pad(periodRange.end.day) + '/' + pad(periodRange.end.month);
  var days = getRangeDiarioEmpresa(empresaId, s, e);
  if (days && days.length >= 2) {
    renderEmpresaTrendChart(empresaId + '_trend_vol', days, empCor);
    renderTrendDetailTable(empresaId + '-trend-detail', days);
  }
  renderBarDetailTable(empresaId + '-bar-detail', empresaId, personId);
  renderPieDetailTable(empresaId + '-pie-detail', empresaId, personId);
  renderTopGapEmpresa(empresaId + '-topgap', empresaId, personId);
  renderAlertasEmpresa(empresaId + '-alertas', empresaId, empresaNome, personId);
  renderTrendCards(empresaId + '-trends', empresaId, empCor, personId);
}

function atualizarEmpresaExtraMaas() {
  atualizarEmpresaExtra('maas', 'MAAS', '#FF6B35');
}
