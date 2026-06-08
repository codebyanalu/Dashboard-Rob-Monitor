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

function getDadosParaEmpresa(dados, empresaId) {
  return dados && dados[empresaId] ? dados[empresaId] : { monitor: 0, prenota: 0, robo: 0, total: 0 };
}

function getDadosMaasPorPessoa(dados, personId) {
  var empresaData = dados && dados['maas'] ? dados['maas'] : { monitor: 0, prenota: 0, robo: 0, total: 0 };
  if (personId === 'all') return empresaData;
  if (empresaData[personId]) return empresaData[personId];
  var share = getMaasPersonShare(personId);
  return {
    monitor: Math.round(empresaData.monitor * share),
    prenota: Math.round(empresaData.prenota * share),
    robo: Math.round(empresaData.robo * share),
    total: Math.round(empresaData.total * share)
  };
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

function parseDateNumeric(dateStr) {
  var parts = dateStr.split('/');
  return parseInt(parts[0]) + parseInt(parts[1]) * 100;
}

function getRangeAcumulado(startStr, endStr) {
  var startNum = parseDateNumeric(startStr);
  var endNum = parseDateNumeric(endStr);
  var sum = {};
  EMPRESAS.forEach(function(emp) {
    sum[emp.id] = { monitor: 0, prenota: 0, robo: 0, total: 0 };
    var c = getCompany(emp.id);
    if (c && c.responsaveis) {
      c.responsaveis.forEach(function(p) { sum[emp.id][p.id] = { monitor: 0, prenota: 0, robo: 0, total: 0 }; });
    }
  });
  var reg = DATA_REGISTRY[2026];
  for (var mk in reg) {
    if (!reg.hasOwnProperty(mk)) continue;
    var mData = reg[mk];
    for (var wn in mData.weeks) {
      if (!mData.weeks.hasOwnProperty(wn)) continue;
      var week = mData.weeks[wn];
      for (var dk in week.calendar.dias) {
        if (!week.calendar.dias.hasOwnProperty(dk)) continue;
        var dateNum = parseDateNumeric(week.calendar.dias[dk].display);
        if (dateNum >= startNum && dateNum <= endNum) {
          var dayData = week.data[dk];
          EMPRESAS.forEach(function(emp) {
            var dd = dayData[emp.id];
            if (dd) {
              sum[emp.id].monitor += dd.monitor;
              sum[emp.id].prenota += dd.prenota;
              sum[emp.id].robo += dd.robo;
              sum[emp.id].total += dd.total;
              var c = getCompany(emp.id);
              if (c && c.responsaveis) {
                c.responsaveis.forEach(function(p) {
                  if (dd[p.id]) {
                    sum[emp.id][p.id].monitor += dd[p.id].monitor || 0;
                    sum[emp.id][p.id].prenota += dd[p.id].prenota || 0;
                    sum[emp.id][p.id].robo += dd[p.id].robo || 0;
                    sum[emp.id][p.id].total += dd[p.id].total || 0;
                  }
                });
              }
            }
          });
        }
      }
    }
  }
  return sum;
}

function getMaasPersonMetrics(dados, personId) {
  var data = getDadosMaasPorPessoa(dados, personId);
  return {
    total: data.total,
    monitor: data.monitor,
    prenota: data.prenota,
    robo: data.robo,
    eficiencia: data.monitor > 0 ? ((data.robo / data.monitor) * 100).toFixed(1) : 0,
    pctPrenota: data.total > 0 ? ((data.prenota / data.total) * 100).toFixed(1) : 0
  };
}

function getRangeDiario(startStr, endStr) {
  var startNum = parseDateNumeric(startStr);
  var endNum = parseDateNumeric(endStr);
  var days = [];
  var reg = DATA_REGISTRY[2026];
  for (var mk in reg) {
    if (!reg.hasOwnProperty(mk)) continue;
    var mData = reg[mk];
    for (var wn in mData.weeks) {
      if (!mData.weeks.hasOwnProperty(wn)) continue;
      var week = mData.weeks[wn];
      for (var dk in week.calendar.dias) {
        if (!week.calendar.dias.hasOwnProperty(dk)) continue;
        var dateStr = week.calendar.dias[dk].display;
        var dateNum = parseDateNumeric(dateStr);
        if (dateNum >= startNum && dateNum <= endNum) {
          var dayData = week.data[dk];
          var monitor = 0, prenota = 0, robo = 0;
          EMPRESAS.forEach(function(emp) {
            var dd = dayData ? dayData[emp.id] : null;
            if (dd) { monitor += dd.monitor; prenota += dd.prenota; robo += dd.robo; }
          });
          days.push({ dateStr: dateStr, dateNum: dateNum, monitor: monitor, prenota: prenota, robo: robo, gap: Math.max(0, monitor - robo) });
        }
      }
    }
  }
  days.sort(function(a, b) { return a.dateNum - b.dateNum; });
  return days;
}

function getPrevPeriodTotals(startStr, endStr) {
  var sParts = startStr.split('/');
  var eParts = endStr.split('/');
  var startDate = new Date(2026, parseInt(sParts[1]) - 1, parseInt(sParts[0]));
  var endDate = new Date(2026, parseInt(eParts[1]) - 1, parseInt(eParts[0]));
  var diffDays = Math.round((endDate - startDate) / 86400000) + 1;
  var prevEnd = new Date(startDate);
  prevEnd.setDate(prevEnd.getDate() - 1);
  var prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - diffDays + 1);
  function fmt(d) { return (d.getDate() < 10 ? '0' : '') + d.getDate() + '/' + (d.getMonth() + 1 < 10 ? '0' : '') + (d.getMonth() + 1); }
  return getRangeAcumulado(fmt(prevStart), fmt(prevEnd));
}

function getWeeklyTrends(maxWeeks) {
  maxWeeks = maxWeeks || 12;
  var weeks = [];
  var reg = DATA_REGISTRY[2026];
  var monthNamesShort = { '5': 'mai', '6': 'jun', '7': 'jul', '8': 'ago', '9': 'set', '10': 'out', '11': 'nov', '12': 'dez' };
  var allMonths = Object.keys(reg).sort(function(a, b) {
    return reg[a].monthNum - reg[b].monthNum;
  });
  for (var mi = 0; mi < allMonths.length; mi++) {
    var mk = allMonths[mi];
    var mData = reg[mk];
    var weekNums = Object.keys(mData.weeks).map(Number).sort(function(a, b) { return a - b; });
    for (var wi = 0; wi < weekNums.length; wi++) {
      var wn = weekNums[wi];
      var week = mData.weeks[wn];
      var monitor = 0, prenota = 0, robo = 0, hasData = false;
      for (var dk in week.data) {
        if (!week.data.hasOwnProperty(dk)) continue;
        EMPRESAS.forEach(function(emp) {
          var dd = week.data[dk] ? week.data[dk][emp.id] : null;
          if (dd && dd.total > 0) {
            monitor += dd.monitor; prenota += dd.prenota; robo += dd.robo; hasData = true;
          }
        });
      }
      if (hasData) {
        var diasVals = Object.values(week.calendar.dias);
        var label = diasVals.length > 0 ? diasVals[0].display : 'S' + wn;
        var lp = label.split('/');
        var labelFmt = lp[0] + '/' + (monthNamesShort[String(parseInt(lp[1]))] || lp[1]);
        weeks.push({ weekNum: wn, label: labelFmt, monitor: monitor, prenota: prenota, robo: robo, total: monitor + prenota });
      }
    }
  }
  return weeks.slice(0, maxWeeks);
}
