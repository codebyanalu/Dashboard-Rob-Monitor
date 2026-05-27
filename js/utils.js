window.mostrarToast = function(msg) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg || 'Operacao concluida!';
  toast.style.display = 'block';
  toast.style.opacity = '1';
  setTimeout(function() {
    toast.style.opacity = '0';
    setTimeout(function() { toast.style.display = 'none'; }, 300);
  }, 2000);
};

window.toggleSidebar = function() {
  document.body.classList.toggle('sidebar-collapsed');
  var collapsed = document.body.classList.contains('sidebar-collapsed');
  saveSidebarState(collapsed);
  setTimeout(function() { window.dispatchEvent(new Event('resize')); }, 310);
};

window.toggleEditPanel = function() {
  var body = document.getElementById('editBody');
  var header = document.querySelector('.edit-header span');
  if (!body) return;
  if (body.classList.contains('open')) {
    body.classList.remove('open');
    if (header) header.textContent = '\u25BC';
  } else {
    body.classList.add('open');
    if (header) header.textContent = '\u25B2';
  }
};

window.validarRobo = function(data, empresa) {
  var monitor = parseInt(document.getElementById('edit-' + data + '-' + empresa + '-monitor').value) || 0;
  var robo = parseInt(document.getElementById('edit-' + data + '-' + empresa + '-robo').value) || 0;
  var span = document.getElementById('valid-' + data + '-' + empresa);
  if (!span) return;
  if (robo > monitor) {
    span.innerHTML = 'Robo > Monitor!';
    span.style.color = '#FF6B35';
    span.style.fontWeight = 'bold';
  } else {
    span.innerHTML = '\u2713 OK';
    span.style.color = '#2E7D32';
  }
};

window.applyEdits = function() {
  var empresas = ['maas', 'hp', 'urbi_recanto', 'urbi_samambaia'];
  ['d1', 'd2', 'd3', 'd4', 'd5'].forEach(function(data) {
    empresas.forEach(function(emp) {
      var novoMonitor = parseInt(document.getElementById('edit-' + data + '-' + emp + '-monitor').value) || 0;
      var novoPrenota = parseInt(document.getElementById('edit-' + data + '-' + emp + '-prenota').value) || 0;
      var novoRobo = parseInt(document.getElementById('edit-' + data + '-' + emp + '-robo').value) || 0;
      state.dadosPorData[data][emp] = {
        monitor: novoMonitor,
        prenota: novoPrenota,
        robo: Math.min(novoRobo, novoMonitor),
        total: novoMonitor + novoPrenota
      };
    });
  });
  updateDados();
  saveWeekData(state.activeWeek, state.dadosPorData);
  atualizarDashboardCompleto();
  window.mostrarToast('Dados atualizados e salvos!');
};

window.resetData = function() {
  var weekData = getActiveWeekData();
  if (weekData) {
    state.dadosPorData = JSON.parse(JSON.stringify(weekData.defaults));
    updateDados();
    saveWeekData(state.activeWeek, state.dadosPorData);
  }
  atualizarDashboardCompleto();
  window.mostrarToast('Dados resetados para o padrao!');
};
