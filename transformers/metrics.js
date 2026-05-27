function formatPct(value, total, decimals) {
  if (decimals === undefined) decimals = 1;
  if (!total || total === 0) return '0%';
  return ((value / total) * 100).toFixed(decimals) + '%';
}

function getRoboEfficiencyPct(monitor, robo) {
  return monitor > 0 ? ((robo / monitor) * 100).toFixed(1) : 0;
}

function getEmpresaRanking(dados) {
  return EMPRESAS.map(function(emp) {
    return {
      id: emp.id,
      nome: emp.nome,
      total: dados[emp.id]?.total || 0,
      monitor: dados[emp.id]?.monitor || 0,
      prenota: dados[emp.id]?.prenota || 0,
      robo: dados[emp.id]?.robo || 0
    };
  }).sort(function(a, b) { return b.total - a.total; });
}

function getParticipacao(value, total) {
  return total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
}

function formatNumber(n) {
  return String(n);
}
