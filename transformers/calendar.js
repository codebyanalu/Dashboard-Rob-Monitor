function getCalendarConfig(weekNum) {
  var week = WEEK_DATA[weekNum];
  if (!week) return null;
  return week.calendar;
}

function getDayLabel(weekNum, dayKey) {
  var cal = getCalendarConfig(weekNum);
  if (!cal || !cal.dias[dayKey]) return '';
  return cal.dias[dayKey].display;
}

function getDayName(dayKey) {
  var names = { d1: 'Segunda-feira', d2: 'Terça-feira', d3: 'Quarta-feira', d4: 'Quinta-feira', d5: 'Sexta-feira' };
  return names[dayKey] || '';
}

function getPeriodoStr(weekNum) {
  var cal = getCalendarConfig(weekNum);
  return cal ? cal.inicio + ' a ' + cal.fim : '';
}
