function atualizarDateStatsCards() {
  var totals = {};
  DAY_KEYS.forEach(function(d) { totals[d] = getValorDiaContexto(state.dadosPorData, d, state.paginaAtual); });
  var totalGeral = Object.values(totals).reduce(function(a, b) { return a + b; }, 0);
  var media = Math.round(totalGeral / 5);
  var cal = getActiveWeekData()?.calendar;
  if (!cal) return;

  var orderedDays = [
    { key: 'd1', nome: 'Segunda-feira' },
    { key: 'd2', nome: 'Terça-feira' },
    { key: 'd3', nome: 'Quarta-feira' },
    { key: 'd4', nome: 'Quinta-feira' },
    { key: 'd5', nome: 'Sexta-feira' }
  ];

  var html = '';
  orderedDays.forEach(function(day, idx) {
    var val = totals[day.key];
    var prevVal = idx > 0 ? totals[orderedDays[idx - 1].key] : val;
    var diff = val - prevVal;
    var diffClass = diff >= 0 ? 'positive' : 'negative';
    var diffArrow = diff >= 0 ? '\u2191' : '\u2193';
    html +=
      '<div class="date-stat-card ' + (state.dataAtual === day.key ? 'active-day' : '') + '" onclick="changeData(\'' + day.key + '\')">' +
        '<div class="date-stat-label">' + day.nome + '</div>' +
        '<div class="date-stat-value">' + val + '</div>' +
        '<div class="date-stat-total">notas (' + cal.dias[day.key].display + ')</div>' +
        (idx > 0 ? '<div class="date-stat-diff ' + diffClass + '">' + diffArrow + ' ' + Math.abs(diff) + ' vs ' + orderedDays[idx - 1].nome.slice(0, 3) + '</div>' : '') +
      '</div>';
  });

  html +=
    '<div class="date-stat-card ' + (state.dataAtual === 'acumulado' ? 'active-day' : '') + '" onclick="changeData(\'acumulado\')">' +
      '<div class="date-stat-label">Total Acumulado</div>' +
      '<div class="date-stat-value">' + totalGeral + '</div>' +
      '<div class="date-stat-total">notas (5 dias)</div>' +
      '<div class="date-stat-diff positive">m\u00e9dia: ' + media + '/dia</div>' +
    '</div>';

  document.getElementById('date-stats-cards').innerHTML = html;
}

function atualizarCardsGerais() {
  if (!state.dados) return;
  var totais = getTotaisGeral(state.dados);
  document.getElementById('total-geral').textContent = totais.geral;
  document.getElementById('total-monitor').textContent = totais.totalMonitor;
  document.getElementById('total-prenota').textContent = totais.totalPrenota;
  document.getElementById('total-robo').textContent = totais.totalRobo;
  if (totais.geral > 0) {
    document.getElementById('monitor-pct').textContent = formatPct(totais.totalMonitor, totais.geral);
    document.getElementById('prenota-pct').textContent = formatPct(totais.totalPrenota, totais.geral);
    document.getElementById('robo-pct').textContent = (totais.totalMonitor > 0 ? ((totais.totalRobo / totais.totalMonitor) * 100).toFixed(1) : 0) + '% do Monitor';
  }
}

function atualizarCardsEmpresa(emp, containerId, nome) {
  if (!state.dados || !state.dados[emp]) return;
  var d = state.dados[emp];
  var total = d.total;
  var pctMonitor = total > 0 ? (d.monitor / total * 100).toFixed(1) : 0;
  var pctPrenota = total > 0 ? (d.prenota / total * 100).toFixed(1) : 0;
  var pctRoboMonitor = d.monitor > 0 ? ((d.robo / d.monitor) * 100).toFixed(1) : 0;
  document.getElementById(containerId).innerHTML =
    '<div class="card"><div class="card-accent" style="background:#1B1F5E"></div><div class="card-title">Total ' + nome + '</div><div class="card-value">' + total + '</div><div class="card-sub">Monitor + Pr\u00e9-nota</div></div>' +
    '<div class="card"><div class="card-accent" style="background:#2E7D32"></div><div class="card-title">Monitor</div><div class="card-value">' + d.monitor + '</div><div class="card-badge" style="background:#E8F5E9;color:#2E7D32">' + pctMonitor + '%</div></div>' +
    '<div class="card"><div class="card-accent" style="background:#ED6C02"></div><div class="card-title">Pr\u00e9-nota</div><div class="card-value">' + d.prenota + '</div><div class="card-badge" style="background:#FFF3E0;color:#ED6C02">' + pctPrenota + '%</div></div>' +
    '<div class="card"><div class="card-accent" style="background:#FF6B35"></div><div class="card-title">Rob\u00f4</div><div class="card-value">' + d.robo + '</div><div class="card-badge" style="background:#FFF0EB;color:#FF6B35">' + pctRoboMonitor + '% do Monitor</div></div>';
}

function atualizarTabelaConsolidada() {
  if (!state.dados) return;
  var keys = ['maas', 'hp', 'urbi_recanto', 'urbi_samambaia'];
  var nomes = ['MAAS', 'HP', 'URBI Recanto', 'URBI Samambaia'];
  var totais = getTotaisGeral(state.dados);
  var totalGeral = totais.geral;

  var html = '<thead><tr><th>Empresa</th><th class="num">Total</th><th class="num">Monitor</th><th class="num">Pr\u00e9-nota</th><th class="num">Rob\u00f4</th><th class="num">% Rob\u00f4/Monitor</th><th class="num">Part. geral</th></tr></thead><tbody>';
  keys.forEach(function(k, i) {
    var d = state.dados[k];
    if (!d) return;
    var pctRoboStr = d.monitor > 0 ? ((d.robo / d.monitor) * 100).toFixed(1) + '%' : '\u2014';
    var partGeral = getParticipacao(d.total, totalGeral);
    html += '<tr>' +
      '<td>' + nomes[i] + '</td>' +
      '<td class="num">' + d.total + '</td>' +
      '<td class="num">' + d.monitor + '</td>' +
      '<td class="num">' + d.prenota + '</td>' +
      '<td class="num">' + d.robo + '</td>' +
      '<td class="num">' + pctRoboStr + '</td>' +
      '<td class="num">' + partGeral + '</td>' +
    '</tr>';
  });
  html += '<tr class="table-total"><td>Total</td><td class="num">' + totalGeral + '</td><td class="num">' + totais.totalMonitor + '</td><td class="num">' + totais.totalPrenota + '</td><td class="num">' + totais.totalRobo + '</td><td class="num">\u2014</td><td class="num">100%</td></tr>';
  html += '</tbody>';
  document.getElementById('tabela-consolidada').innerHTML = '<table>' + html + '</table>';
}

function atualizarRanking() {
  if (!state.dados) return;
  var ranking = getEmpresaRanking(state.dados);
  var html = ranking.map(function(r, idx) {
    return '<div class="rank-item">' +
      '<div class="rank-num">' + (idx + 1) + '</div>' +
      '<div class="rank-info">' +
        '<div class="rank-name">' + r.nome + '</div>' +
        '<div class="rank-sub">Monitor: ' + r.monitor + ' | Pr\u00e9-nota: ' + r.prenota + ' | Rob\u00f4: ' + r.robo + '</div>' +
      '</div>' +
      '<div class="rank-val">' + r.total + '</div>' +
    '</div>';
  }).join('');
  document.getElementById('ranking-list').innerHTML = html;
}

function atualizarProgressoEmpresa(emp, containerId) {
  if (!state.dados || !state.dados[emp]) return;
  var d = state.dados[emp];
  var total = d.total;
  var pctMonitor = total > 0 ? (d.monitor / total * 100).toFixed(1) : 0;
  var pctPrenota = total > 0 ? (d.prenota / total * 100).toFixed(1) : 0;
  var pctRobo = total > 0 ? (d.robo / total * 100).toFixed(1) : 0;
  document.getElementById(containerId).innerHTML =
    '<h3>Distribui\u00e7\u00e3o sobre o total (' + total + ')</h3>' +
    '<div class="prog-row"><span class="prog-label">Recebidas pelo Monitor</span><div class="prog-wrap"><div class="prog-fill" style="width:' + pctMonitor + '%;background:#2E7D32"></div></div><span class="prog-val">' + d.monitor + '</span><span class="prog-pct">' + pctMonitor + '%</span></div>' +
    '<div class="prog-row"><span class="prog-label">Recebidas pela Pr\u00e9-nota</span><div class="prog-wrap"><div class="prog-fill" style="width:' + pctPrenota + '%;background:#ED6C02"></div></div><span class="prog-val">' + d.prenota + '</span><span class="prog-pct">' + pctPrenota + '%</span></div>' +
    '<div class="prog-row"><span class="prog-label">Escrituradas pelo rob\u00f4</span><div class="prog-wrap"><div class="prog-fill" style="width:' + pctRobo + '%;background:#FF6B35"></div></div><span class="prog-val">' + d.robo + '</span><span class="prog-pct">' + pctRobo + '%</span></div>';
}

function atualizarTabelaEmpresa(emp, containerId, nome) {
  if (!state.dados || !state.dados[emp]) return;
  var d = state.dados[emp];
  var total = d.total;
  var naoEscriturado = Math.max(0, d.monitor - d.robo);
  var pctRobo = total > 0 ? (d.robo / total * 100).toFixed(1) : 0;
  var pctNaoEscriturado = total > 0 ? (naoEscriturado / total * 100).toFixed(1) : 0;
  var pctPrenota = total > 0 ? (d.prenota / total * 100).toFixed(1) : 0;
  document.getElementById(containerId).innerHTML =
    '<h3>Tabela — ' + nome + '</h3>' +
    '<table><thead><tr><th>Composi\u00e7\u00e3o</th><th class="num">Quantidade</th><th class="num">% do total</th></tr></thead>' +
    '<tbody>' +
      '<tr><td>Escriturado pelo rob\u00f4</td><td class="num">' + d.robo + '</td><td class="num">' + pctRobo + '%</td></tr>' +
      '<tr><td>N\u00e3o escrituradas pelo rob\u00f4</td><td class="num">' + naoEscriturado + '</td><td class="num">' + pctNaoEscriturado + '%</td></tr>' +
      '<tr><td>Recebidas pela Pr\u00e9-nota</td><td class="num">' + d.prenota + '</td><td class="num">' + pctPrenota + '%</td></tr>' +
      '<tr><td>Total</td><td class="num">' + total + '</td><td class="num">100,0%</td></tr>' +
    '</tbody></table>';
}
