function getTotal(empresa) {
  return state.dados?.[empresa]?.total || 0;
}

var CHART_FONT = { family: 'Inter, sans-serif', size: 11, color: '#64748B' };
var CHART_GRID = '#F1F5F9';
var CHART_BG = '#fff';

function barLayout(marginTop, maxVal) {
  return {
    margin: { t: marginTop, l: 8, r: 8, b: 36 },
    yaxis: {
      showgrid: true, gridcolor: CHART_GRID, gridwidth: 1,
      zeroline: false, showline: false, showticklabels: true,
      tickfont: { family: 'Inter, sans-serif', size: 10, color: '#94A3B8' },
      range: [0, maxVal * 1.18 || 10]
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

function atualizarGraficosGerais() {
  if (!state.dados) return;
  var empresas = ['MAAS', 'HP', 'URBI Recanto', 'URBI Samambaia'];
  var empresaKeys = ['maas', 'hp', 'urbi_recanto', 'urbi_samambaia'];
  var totais = empresaKeys.map(getTotal);
  var monitor = empresaKeys.map(function(k) { return state.dados[k].monitor; });
  var prenota = empresaKeys.map(function(k) { return state.dados[k].prenota; });
  var robo = empresaKeys.map(function(k) { return state.dados[k].robo; });
  var maxTotal = Math.max.apply(Math, totais.concat([1]));

  Plotly.newPlot('g_bar', [{
    x: empresas, y: totais, type: 'bar',
    marker: {
      color: CHART_COLORS.empresas,
      line: { color: '#ffffff', width: 1 }
    },
    text: totais, textposition: 'outside',
    textfont: { family: 'Inter, sans-serif', size: 11, color: '#334155' },
    hovertemplate: '%{y} notas<extra>%{x}</extra>',
    cliponaxis: false
  }], Object.assign(barLayout(24, maxTotal), {
    bargap: 0.35
  }), { displayModeBar: false, responsive: true });

  var roboEscriturado = robo.reduce(function(a, b) { return a + b; }, 0);
  var monitorTotal = monitor.reduce(function(a, b) { return a + b; }, 0);
  var totalPrenota = prenota.reduce(function(a, b) { return a + b; }, 0);
  var naoEscriturado = monitorTotal - roboEscriturado;

  Plotly.newPlot('g_pie', [{
    labels: ['Escriturado pelo robô', 'Não escrituradas', 'Pré-nota'],
    values: [roboEscriturado, Math.max(0, naoEscriturado), totalPrenota],
    type: 'pie',
    textinfo: 'label+percent',
    textfont: { family: 'Inter, sans-serif', size: 10, color: '#334155' },
    marker: {
      colors: ['#FF6B35', '#1B1F5E', '#ED6C02'],
      line: { color: '#ffffff', width: 2 }
    },
    hole: 0.45,
    hovertemplate: '%{label}: %{value} notas (%{percent})<extra></extra>',
    sort: false,
    direction: 'clockwise',
    rotation: 90
  }], {
    margin: { t: 8, l: 8, r: 8, b: 50 },
    showlegend: true,
    legend: { orientation: 'h', y: -0.18, font: { family: 'Inter, sans-serif', size: 10, color: '#64748B' } },
    font: CHART_FONT,
    paper_bgcolor: CHART_BG,
    hoverlabel: { bgcolor: '#1E293B', font: { family: 'Inter, sans-serif', size: 11, color: '#fff' }, bordercolor: '#1E293B' }
  }, { displayModeBar: false, responsive: true });

  Plotly.newPlot('g_group', [
    { x: empresas, y: monitor, name: 'Monitor', type: 'bar',
      marker: { color: '#2E7D32', line: { color: '#ffffff', width: 1 } },
      hovertemplate: '%{y}<extra>Monitor</extra>' },
    { x: empresas, y: prenota, name: 'Pré-nota', type: 'bar',
      marker: { color: '#ED6C02', line: { color: '#ffffff', width: 1 } },
      hovertemplate: '%{y}<extra>Pré-nota</extra>' },
    { x: empresas, y: robo, name: 'Robô', type: 'bar',
      marker: { color: '#FF6B35', line: { color: '#ffffff', width: 1 } },
      hovertemplate: '%{y}<extra>Robô</extra>' }
  ], Object.assign(barLayout(14, maxTotal), {
    barmode: 'group',
    showlegend: true,
    legend: { orientation: 'h', y: 1.12, font: { family: 'Inter, sans-serif', size: 10, color: '#64748B' } },
    bargroupgap: 0.2,
    hovermode: 'closest',
    spikedistance: -1
  }), { displayModeBar: false, responsive: true });
}

function atualizarGraficosEmpresa(emp, barId, pieId) {
  if (!state.dados || !state.dados[emp]) return;
  var d = state.dados[emp];
  var maxVal = Math.max(d.monitor, d.prenota, d.robo, 1);

  Plotly.newPlot(barId, [{
    x: ['Monitor', 'Pré-nota', 'Robô'],
    y: [d.monitor, d.prenota, d.robo],
    type: 'bar',
    marker: {
      color: ['#2E7D32', '#ED6C02', '#FF6B35'],
      line: { color: '#ffffff', width: 1 }
    },
    text: [d.monitor, d.prenota, d.robo],
    textposition: 'outside',
    textfont: { family: 'Inter, sans-serif', size: 11, color: '#334155' },
    hovertemplate: '%{y} notas<extra>%{x}</extra>',
    cliponaxis: false
  }], Object.assign(barLayout(24, maxVal), {
    bargap: 0.4
  }), { displayModeBar: false, responsive: true });

  var naoEscriturado = d.monitor - d.robo;
  var labels = [], values = [], colors = [];
  if (d.robo > 0) { labels.push('Escriturado pelo robô'); values.push(d.robo); colors.push('#FF6B35'); }
  if (naoEscriturado > 0) { labels.push('Não escrituradas'); values.push(naoEscriturado); colors.push('#1B1F5E'); }
  if (d.prenota > 0) { labels.push('Pré-nota'); values.push(d.prenota); colors.push('#ED6C02'); }
  if (labels.length === 0) { labels.push('Sem dados'); values.push(1); colors.push('#D1D5DB'); }

  Plotly.newPlot(pieId, [{
    labels: labels, values: values, type: 'pie',
    textinfo: 'label+percent',
    textfont: { family: 'Inter, sans-serif', size: 10, color: '#334155' },
    marker: {
      colors: colors,
      line: { color: '#ffffff', width: 2 }
    },
    hole: 0.45,
    hovertemplate: '%{label}: %{value} notas (%{percent})<extra></extra>',
    sort: false,
    direction: 'clockwise',
    rotation: 90
  }], {
    margin: { t: 8, l: 8, r: 8, b: 50 },
    showlegend: true,
    legend: { orientation: 'h', y: -0.18, font: { family: 'Inter, sans-serif', size: 10, color: '#64748B' } },
    font: CHART_FONT,
    paper_bgcolor: CHART_BG,
    hoverlabel: { bgcolor: '#1E293B', font: { family: 'Inter, sans-serif', size: 11, color: '#fff' }, bordercolor: '#1E293B' }
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
    var maxVal = Math.max(personData.monitor, personData.prenota, personData.robo, 1);

    Plotly.newPlot('maas_bar', [{
      x: ['Monitor', 'Pré-nota', 'Robô'],
      y: [personData.monitor, personData.prenota, personData.robo],
      type: 'bar',
      marker: {
        color: [person.cor, '#ED6C02', '#FF6B35'],
        line: { color: '#ffffff', width: 1 }
      },
      text: [personData.monitor, personData.prenota, personData.robo],
      textposition: 'outside',
      textfont: { family: 'Inter, sans-serif', size: 11, color: '#334155' },
      hovertemplate: '%{y} notas<extra>%{x}</extra>',
      cliponaxis: false
    }], Object.assign(barLayout(24, maxVal), {
      bargap: 0.4
    }), { displayModeBar: false, responsive: true });

    var naoEscriturado = personData.monitor - personData.robo;
    var labels = [], values = [], colors = [];
    if (personData.robo > 0) { labels.push('Escriturado pelo robô'); values.push(personData.robo); colors.push('#FF6B35'); }
    if (naoEscriturado > 0) { labels.push('Não escrituradas'); values.push(naoEscriturado); colors.push(person.cor); }
    if (personData.prenota > 0) { labels.push('Pré-nota'); values.push(personData.prenota); colors.push('#ED6C02'); }
    if (labels.length === 0) { labels.push('Sem dados'); values.push(1); colors.push('#D1D5DB'); }

    Plotly.newPlot('maas_pie', [{
      labels: labels, values: values, type: 'pie',
      textinfo: 'label+percent',
      textfont: { family: 'Inter, sans-serif', size: 10, color: '#334155' },
      marker: {
        colors: colors,
        line: { color: '#ffffff', width: 2 }
      },
      hole: 0.45,
      hovertemplate: '%{label}: %{value} notas (%{percent})<extra></extra>',
      sort: false,
      direction: 'clockwise',
      rotation: 90
    }], {
      margin: { t: 8, l: 8, r: 8, b: 50 },
      showlegend: true,
      legend: { orientation: 'h', y: -0.18, font: { family: 'Inter, sans-serif', size: 10, color: '#64748B' } },
      font: CHART_FONT,
      paper_bgcolor: CHART_BG,
      hoverlabel: { bgcolor: '#1E293B', font: { family: 'Inter, sans-serif', size: 11, color: '#fff' }, bordercolor: '#1E293B' }
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
    {
      x: ['Monitor', 'Pré-nota', 'Robô'],
      y: [person1.monitor, person1.prenota, person1.robo],
      name: p.responsaveis[0].nome,
      type: 'bar',
      marker: { color: p.responsaveis[0].cor, line: { color: '#ffffff', width: 1 } },
      hovertemplate: '%{y}<extra>' + p.responsaveis[0].nome + '</extra>'
    },
    {
      x: ['Monitor', 'Pré-nota', 'Robô'],
      y: [person2.monitor, person2.prenota, person2.robo],
      name: p.responsaveis[1].nome,
      type: 'bar',
      marker: { color: p.responsaveis[1].cor, line: { color: '#ffffff', width: 1 } },
      hovertemplate: '%{y}<extra>' + p.responsaveis[1].nome + '</extra>'
    }
  ], Object.assign(barLayout(14, maxVal), {
    barmode: 'group',
    showlegend: true,
    legend: { orientation: 'h', y: 1.12, font: { family: 'Inter, sans-serif', size: 10, color: '#64748B' } },
    bargroupgap: 0.25
  }), { displayModeBar: false, responsive: true });

  Plotly.newPlot('maas_person_pie', [{
    labels: [p.responsaveis[0].nome, p.responsaveis[1].nome],
    values: [person1.total, person2.total],
    type: 'pie',
    textinfo: 'label+percent',
    textfont: { family: 'Inter, sans-serif', size: 10, color: '#334155' },
    marker: {
      colors: [p.responsaveis[0].cor, p.responsaveis[1].cor],
      line: { color: '#ffffff', width: 2 }
    },
    hole: 0.45,
    hovertemplate: '%{label}: %{value} notas (%{percent})<extra></extra>',
    sort: false,
    direction: 'clockwise',
    rotation: 90
  }], {
    margin: { t: 8, l: 8, r: 8, b: 50 },
    showlegend: true,
    legend: { orientation: 'h', y: -0.18, font: { family: 'Inter, sans-serif', size: 10, color: '#64748B' } },
    font: CHART_FONT,
    paper_bgcolor: CHART_BG,
    hoverlabel: { bgcolor: '#1E293B', font: { family: 'Inter, sans-serif', size: 11, color: '#fff' }, bordercolor: '#1E293B' }
  }, { displayModeBar: false, responsive: true });
}
