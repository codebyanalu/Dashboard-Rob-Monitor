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
  function prevMonth(dateStr) {
    var p = dateStr.split('/');
    var m = parseInt(p[1]) - 1;
    return p[0] + '/' + (m < 10 ? '0' : '') + m;
  }
  return getRangeAcumulado(prevMonth(startStr), prevMonth(endStr));
}

function getWeeklyTrendsEmpresa(empresaId) {
  var reg = DATA_REGISTRY[2026];
  var monthNamesShort = { '5': 'mai', '6': 'jun', '7': 'jul', '8': 'ago', '9': 'set', '10': 'out', '11': 'nov', '12': 'dez' };

  if (!periodRange.start || !periodRange.end) return [];

  var startNum = periodRange.start.month * 100 + periodRange.start.day;
  var endNum   = periodRange.end.month   * 100 + periodRange.end.day;

  var weeks = [];
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
      var dias = Object.values(week.calendar.dias);
      if (dias.length === 0) continue;
      var first = dias[0].display.split('/');
      var last  = dias[dias.length - 1].display.split('/');
      var weekStart = parseInt(first[1]) * 100 + parseInt(first[0]);
      var weekEnd   = parseInt(last[1])  * 100 + parseInt(last[0]);
      if (weekEnd < startNum || weekStart > endNum) continue;

      var monitor = 0, prenota = 0, robo = 0;
      for (var dk in week.data) {
        if (!week.data.hasOwnProperty(dk)) continue;
        var dateNum = parseDateNumeric(week.calendar.dias[dk].display);
        if (dateNum < startNum || dateNum > endNum) continue;
        var dd = week.data[dk] ? week.data[dk][empresaId] : null;
        if (dd) {
          monitor += dd.monitor; prenota += dd.prenota; robo += dd.robo;
        }
      }
      if (monitor === 0 && prenota === 0 && robo === 0) continue;
      var label = dias[0].display;
      var lp = label.split('/');
      var labelFmt = lp[0] + '/' + (monthNamesShort[String(parseInt(lp[1]))] || lp[1]);
      weeks.push({ weekNum: wn, label: labelFmt, monitor: monitor, prenota: prenota, robo: robo, total: monitor + prenota });
    }
  }
  return weeks;
}

function getRangeDiarioEmpresa(empresaId, startStr, endStr) {
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
          var dd = week.data[dk] ? week.data[dk][empresaId] : null;
          var monitor = dd ? dd.monitor : 0;
          var prenota = dd ? dd.prenota : 0;
          var robo = dd ? dd.robo : 0;
          days.push({ dateStr: dateStr, dateNum: dateNum, monitor: monitor, prenota: prenota, robo: robo, gap: Math.max(0, monitor - robo) });
        }
      }
    }
  }
  days.sort(function(a, b) { return a.dateNum - b.dateNum; });
  return days;
}

function getWeeklyTrends() {
  var reg = DATA_REGISTRY[2026];
  var monthNamesShort = { '5': 'mai', '6': 'jun', '7': 'jul', '8': 'ago', '9': 'set', '10': 'out', '11': 'nov', '12': 'dez' };

  if (!periodRange.start || !periodRange.end) return [];

  var startNum = periodRange.start.month * 100 + periodRange.start.day;
  var endNum   = periodRange.end.month   * 100 + periodRange.end.day;

  var weeks = [];
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
      var dias = Object.values(week.calendar.dias);
      if (dias.length === 0) continue;
      var first = dias[0].display.split('/');
      var last  = dias[dias.length - 1].display.split('/');
      var weekStart = parseInt(first[1]) * 100 + parseInt(first[0]);
      var weekEnd   = parseInt(last[1])  * 100 + parseInt(last[0]);
      if (weekEnd < startNum || weekStart > endNum) continue;

      var monitor = 0, prenota = 0, robo = 0;
      for (var dk in week.data) {
        if (!week.data.hasOwnProperty(dk)) continue;
        var dateNum = parseDateNumeric(week.calendar.dias[dk].display);
        if (dateNum < startNum || dateNum > endNum) continue;
        EMPRESAS.forEach(function(emp) {
          var dd = week.data[dk] ? week.data[dk][emp.id] : null;
          if (dd) {
            monitor += dd.monitor; prenota += dd.prenota; robo += dd.robo;
          }
        });
      }
      if (monitor === 0 && prenota === 0 && robo === 0) continue;
      var label = dias[0].display;
      var lp = label.split('/');
      var labelFmt = lp[0] + '/' + (monthNamesShort[String(parseInt(lp[1]))] || lp[1]);
      weeks.push({ weekNum: wn, label: labelFmt, monitor: monitor, prenota: prenota, robo: robo, total: monitor + prenota });
    }
  }
  return weeks;
}
