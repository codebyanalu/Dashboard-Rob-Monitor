var PREFIX = 'gcon_sian_';

function saveWeekData(weekNum, data) {
  try {
    localStorage.setItem(PREFIX + 'week_' + weekNum, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

function loadWeekData(weekNum) {
  try {
    var saved = localStorage.getItem(PREFIX + 'week_' + weekNum);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

function saveSidebarState(collapsed) {
  try {
    localStorage.setItem(PREFIX + 'sidebar', collapsed ? 'collapsed' : '');
  } catch (e) {}
}

function loadSidebarState() {
  try {
    return localStorage.getItem(PREFIX + 'sidebar') === 'collapsed';
  } catch (e) {
    return false;
  }
}
