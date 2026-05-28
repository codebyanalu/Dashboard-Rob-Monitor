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
  var c = getCompany(emp);
  var respText = formatResponsaveis(c);
  document.getElementById(containerId).innerHTML =
    '<div class="card"><div class="card-accent" style="background:#1B1F5E"></div><div class="card-title">Total ' + nome + '</div><div class="card-value">' + total + '</div><div class="card-sub">' + respText + '</div></div>' +
    '<div class="card"><div class="card-accent" style="background:#2E7D32"></div><div class="card-title">Monitor</div><div class="card-value">' + d.monitor + '</div><div class="card-badge" style="background:#E8F5E9;color:#2E7D32">' + pctMonitor + '%</div></div>' +
    '<div class="card"><div class="card-accent" style="background:#ED6C02"></div><div class="card-title">Pr\u00e9-nota</div><div class="card-value">' + d.prenota + '</div><div class="card-badge" style="background:#FFF3E0;color:#ED6C02">' + pctPrenota + '%</div></div>' +
    '<div class="card"><div class="card-accent" style="background:#FF6B35"></div><div class="card-title">Rob\u00f4</div><div class="card-value">' + d.robo + '</div><div class="card-badge" style="background:#FFF0EB;color:#FF6B35">' + pctRoboMonitor + '% do Monitor</div></div>';
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
    document.getElementById('maas-cards').innerHTML =
      '<div class="card"><div class="card-accent" style="background:' + person.cor + '"></div><div class="card-title">Total ' + person.nome + '</div><div class="card-value">' + personData.total + '</div><div class="card-sub">Monitor + Pr\u00e9-nota</div></div>' +
      '<div class="card"><div class="card-accent" style="background:#2E7D32"></div><div class="card-title">Monitor</div><div class="card-value">' + personData.monitor + '</div><div class="card-badge" style="background:#E8F5E9;color:#2E7D32">' + pctMonitor + '%</div></div>' +
      '<div class="card"><div class="card-accent" style="background:#ED6C02"></div><div class="card-title">Pr\u00e9-nota</div><div class="card-value">' + personData.prenota + '</div><div class="card-badge" style="background:#FFF3E0;color:#ED6C02">' + pctPrenota + '%</div></div>' +
      '<div class="card"><div class="card-accent" style="background:#FF6B35"></div><div class="card-title">Rob\u00f4</div><div class="card-value">' + personData.robo + '</div><div class="card-badge" style="background:#FFF0EB;color:#FF6B35">' + pctRoboMonitor + '% do Monitor</div></div>';
    atualizarPersonMetrics(personData);
  }
}

function atualizarPersonMetrics(d) {
  var eficiencia = d.monitor > 0 ? ((d.robo / d.monitor) * 100).toFixed(1) : 0;
  var pctPrenota = d.total > 0 ? ((d.prenota / d.total) * 100).toFixed(1) : 0;
  document.getElementById('maas-person-metrics').innerHTML =
    '<div class="person-metric pm-navy"><div class="pm-label">Volume Total</div><div class="pm-value">' + d.total + '</div><div class="pm-sub">notas recebidas</div></div>' +
    '<div class="person-metric pm-green"><div class="pm-label">Efici\u00eancia do Rob\u00f4</div><div class="pm-value">' + eficiencia + '%</div><div class="pm-sub">' + d.robo + ' de ' + d.monitor + ' monitor</div></div>' +
    '<div class="person-metric pm-orange"><div class="pm-label">Pr\u00e9-nota</div><div class="pm-value">' + pctPrenota + '%</div><div class="pm-sub">' + d.prenota + ' de ' + d.total + ' total</div></div>';
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
    '<h3>Tabela \u2014 ' + nome + '</h3>' +
    '<table><thead><tr><th>Composi\u00e7\u00e3o</th><th class="num">Quantidade</th><th class="num">% do total</th></tr></thead>' +
    '<tbody>' +
      '<tr><td>Escriturado pelo rob\u00f4</td><td class="num">' + d.robo + '</td><td class="num">' + pctRobo + '%</td></tr>' +
      '<tr><td>N\u00e3o escrituradas pelo rob\u00f4</td><td class="num">' + naoEscriturado + '</td><td class="num">' + pctNaoEscriturado + '%</td></tr>' +
      '<tr><td>Recebidas pela Pr\u00e9-nota</td><td class="num">' + d.prenota + '</td><td class="num">' + pctPrenota + '%</td></tr>' +
      '<tr><td>Total</td><td class="num">' + total + '</td><td class="num">100,0%</td></tr>' +
    '</tbody></table>';
}
