function getWeekComparison(weekNum) {
  var week = WEEK_DATA[weekNum];
  if (!week) return null;
  return DAY_KEYS.map(function(d) {
    return {
      day: d,
      total: Object.values(week.data[d]).reduce(function(s, e) { return s + e.total; }, 0)
    };
  });
}

function getTrend(weekNum, metric) {
  var week = WEEK_DATA[weekNum];
  if (!week) return [];
  return DAY_KEYS.map(function(d) {
    var dayData = week.data[d];
    return {
      day: d,
      label: week.calendar.dias[d].label,
      display: week.calendar.dias[d].display,
      value: Object.values(dayData).reduce(function(s, e) { return s + e[metric]; }, 0)
    };
  });
}

function getRoboEfficiency(weekNum) {
  var week = WEEK_DATA[weekNum];
  if (!week) return 0;
  var totalMonitor = 0, totalRobo = 0;
  DAY_KEYS.forEach(function(d) {
    Object.values(week.data[d]).forEach(function(e) {
      totalMonitor += e.monitor;
      totalRobo += e.robo;
    });
  });
  return totalMonitor > 0 ? (totalRobo / totalMonitor) * 100 : 0;
}
