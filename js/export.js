window.exportPDF = async function() {
  var btn = document.querySelector('.btn-primary:not(.btn-success)');
  if (btn) { btn.innerHTML = '<span>Gerando PDF...</span>'; btn.disabled = true; }
  var pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
  var pageIds = ['geral', 'hp', 'urbi_recanto', 'urbi_samambaia', 'maas'];
  var titles = ['Visão Geral', 'HP', 'URBI Recanto', 'URBI Samambaia', 'MAAS'];

  for (var i = 0; i < pageIds.length; i++) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    document.getElementById(pageIds[i]).classList.add('active');
    document.getElementById('page-title').textContent = 'Semana ' + state.activeWeek + ' - ' + titles[i];
    await new Promise(function(r) { return setTimeout(r, 300); });
    var canvas = await html2canvas(document.querySelector('.content'), { scale: 1.5, useCORS: true, backgroundColor: '#F0F2F5' });
    var img = canvas.toDataURL('image/jpeg', 0.92);
    var w = 210, h = (canvas.height * w) / canvas.width;
    if (i > 0) pdf.addPage();
    pdf.addImage(img, 'JPEG', 0, 0, w, Math.min(h, 297));
  }

  document.querySelector('.nav-item')?.click();
  pdf.save('GCON_SIAN_BI_Notas_Semana_' + state.activeWeek + '.pdf');
  if (btn) { btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg><span>Exportar PDF</span>'; btn.disabled = false; }
};

window.exportExcel = function() {
  if (!state.dados) return;
  var dataStr = state.dataAtual === 'd1' ? 'Segunda-feira' : state.dataAtual === 'd2' ? 'Terça-feira' : state.dataAtual === 'd3' ? 'Quarta-feira' : state.dataAtual === 'd4' ? 'Quinta-feira' : state.dataAtual === 'd5' ? 'Sexta-feira' : 'Total Acumulado';
  var dadosExport = [['GCON SIAN - Dashboard de Notas Recebidas - Semana ' + state.activeWeek], ['Visualizacao: ' + dataStr], []];
  dadosExport.push(['Empresa', 'Monitor', 'Pre-nota', 'Robo', 'Total (Monitor+Pre-nota)', '% Robo/Monitor']);
  var empresas = ['maas', 'hp', 'urbi_recanto', 'urbi_samambaia'];
  var nomes = ['MAAS', 'HP', 'URBI Recanto', 'URBI Samambaia'];
  empresas.forEach(function(key, idx) {
    var d = state.dados[key];
    if (!d) return;
    var pct = d.monitor > 0 ? ((d.robo / d.monitor) * 100).toFixed(1) + '%' : '\u2014';
    dadosExport.push([nomes[idx], d.monitor, d.prenota, d.robo, d.total, pct]);
  });
  dadosExport.push([], ['RESUMO']);
  dadosExport.push(['Dia da Semana', 'Total']);
  var days = ['d1', 'd2', 'd3', 'd4', 'd5'];
  var dayNames = ['Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'];
  var totalAcum = 0;
  days.forEach(function(d, i) {
    var val = getValorDiaContexto(state.dadosPorData, d, state.paginaAtual);
    dadosExport.push([dayNames[i], val]);
    totalAcum += val;
  });
  dadosExport.push(['TOTAL ACUMULADO', totalAcum]);
  var ws = XLSX.utils.aoa_to_sheet(dadosExport);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'GCON_SIAN');
  XLSX.writeFile(wb, 'GCON_SIAN_BI_Notas_Semana_' + state.activeWeek + '.xlsx');
  window.mostrarToast('Excel exportado!');
};
