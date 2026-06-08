function getTotal(empresa) {
  return state.dados?.[empresa]?.total || 0;
}

var CHART_FONT = { family: 'Inter, sans-serif', size: 11, color: '#64748B' };
var CHART_GRID = '#F1F5F9';
var CHART_BG   = 'transparent';

function barLayout(marginTop, maxVal) {
  return {
    margin: { t: marginTop, l: 8, r: 8, b: 36 },
    yaxis: {
      showgrid: true, gridcolor: CHART_GRID, gridwidth: 1,
      zeroline: false, showline: false, showticklabels: true,
      tickfont: { family: 'Inter, sans-serif', size: 10, color: '#94A3B8' },
      range: [0, (maxVal || 1) * 1.18]
    },
    xaxis: {
      showgrid: false, zeroline: false, showline: false,
      tickfont: { family: 'Inter, sans-serif', size: 10, color: '#64748B' }
    },
    showlegend: false,
    font: CHART_FONT,
    plot_bgcolor: CHART_BG,
    paper_bgcolor: CHART_BG,
    hoverlabel: { bgcolor: '#1E293B', font: { family: 'Inter, sans-serif', size: 11, color: '#fff' }, bordercolor: '#1E293B' }
  };
}

/* ── GERAL CHARTS ── */
function atualizarGraficosGerais() {
  if (!state.dados) return;
  atualizarStatusOperacao();
  atualizarPerformancePorEmpresa();
  atualizarTopPendencias();
  atualizarTendenciasSemanais();
  atualizarDestaques();
  atualizarAlertas();
}

/* ── TENDÊNCIAS SEMANAIS ── */
function atualizarTendenciasSemanais() {
  var weeks = getWeeklyTrends(10);
  if (weeks.length === 0) return;

  var labels  = weeks.map(function(w) { return w.label; });
  var monitor = weeks.map(function(w) { return w.monitor; });
  var prenota = weeks.map(function(w) { return w.prenota; });
  var robo    = weeks.map(function(w) { return w.robo; });
  var eficPct = weeks.map(function(w) { return w.monitor > 0 ? parseFloat((w.robo / w.monitor * 100).toFixed(1)) : 0; });
  var prenotaPct = weeks.map(function(w) { return w.total > 0 ? parseFloat((w.prenota / w.total * 100).toFixed(1)) : 0; });

  var lineLayout = {
    margin: { t: 10, l: 32, r: 10, b: 30 },
    xaxis: { tickfont: { family: 'Inter, sans-serif', size: 9, color: '#94A3B8' }, showgrid: false, zeroline: false },
    yaxis: { tickfont: { family: 'Inter, sans-serif', size: 9, color: '#94A3B8' }, showgrid: true, gridcolor: '#F1F5F9', zeroline: false },
    showlegend: true,
    legend: { orientation: 'h', y: 1.18, font: { family: 'Inter, sans-serif', size: 9, color: '#64748B' } },
    font: CHART_FONT,
    plot_bgcolor: CHART_BG,
    paper_bgcolor: CHART_BG,
    hoverlabel: { bgcolor: '#1E293B', font: { family: 'Inter, sans-serif', size: 10, color: '#fff' } }
  };

  Plotly.newPlot('g_tendencias_volume', [
    { x: labels, y: monitor, name: 'Monitor', type: 'scatter', mode: 'lines+markers',
      line: { color: '#2E7D32', width: 2 }, marker: { color: '#2E7D32', size: 4 },
      hovertemplate: '%{y}<extra>Monitor</extra>' },
    { x: labels, y: robo, name: 'Robô', type: 'scatter', mode: 'lines+markers',
      line: { color: '#FF6B35', width: 2 }, marker: { color: '#FF6B35', size: 4 },
      hovertemplate: '%{y}<extra>Robô</extra>' },
    { x: labels, y: prenota, name: 'Pré-Nota', type: 'scatter', mode: 'lines+markers',
      line: { color: '#ED6C02', width: 2 }, marker: { color: '#ED6C02', size: 4 },
      hovertemplate: '%{y}<extra>Pré-Nota</extra>' }
  ], lineLayout, { displayModeBar: false, responsive: true });

  Plotly.newPlot('g_tendencias_pct', [
    { x: labels, y: eficPct, name: 'Efic. Robô %', type: 'scatter', mode: 'lines+markers',
      line: { color: '#2E7D32', width: 2 }, marker: { color: '#2E7D32', size: 4 },
      hovertemplate: '%{y}%<extra>Efic. Robô</extra>' },
    { x: labels, y: prenotaPct, name: '% Pré-Nota', type: 'scatter', mode: 'lines+markers',
      line: { color: '#7C3AED', width: 2, dash: 'dot' }, marker: { color: '#7C3AED', size: 4 },
      hovertemplate: '%{y}%<extra>% Pré-Nota</extra>' }
  ], Object.assign({}, lineLayout, {
    yaxis: Object.assign({}, lineLayout.yaxis, { ticksuffix: '%', range: [0, 110] })
  }), { displayModeBar: false, responsive: true });
}

/* ── COMPANY CHARTS ── */
function atualizarGraficosEmpresa(emp, barId, pieId) {
  if (!state.dados || !state.dados[emp]) return;
  var d = state.dados[emp];
  var gap = Math.max(0, d.monitor - d.robo);
  var maxVal = Math.max(d.monitor, d.prenota, d.robo, gap, 1);

  Plotly.newPlot(barId, [{
    x: ['Monitor', 'Pré-nota', 'Robô', 'GAP'],
    y: [d.monitor, d.prenota, d.robo, gap],
    type: 'bar',
    marker: { color: ['#2E7D32', '#ED6C02', '#FF6B35', '#DC2626'], line: { color: '#ffffff', width: 1 } },
    text: [d.monitor, d.prenota, d.robo, gap],
    textposition: 'outside',
    textfont: { family: 'Inter, sans-serif', size: 11, color: '#334155' },
    hovertemplate: '%{y} notas<extra>%{x}</extra>',
    cliponaxis: false
  }], Object.assign(barLayout(24, maxVal), { bargap: 0.4, plot_bgcolor: 'transparent', paper_bgcolor: 'transparent' }), { displayModeBar: false, responsive: true });

  var labels = [], values = [], colors = [];
  if (d.robo > 0)   { labels.push('Escriturado pelo robô'); values.push(d.robo);   colors.push('#FF6B35'); }
  if (gap > 0)      { labels.push('Pendentes (GAP)');       values.push(gap);       colors.push('#DC2626'); }
  if (d.prenota > 0){ labels.push('Pré-nota');              values.push(d.prenota); colors.push('#ED6C02'); }
  if (labels.length === 0) { labels.push('Sem dados'); values.push(1); colors.push('#D1D5DB'); }

  Plotly.newPlot(pieId, [{
    labels: labels, values: values, type: 'pie',
    textinfo: 'label+percent',
    textfont: { family: 'Inter, sans-serif', size: 10, color: '#334155' },
    marker: { colors: colors, line: { color: '#ffffff', width: 2 } },
    hole: 0.45,
    hovertemplate: '%{label}: %{value} notas (%{percent})<extra></extra>',
    sort: false, direction: 'clockwise', rotation: 90
  }], {
    margin: { t: 8, l: 8, r: 8, b: 50 },
    showlegend: true,
    legend: { orientation: 'h', y: -0.18, font: { family: 'Inter, sans-serif', size: 10, color: '#64748B' } },
    font: CHART_FONT,
    paper_bgcolor: CHART_BG,
    hoverlabel: { bgcolor: '#1E293B', font: { family: 'Inter, sans-serif', size: 11, color: '#fff' } }
  }, { displayModeBar: false, responsive: true });
}

function atualizarGraficosMaas() {
  if (!state.dados || !state.dados['maas']) return;
  var personId = getMaasPersona();

  if (personId === 'all') {
    atualizarGraficosEmpresa('maas', 'maas_bar', 'maas_pie');
  } else {
    var personData = getDadosMaasPorPessoa(state.dados, personId);
    var p = getCompany('maas');
    var person = p.responsaveis.find(function(r) { return r.id === personId; }) || p.responsaveis[0];
    var gap = Math.max(0, personData.monitor - personData.robo);
    var maxVal = Math.max(personData.monitor, personData.prenota, personData.robo, gap, 1);

    Plotly.newPlot('maas_bar', [{
      x: ['Monitor', 'Pré-nota', 'Robô', 'GAP'],
      y: [personData.monitor, personData.prenota, personData.robo, gap],
      type: 'bar',
      marker: { color: [person.cor, '#ED6C02', '#FF6B35', '#DC2626'], line: { color: '#ffffff', width: 1 } },
      text: [personData.monitor, personData.prenota, personData.robo, gap],
      textposition: 'outside',
      textfont: { family: 'Inter, sans-serif', size: 11, color: '#334155' },
      hovertemplate: '%{y} notas<extra>%{x}</extra>',
      cliponaxis: false
    }], Object.assign(barLayout(24, maxVal), { bargap: 0.4, paper_bgcolor: CHART_BG }), { displayModeBar: false, responsive: true });

    var labels = [], values = [], colors = [];
    if (personData.robo > 0)   { labels.push('Escriturado pelo robô'); values.push(personData.robo);   colors.push('#FF6B35'); }
    if (gap > 0)               { labels.push('Pendentes (GAP)');       values.push(gap);               colors.push('#DC2626'); }
    if (personData.prenota > 0){ labels.push('Pré-nota');              values.push(personData.prenota); colors.push('#ED6C02'); }
    if (labels.length === 0)   { labels.push('Sem dados'); values.push(1); colors.push('#D1D5DB'); }

    Plotly.newPlot('maas_pie', [{
      labels: labels, values: values, type: 'pie',
      textinfo: 'label+percent',
      textfont: { family: 'Inter, sans-serif', size: 10, color: '#334155' },
      marker: { colors: colors, line: { color: '#ffffff', width: 2 } },
      hole: 0.45,
      hovertemplate: '%{label}: %{value} notas (%{percent})<extra></extra>',
      sort: false, direction: 'clockwise', rotation: 90
    }], {
      margin: { t: 8, l: 8, r: 8, b: 50 },
      showlegend: true,
      legend: { orientation: 'h', y: -0.18, font: { family: 'Inter, sans-serif', size: 10, color: '#64748B' } },
      font: CHART_FONT, paper_bgcolor: CHART_BG,
      hoverlabel: { bgcolor: '#1E293B', font: { family: 'Inter, sans-serif', size: 11, color: '#fff' } }
    }, { displayModeBar: false, responsive: true });
  }

  atualizarGraficosMaasComparativo();
}

function atualizarGraficosMaasComparativo() {
  if (!state.dados || !state.dados['maas']) return;
  var p = getCompany('maas');
  var person1 = getDadosMaasPorPessoa(state.dados, 'responsavel1');
  var person2 = getDadosMaasPorPessoa(state.dados, 'responsavel2');
  var maxVal = Math.max(person1.monitor, person1.prenota, person1.robo, person2.monitor, person2.prenota, person2.robo, 1);

  Plotly.newPlot('maas_person_bar', [
    { x: ['Monitor', 'Pré-nota', 'Robô'], y: [person1.monitor, person1.prenota, person1.robo],
      name: p.responsaveis[0].nome, type: 'bar',
      marker: { color: p.responsaveis[0].cor, line: { color: '#ffffff', width: 1 } },
      hovertemplate: '%{y}<extra>' + p.responsaveis[0].nome + '</extra>' },
    { x: ['Monitor', 'Pré-nota', 'Robô'], y: [person2.monitor, person2.prenota, person2.robo],
      name: p.responsaveis[1].nome, type: 'bar',
      marker: { color: p.responsaveis[1].cor, line: { color: '#ffffff', width: 1 } },
      hovertemplate: '%{y}<extra>' + p.responsaveis[1].nome + '</extra>' }
  ], Object.assign(barLayout(14, maxVal), {
    barmode: 'group', showlegend: true,
    legend: { orientation: 'h', y: 1.12, font: { family: 'Inter, sans-serif', size: 10, color: '#64748B' } },
    bargroupgap: 0.25, paper_bgcolor: CHART_BG
  }), { displayModeBar: false, responsive: true });

  Plotly.newPlot('maas_person_pie', [{
    labels: [p.responsaveis[0].nome, p.responsaveis[1].nome],
    values: [person1.total, person2.total],
    type: 'pie', textinfo: 'label+percent',
    textfont: { family: 'Inter, sans-serif', size: 10, color: '#334155' },
    marker: { colors: [p.responsaveis[0].cor, p.responsaveis[1].cor], line: { color: '#ffffff', width: 2 } },
    hole: 0.45,
    hovertemplate: '%{label}: %{value} notas (%{percent})<extra></extra>',
    sort: false, direction: 'clockwise', rotation: 90
  }], {
    margin: { t: 8, l: 8, r: 8, b: 50 },
    showlegend: true,
    legend: { orientation: 'h', y: -0.18, font: { family: 'Inter, sans-serif', size: 10, color: '#64748B' } },
    font: CHART_FONT, paper_bgcolor: CHART_BG,
    hoverlabel: { bgcolor: '#1E293B', font: { family: 'Inter, sans-serif', size: 11, color: '#fff' } }
  }, { displayModeBar: false, responsive: true });
}
