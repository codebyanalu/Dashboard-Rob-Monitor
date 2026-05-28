function getPeriodoStr() {
  if (periodRange.start && periodRange.end) {
    var s = pad(periodRange.start.day) + '/' + pad(periodRange.start.month);
    var e = pad(periodRange.end.day) + '/' + pad(periodRange.end.month);
    if (s === e) return 'em ' + s;
    return 'de ' + s + ' a ' + e;
  }
  return '';
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

function formatResponsaveis(c) {
  if (!c || !c.responsaveis) return '';
  if (c.responsaveis.length === 1) return ' (Resp.: ' + c.responsaveis[0].nome + ')';
  var names = c.responsaveis.map(function(p) { return p.nome; });
  return ' (Resps.: ' + names.join(' e ') + ')';
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

  var c = getCompany(emp);
  var respText = formatResponsaveis(c);
  var text = '<strong>' + nome + '</strong> registrou <strong>' + total + '</strong> notas ' + periodoStr + respText + '. ';
  if (d.monitor > 0) {
    text += 'Rob\u00f4 escriturou ' + d.robo + ' de ' + d.monitor + ' notas do Monitor (' + pctRoboMonitor + '% de efici\u00eancia). ';
  }
  if (d.prenota > 0) {
    text += 'Pr\u00e9-nota: ' + d.prenota + ' notas (' + pctPrenota + '% do volume).';
  }
  document.getElementById(containerId).innerHTML = '<strong>Insight ' + nome + ':</strong> ' + text;
}

function atualizarInsightMaas() {
  if (!state.dados || !state.dados['maas']) return;
  var d = state.dados['maas'];
  var personId = getMaasPersona();
  var total = d.total;
  var periodoStr = getPeriodoStr();
  var nome = 'MAAS';

  if (total === 0) {
    document.getElementById('insight-maas').innerHTML = '<strong>Insight ' + nome + ':</strong> Nenhuma movimenta\u00e7\u00e3o registrada ' + periodoStr + '.';
    return;
  }

  var c = getCompany('maas');
  if (personId === 'all') {
    var respText = formatResponsaveis(c);
    var parts = c.responsaveis.map(function(p) {
      var pd = getDadosMaasPorPessoa(state.dados, p.id);
      return p.nome + ': ' + pd.total + ' notas';
    });
    var text = '<strong>' + nome + '</strong> registrou <strong>' + total + '</strong> notas ' + periodoStr + respText + '. ';
    text += parts.join(' | ') + '. ';
    if (d.monitor > 0) {
      var pctRoboMonitor = d.monitor > 0 ? ((d.robo / d.monitor) * 100).toFixed(1) : 0;
      text += 'Rob\u00f4: ' + d.robo + '/' + d.monitor + ' (' + pctRoboMonitor + '% efici\u00eancia).';
    }
    document.getElementById('insight-maas').innerHTML = '<strong>Insight ' + nome + ':</strong> ' + text;
  } else {
    var personData = getDadosMaasPorPessoa(state.dados, personId);
    var person = c.responsaveis.find(function(r) { return r.id === personId; }) || c.responsaveis[0];
    var pctRoboMonitor = personData.monitor > 0 ? ((personData.robo / personData.monitor) * 100).toFixed(1) : 0;
    var text = '<strong>' + person.nome + '</strong> (' + nome + ') registrou <strong>' + personData.total + '</strong> notas ' + periodoStr + '. ';
    if (personData.monitor > 0) {
      text += 'Rob\u00f4 escriturou ' + personData.robo + ' de ' + personData.monitor + ' notas do Monitor (' + pctRoboMonitor + '% de efici\u00eancia). ';
    }
    if (personData.prenota > 0) {
      var pctPrenota = personData.total > 0 ? ((personData.prenota / personData.total) * 100).toFixed(1) : 0;
      text += 'Pr\u00e9-nota: ' + personData.prenota + ' notas (' + pctPrenota + '% do volume).';
    }
    document.getElementById('insight-maas').innerHTML = '<strong>Insight ' + nome + ' (' + person.nome + '):</strong> ' + text;
  }
}
