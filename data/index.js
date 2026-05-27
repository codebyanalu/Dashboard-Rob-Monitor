var DATA_REGISTRY = {
  2026: {
    may: MAY_2026,
    jun: JUNE_2026,
    jul: JUL_2026,
    aug: AUG_2026,
    sep: SEP_2026,
    oct: OCT_2026,
    nov: NOV_2026,
    dec: DEC_2026
  }
};

var DAY_KEYS = ['d1', 'd2', 'd3', 'd4', 'd5'];

function getYearMonths(year) {
  var yr = DATA_REGISTRY[year];
  return yr ? Object.keys(yr).map(function(k) {
    return { key: k, label: yr[k].month, num: yr[k].monthNum };
  }) : [];
}

function getMonthWeeks(year, month) {
  var m = DATA_REGISTRY[year]?.[month];
  if (!m) return [];
  return Object.keys(m.weeks).map(function(k) {
    return { num: parseInt(k), label: m.weeks[k].calendar.label };
  }).sort(function(a, b) { return a.num - b.num; });
}
