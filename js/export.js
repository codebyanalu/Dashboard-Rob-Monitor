window.exportPDF = async function() {
  var btn = document.querySelector('.btn-primary:not(.btn-success)');
  if (btn) { btn.innerHTML = '<span>Gerando PDF...</span>'; btn.disabled = true; }
  var pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
  var pageIds = ['geral', 'hp', 'urbi_recanto', 'urbi_samambaia', 'maas'];
  var titles = ['Vis\u00e3o Geral', 'HP', 'URBI Recanto', 'URBI Samambaia', 'MAAS'];

  for (var i = 0; i < pageIds.length; i++) {
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    document.getElementById(pageIds[i]).classList.add('active');
    document.getElementById('page-title').textContent = titles[i];
    await new Promise(function(r) { return setTimeout(r, 300); });
    var canvas = await html2canvas(document.querySelector('.content'), { scale: 1.5, useCORS: true, backgroundColor: '#F8FAFC' });
    var img = canvas.toDataURL('image/jpeg', 0.92);
    var w = 210, h = (canvas.height * w) / canvas.width;
    if (i > 0) pdf.addPage();
    pdf.addImage(img, 'JPEG', 0, 0, w, Math.min(h, 297));
  }

  document.querySelector('.nav-item')?.click();
  var rangeStr = selectedDateStr ? selectedDateStr.replace(/[\/\s\u2013-]+/g, '_') : 'geral';
  pdf.save('GCON_SIAN_BI_Notas_' + rangeStr + '.pdf');
  if (btn) { btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg><span>Exportar PDF</span>'; btn.disabled = false; }
};

function esc(v) { return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function buildExcelHtml() {
  var periodLabel = selectedDateStr || 'Per\u00edodo selecionado';
  var now = new Date();
  var dateStr = pad(now.getDate()) + '/' + pad(now.getMonth()+1) + '/' + now.getFullYear() + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());

  var c = {
    navy: '#1B1F5E', navyLight: '#EEF0FA',
    green: '#2E7D32', greenLight: '#E8F5E9',
    amber: '#ED6C02', amberLight: '#FFF3E0',
    orange: '#FF6B35', orangeLight: '#FFF0EB',
    gray900: '#0F172A', gray700: '#334155', gray500: '#64748B', gray400: '#94A3B8', gray200: '#E2E8F0', gray100: '#F1F5F9', gray50: '#F8FAFC',
    white: '#FFFFFF'
  };

  var h = '<html><head><meta charset="utf-8"><style>' +
    'body{font-family:Calibri,sans-serif;padding:20px;color:' + c.gray900 + '}' +
    'table{border-collapse:collapse;width:100%;margin-bottom:20px;font-size:11pt}' +
    'th{padding:8px 10px;text-align:left;font-size:10pt;font-weight:600;letter-spacing:0.03em}' +
    'td{padding:7px 10px;border:1px solid ' + c.gray200 + ';font-size:11pt}' +
    '.title{font-size:18pt;font-weight:700;color:' + c.navy + ';margin:0 0 2px}' +
    '.sub{font-size:10pt;color:' + c.gray500 + ';margin:0 0 2px}' +
    '.section{font-size:12pt;font-weight:700;color:' + c.white + ';background:' + c.navy + ';padding:8px 12px;margin:16px 0 8px;border-radius:4px}' +
    '.th-emp{background:' + c.navy + ';color:' + c.white + ';border:1px solid ' + c.navy + '}' +
    '.th-green{background:' + c.green + ';color:' + c.white + ';border:1px solid ' + c.green + '}' +
    '.th-amber{background:' + c.amber + ';color:' + c.white + ';border:1px solid ' + c.amber + '}' +
    '.th-orange{background:' + c.orange + ';color:' + c.white + ';border:1px solid ' + c.orange + '}' +
    '.tr-total td{font-weight:700;background:' + c.gray100 + ';border-top:2px solid ' + c.gray400 + '}' +
    '.tr-even td{background:' + c.gray50 + '}' +
    '.num{text-align:right;font-variant-numeric:tabular-nums}' +
    '.tag{display:inline-block;padding:1px 8px;border-radius:10px;font-size:9pt;font-weight:600}' +
    '.tag-green{background:' + c.greenLight + ';color:' + c.green + '}' +
    '.tag-amber{background:' + c.amberLight + ';color:' + c.amber + '}' +
    '.tag-orange{background:' + c.orangeLight + ';color:' + c.orange + '}' +
    '.tag-navy{background:' + c.navyLight + ';color:' + c.navy + '}' +
    '.person-table td:first-child{font-weight:600}' +
    '</style></head><body>';

  h += '<p class="title">GCON SIAN &mdash; Dashboard de Notas Recebidas</p>';
  h += '<p class="sub">Per\u00edodo: ' + esc(periodLabel) + '</p>';
  h += '<p class="sub">Exportado em: ' + esc(dateStr) + '</p>';
  h += '<hr style="border:none;border-top:2px solid ' + c.navy + ';margin:12px 0 20px">';

  /* === SECTION 1: RESUMO POR EMPRESA === */
  h += '<p class="section">\u00a0\u00a0RESUMO POR EMPRESA</p>';
  h += '<table><thead><tr>' +
    '<th class="th-emp">Empresa</th>' +
    '<th class="th-emp num">Total</th>' +
    '<th class="th-green num">Monitor</th>' +
    '<th class="th-amber num">Pr\u00e9-nota</th>' +
    '<th class="th-orange num">Rob\u00f4</th>' +
    '<th class="th-emp num">% Rob\u00f4/Mon</th>' +
    '<th class="th-emp">Respons\u00e1vel</th>' +
  '</tr></thead><tbody>';

  var empresas = ['maas', 'hp', 'urbi_recanto', 'urbi_samambaia'];
  var nomes = ['MAAS', 'HP', 'URBI Recanto', 'URBI Samambaia'];
  var totalGeral = 0, totalMon = 0, totalPre = 0, totalRob = 0;

  empresas.forEach(function(key, idx) {
    var d = state.dados && state.dados[key];
    if (!d) return;
    totalGeral += d.total; totalMon += d.monitor; totalPre += d.prenota; totalRob += d.robo;
    var pct = d.monitor > 0 ? ((d.robo / d.monitor) * 100).toFixed(1) + '%' : '\u2014';
    var cObj = getCompany(key);
    var resp = cObj ? cObj.responsavel : '\u2014';
    var rowClass = idx % 2 === 1 ? ' class="tr-even"' : '';
    h += '<tr' + rowClass + '>' +
      '<td><strong>' + esc(nomes[idx]) + '</strong></td>' +
      '<td class="num">' + d.total + '</td>' +
      '<td class="num">' + d.monitor + '</td>' +
      '<td class="num">' + d.prenota + '</td>' +
      '<td class="num">' + d.robo + '</td>' +
      '<td class="num">' + pct + '</td>' +
      '<td>' + esc(resp) + '</td>' +
    '</tr>';
  });

  var totalPct = totalMon > 0 ? ((totalRob / totalMon) * 100).toFixed(1) + '%' : '\u2014';
  h += '<tr class="tr-total">' +
    '<td><strong>TOTAL GERAL</strong></td>' +
    '<td class="num"><strong>' + totalGeral + '</strong></td>' +
    '<td class="num"><strong>' + totalMon + '</strong></td>' +
    '<td class="num"><strong>' + totalPre + '</strong></td>' +
    '<td class="num"><strong>' + totalRob + '</strong></td>' +
    '<td class="num"><strong>' + totalPct + '</strong></td>' +
    '<td></td>' +
  '</tr></tbody></table>';

  /* === SECTION 2: EFICIÊNCIA === */
  var effRobo = totalMon > 0 ? (totalRob / totalMon * 100).toFixed(1) : 0;
  var pctPrenotaGeral = totalGeral > 0 ? (totalPre / totalGeral * 100).toFixed(1) : 0;
  var naoEscriturado = Math.max(0, totalMon - totalRob);

  h += '<table>' +
    '<tr><td style="width:220px;border:none;font-weight:600">Efici\u00eancia do Rob\u00f4</td><td class="num" style="border:none;font-size:14pt;font-weight:700;color:' + c.navy + '">' + effRobo + '%</td>' +
    '<td style="width:220px;border:none;font-weight:600">Pr\u00e9-nota sobre Total</td><td class="num" style="border:none;font-size:14pt;font-weight:700;color:' + c.amber + '">' + pctPrenotaGeral + '%</td></tr>' +
    '<tr><td style="border:none;font-weight:600">N\u00e3o Escrituradas</td><td class="num" style="border:none;font-size:14pt;font-weight:700;color:' + c.navy + '">' + naoEscriturado + '</td>' +
    '<td style="border:none;font-weight:600">Total de Notas</td><td class="num" style="border:none;font-size:14pt;font-weight:700;color:' + c.green + '">' + totalGeral + '</td></tr>' +
  '</table>';

  /* === SECTION 3: DETALHAMENTO POR EMPRESA === */
  h += '<p class="section">\u00a0\u00a0DETALHAMENTO POR EMPRESA</p>';

  empresas.forEach(function(key, idx) {
    var d = state.dados && state.dados[key];
    if (!d) return;
    var cObj = getCompany(key);
    var respName = cObj ? cObj.responsavel : '\u2014';
    var pctR = d.monitor > 0 ? ((d.robo / d.monitor) * 100).toFixed(1) : 0;
    var pctP = d.total > 0 ? ((d.prenota / d.total) * 100).toFixed(1) : 0;
    var naoE = Math.max(0, d.monitor - d.robo);

    var colors = [
      { bg: c.navyLight, text: c.navy, label: 'Total' },
      { bg: c.greenLight, text: c.green, label: 'Monitor' },
      { bg: c.amberLight, text: c.amber, label: 'Pr\u00e9-nota' },
      { bg: c.orangeLight, text: c.orange, label: 'Rob\u00f4' }
    ];

    h += '<table><thead><tr>' +
      '<th class="th-emp" colspan="6">' + esc(nomes[idx]) + ' &mdash; Resp.: ' + esc(respName) + '</th>' +
    '</tr></thead><tbody>' +
    '<tr>' +
      colors.map(function(clr) {
        var val = clr.label === 'Total' ? d.total : clr.label === 'Monitor' ? d.monitor : clr.label === 'Pr\u00e9-nota' ? d.prenota : d.robo;
        return '<td style="background:' + clr.bg + ';text-align:center;border:1px solid ' + clr.bg + '">' +
          '<div style="font-size:9pt;color:' + clr.text + ';font-weight:600">' + clr.label + '</div>' +
          '<div style="font-size:16pt;font-weight:700;color:' + clr.text + '">' + val + '</div></td>';
      }).join('') +
      '<td style="background:' + c.gray50 + ';text-align:center">' +
        '<div style="font-size:9pt;color:' + c.gray500 + ';font-weight:600">% Rob\u00f4/Mon</div>' +
        '<div style="font-size:16pt;font-weight:700;color:' + c.orange + '">' + pctR + '%</div></td>' +
      '<td style="background:' + c.gray50 + ';text-align:center">' +
        '<div style="font-size:9pt;color:' + c.gray500 + ';font-weight:600">% Pr\u00e9-nota</div>' +
        '<div style="font-size:16pt;font-weight:700;color:' + c.amber + '">' + pctP + '%</div></td>' +
    '</tr></tbody></table>';

    /* Responsáveis desta empresa */
    var resps = cObj ? cObj.responsaveis || [] : [];
    if (resps.length > 0) {
      h += '<table class="person-table" style="margin-top:-12px"><thead><tr>' +
        '<th class="th-emp" style="width:160px">Pessoa</th>' +
        '<th class="th-green num">Monitor</th>' +
        '<th class="th-amber num">Pr\u00e9-nota</th>' +
        '<th class="th-orange num">Rob\u00f4</th>' +
        '<th class="th-emp num">Total</th>' +
        '<th class="th-emp num">% Efici\u00eancia</th>' +
      '</tr></thead><tbody>';
      resps.forEach(function(p, pi) {
        var pd = key === 'maas' ? getDadosMaasPorPessoa(state.dados, p.id) : getCompanyPersonData(key, state.dados, p.id);
        var eff = pd.monitor > 0 ? ((pd.robo / pd.monitor) * 100).toFixed(1) + '%' : '\u2014';
        var rowC = pi % 2 === 1 ? ' class="tr-even"' : '';
        h += '<tr' + rowC + '>' +
          '<td style="color:' + p.cor + ';font-weight:600">' + esc(p.nome) + '</td>' +
          '<td class="num">' + pd.monitor + '</td>' +
          '<td class="num">' + pd.prenota + '</td>' +
          '<td class="num">' + pd.robo + '</td>' +
          '<td class="num">' + pd.total + '</td>' +
          '<td class="num">' + eff + '</td>' +
        '</tr>';
      });
      h += '</tbody></table>';
    }
    h += '<div style="height:4px"></div>';
  });

  /* === SECTION 4: COMPOSIÇÃO GERAL === */
  h += '<p class="section">\u00a0\u00a0COMPOSI\u00c7\u00c3O GERAL</p>';
  h += '<table><thead><tr>' +
    '<th class="th-emp">Categoria</th>' +
    '<th class="th-emp num">Quantidade</th>' +
    '<th class="th-emp num">% do Total</th>' +
  '</tr></thead><tbody>' +
    '<tr><td>Escriturado pelo Rob\u00f4</td><td class="num">' + totalRob + '</td><td class="num">' + (totalGeral > 0 ? (totalRob / totalGeral * 100).toFixed(1) : 0) + '%</td></tr>' +
    '<tr class="tr-even"><td>N\u00e3o Escrituradas</td><td class="num">' + naoEscriturado + '</td><td class="num">' + (totalGeral > 0 ? (naoEscriturado / totalGeral * 100).toFixed(1) : 0) + '%</td></tr>' +
    '<tr><td>Recebidas pela Pr\u00e9-nota</td><td class="num">' + totalPre + '</td><td class="num">' + (totalGeral > 0 ? (totalPre / totalGeral * 100).toFixed(1) : 0) + '%</td></tr>' +
    '<tr class="tr-total"><td><strong>TOTAL</strong></td><td class="num"><strong>' + totalGeral + '</strong></td><td class="num"><strong>100%</strong></td></tr>' +
  '</tbody></table>';

  /* Footer */
  h += '<hr style="border:none;border-top:1px solid ' + c.gray200 + ';margin-top:20px">';
  h += '<p style="font-size:9pt;color:' + c.gray400 + '">GCON SIAN &mdash; Sistema de Intelig\u00eancia de Neg\u00f3cios &mdash; Dados operacionais exportados em ' + esc(dateStr) + '</p>';

  h += '</body></html>';
  return h;
}

/* ── XLSX PARSER: spreadsheet model ── */
function parseXLSXtoState(rows) {
  var EMP_MAP = [
    { test: 'hp', id: 'hp' },
    { test: 'urbirecanto', id: 'urbi_recanto' },
    { test: 'urbisamambaia', id: 'urbi_samambaia' },
    { test: 'maas', id: 'maas' }
  ];
  var result = {};
  var empIds = ['hp', 'urbi_recanto', 'urbi_samambaia', 'maas'];
  empIds.forEach(function(id) {
    result[id] = { monitor: 0, prenota: 0, robo: 0, total: 0, responsavel1: { monitor: 0, prenota: 0, robo: 0, total: 0 } };
  });
  result.maas.responsavel2 = { monitor: 0, prenota: 0, robo: 0, total: 0 };

  var currentEmp = null, pendingCatKey = null;

  function detectCompany(text) {
    if (!text) return null;
    var clean = text.toLowerCase().replace(/[-_\s]/g, '');
    for (var i = 0; i < EMP_MAP.length; i++) {
      if (clean.indexOf(EMP_MAP[i].test) !== -1) return EMP_MAP[i].id;
    }
    return null;
  }

  function detectCategory(text) {
    if (!text) return null;
    var t = text.toLowerCase();
    if (t.indexOf('recebidas pelo monitor') !== -1) return 'monitor';
    if (t.indexOf('pré-nota') !== -1 || t.indexOf('pre-nota') !== -1) return 'prenota';
    if (t.indexOf('escrituradas pelo robô') !== -1 || t.indexOf('escrituradas pelo') !== -1) return 'robo';
    if (t === 'total') return 'total';
    return null;
  }

  function detectPerson(text, empId) {
    if (!text) return null;
    var t = text.toLowerCase().replace(/[\s.-]/g, '');
    if (t.indexOf('davi') !== -1) return 'responsavel1';
    if (t.indexOf('luiz') !== -1 || t.indexOf('luiiz') !== -1) return 'responsavel1';
    if (t.indexOf('joao') !== -1 && empId === 'maas') return 'responsavel1';
    if (t.indexOf('joao') !== -1) return 'responsavel1';
    if (t.indexOf('elton') !== -1) return 'responsavel2';
    if (t.indexOf('leite') !== -1) return 'responsavel1';
    return null;
  }

  function extractNums(row, startIdx) {
    var nums = [];
    for (var i = startIdx; i < row.length; i++) {
      var v = row[i];
      if (v === undefined || v === null || v === '') continue;
      var str = String(v).trim();
      if (str === '' || str.toLowerCase() === 'side') continue;
      var num = Number(v);
      if (!isNaN(num)) nums.push(num);
    }
    return nums;
  }

  rows.forEach(function(r) {
    if (!r || r.length < 2) return;
    var c0 = String(r[0] || '').trim();
    var c1 = String(r[1] || '').trim();
    var c2 = String(r[2] || '').trim();

    if (c0 === 'Descrição') {
      pendingCatKey = null;
      return;
    }

    var emp = detectCompany(c0 || c1);
    if (emp) { currentEmp = emp; pendingCatKey = null; return; }

    if (!currentEmp) return;

    var cat = detectCategory(c1);
    if (cat) {
      pendingCatKey = cat;
      var nums = extractNums(r, 2);
      nums.forEach(function(v) { result[currentEmp][cat] += v; });
      return;
    }

    var pKey = detectPerson(c0 || c1 || c2, currentEmp);
    if (pKey && result[currentEmp][pKey] && pendingCatKey) {
      var pNums = extractNums(r, 2);
      pNums.forEach(function(v) { result[currentEmp][pKey][pendingCatKey] += v; });
    }
  });

  empIds.forEach(function(emp) {
    var d = result[emp];
    d.total = d.monitor + d.prenota;
    for (var pk in d) {
      if (pk !== 'monitor' && pk !== 'prenota' && pk !== 'robo' && pk !== 'total') {
        d[pk].total = d[pk].monitor + d[pk].prenota;
      }
    }
  });
  return result;
}

window.importDataFromFile = function(input) {
  if (!input || !input.files || !input.files[0]) return;
  var file = input.files[0];
  var ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'json') {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var data = JSON.parse(e.target.result);
        if (!data || typeof data !== 'object') { mostrarToast('JSON inválido'); return; }
        state.dadosCompletos = data;
        filtrarDadosPorPermissao();
        atualizarDashboardCompleto();
        mostrarToast('Dados importados de: ' + file.name);
      } catch(err) {
        mostrarToast('Erro ao ler JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  } else if (ext === 'xlsx' || ext === 'xls') {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var wb = XLSX.read(e.target.result, { type: 'array' });
        var ws = wb.Sheets[wb.SheetNames[0]];
        var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        var data = parseXLSXtoState(rows);
        if (!data) { mostrarToast('Não foi possível interpretar a planilha'); return; }
        state.dadosCompletos = data;
        filtrarDadosPorPermissao();
        atualizarDashboardCompleto();
        mostrarToast('Dados importados de: ' + file.name);
      } catch(err) {
        mostrarToast('Erro ao ler XLSX: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    mostrarToast('Formato não suportado. Use .json ou .xlsx');
  }
  input.value = '';
};
window.exportExcel = function() {
  if (!state.dados) { mostrarToast('Nenhum dado carregado'); return; }

  var html = buildExcelHtml();
  var blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  var rangeStr = selectedDateStr ? selectedDateStr.replace(/[\/\s\u2013-]+/g, '_') : 'geral';
  var link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'GCON_SIAN_BI_Notas_' + rangeStr + '.xls';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
  mostrarToast('Excel exportado com estilo!');
};
