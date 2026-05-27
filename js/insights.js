function getPeriodoStr() {
  if (state.dataAtual === 'acumulado') return 'no Total Acumulado';
  var cal = getActiveWeekData()?.calendar;
  if (!cal) return '';
  var dayInfo = cal.dias[state.dataAtual];
  var dayNames = { d1: 'na Segunda-feira', d2: 'na Ter\u00e7a-feira', d3: 'na Quarta-feira', d4: 'na Quinta-feira', d5: 'na Sexta-feira' };
  return (dayNames[state.dataAtual] || '') + (dayInfo?.display ? ' (' + dayInfo.display + ')' : '');
}

function atualizarInsightGeral() {
  if (!state.dados) return;
  var totalGeral = getTotaisGeral(state.dados).geral;
  var periodoStr = getPeriodoStr();

  if (totalGeral === 0) {
    document.getElementById('insight-geral').innerHTML = '<strong>Insight Operacional:</strong> Nenhuma nota fiscal foi recebida ' + periodoStr + ' at\u00e9 o momento.';
    return;
  }

  var ranking = getEmpresaRanking(state.dados);
  var lider = ranking[0];
  var pctLider = totalGeral > 0 ? ((lider.total / totalGeral) * 100).toFixed(1) : 0;
  var totais = getTotaisGeral(state.dados);
  var eficienciaRobo = totais.totalMonitor > 0 ? ((totais.totalRobo / totais.totalMonitor) * 100).toFixed(1) : 0;

  var insightStr = '<strong>Insight Operacional:</strong> Total de <strong>' + totalGeral + '</strong> notas ' + periodoStr + '. ';
  if (lider.total > 0) {
    insightStr += 'Lideran\u00e7a: <strong>' + lider.nome + '</strong> com ' + lider.total + ' notas (' + pctLider + '% do total). ';
  }
  if (totais.totalMonitor > 0) {
    insightStr += 'Efici\u00eancia do rob\u00f4: <strong>' + eficienciaRobo + '%</strong> (' + totais.totalRobo + ' de ' + totais.totalMonitor + ' notas do Monitor escrituradas).';
  } else {
    insightStr += 'Nenhuma nota via Monitor para processamento do rob\u00f4.';
  }

  document.getElementById('insight-geral').innerHTML = insightStr;
}

function atualizarInsightEmpresa(emp, containerId, nome) {
  if (!state.dados || !state.dados[emp]) return;
  var d = state.dados[emp];
  var total = d.total;
  var periodoStr = getPeriodoStr();
  var pctRoboMonitor = d.monitor > 0 ? ((d.robo / d.monitor) * 100).toFixed(1) : 0;
  var pctPrenota = total > 0 ? ((d.prenota / total) * 100).toFixed(1) : 0;

  if (total === 0) {
    document.getElementById(containerId).innerHTML = '<strong>Insight ' + nome + ':</strong> Nenhuma movimenta\u00e7\u00e3o registrada ' + periodoStr + '.';
    return;
  }

  var text = '<strong>' + nome + '</strong> registrou <strong>' + total + '</strong> notas ' + periodoStr + '. ';
  if (d.monitor > 0) {
    text += 'Rob\u00f4 escriturou ' + d.robo + ' de ' + d.monitor + ' notas do Monitor (' + pctRoboMonitor + '% de efici\u00eancia). ';
  }
  if (d.prenota > 0) {
    text += 'Pr\u00e9-nota: ' + d.prenota + ' notas (' + pctPrenota + '% do volume).';
  }
  document.getElementById(containerId).innerHTML = '<strong>Insight ' + nome + ':</strong> ' + text;
}
