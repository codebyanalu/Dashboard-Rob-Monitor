function getDadosAcumulados(dadosPorData) {
  var sum = {};
  EMPRESAS.forEach(function(emp) {
    sum[emp.id] = { monitor: 0, prenota: 0, robo: 0, total: 0 };
  });
  DAY_KEYS.forEach(function(d) {
    EMPRESAS.forEach(function(emp) {
      var dayData = dadosPorData[d]?.[emp.id];
      if (dayData) {
        sum[emp.id].monitor += dayData.monitor;
        sum[emp.id].prenota += dayData.prenota;
        sum[emp.id].robo += dayData.robo;
        sum[emp.id].total += dayData.total;
      }
    });
  });
  return sum;
}

function getTotaisGeral(dados) {
  var totalMonitor = 0, totalPrenota = 0, totalRobo = 0;
  EMPRESAS.forEach(function(emp) {
    var d = dados[emp.id];
    if (d) {
      totalMonitor += d.monitor;
      totalPrenota += d.prenota;
      totalRobo += d.robo;
    }
  });
  return {
    geral: totalMonitor + totalPrenota,
    totalMonitor: totalMonitor,
    totalPrenota: totalPrenota,
    totalRobo: totalRobo
  };
}

function getTotalData(dadosPorData, data) {
  var dayData = dadosPorData[data];
  if (!dayData) return 0;
  return Object.values(dayData).reduce(function(s, e) { return s + e.total; }, 0);
}

function getValorDiaContexto(dadosPorData, data, pagina) {
  var dayData = dadosPorData[data];
  if (!dayData) return 0;
  if (pagina === 'geral') {
    return Object.values(dayData).reduce(function(s, e) { return s + e.total; }, 0);
  }
  return dayData[pagina]?.total || 0;
}

function getTotalGeralAcumulado(dadosPorData) {
  return DAY_KEYS.reduce(function(sum, d) { return sum + getTotalData(dadosPorData, d); }, 0);
}
