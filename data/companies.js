var COMPANIES = [
  {
    id: 'maas',
    nome: 'MAAS',
    slug: 'maas',
    cor: '#FF6B35',
    corBg: '#FFF0EB',
    responsavel: 'Jo\u00e3o Filipe Alves de Oliveira',
    responsaveis: [
      { id: 'responsavel1', nome: 'Jo\u00e3o Filipe Alves de Oliveira', cor: '#FF6B35', corBg: '#FFF0EB' },
      { id: 'responsavel2', nome: 'Elton Araujo Dantas', cor: '#1B1F5E', corBg: '#EEF0FA' }
    ]
  },
  {
    id: 'hp',
    nome: 'HP',
    slug: 'hp',
    cor: '#1B1F5E',
    corBg: '#EEF0FA',
    responsavel: 'Davi Buzolo Vales',
    responsaveis: [
      { id: 'responsavel1', nome: 'Davi Buzolo Vales', cor: '#1B1F5E', corBg: '#EEF0FA' }
    ]
  },
  {
    id: 'urbi_recanto',
    nome: 'URBI Recanto',
    slug: 'rec',
    cor: '#2E7D32',
    corBg: '#E8F5E9',
    responsavel: 'Luiz Felipe Souza Santos',
    responsaveis: [
      { id: 'responsavel1', nome: 'Luiz Felipe Souza Santos', cor: '#2E7D32', corBg: '#E8F5E9' }
    ]
  },
  {
    id: 'urbi_samambaia',
    nome: 'URBI Samambaia',
    slug: 'sam',
    cor: '#ED6C02',
    corBg: '#FFF3E0',
    responsavel: 'Joao Pedro Santos Leite',
    responsaveis: [
      { id: 'responsavel1', nome: 'Joao Pedro Santos Leite', cor: '#D97706', corBg: '#FFFBEB' }
    ]
  }
];

function getCompany(id) {
  return COMPANIES.find(function(c) { return c.id === id; }) || null;
}

function getCompanyResponsaveis(id) {
  var c = getCompany(id);
  return c ? c.responsaveis : [];
}

var PERSON_SHARES = {
  maas: { responsavel1: 0.5, responsavel2: 0.5 }
};

function setPersonShare(companyId, personId, share) {
  if (!PERSON_SHARES[companyId]) PERSON_SHARES[companyId] = {};
  PERSON_SHARES[companyId][personId] = share;
}

function getMaasPersonShare(personId) {
  if (personId === 'all') return 1;
  var shares = PERSON_SHARES['maas'] || {};
  return shares[personId] || 0.5;
}

function getPersonShare(companyId, personId) {
  if (personId === 'all') return 1;
  var shares = PERSON_SHARES[companyId] || {};
  return shares[personId] || 1;
}

function getCompanyPersonData(companyId, dados, personId) {
  var empresaData = dados && dados[companyId] ? dados[companyId] : { monitor: 0, prenota: 0, robo: 0, total: 0 };
  if (personId === 'all') return empresaData;
  var share = getPersonShare(companyId, personId);
  return {
    monitor: Math.round(empresaData.monitor * share),
    prenota: Math.round(empresaData.prenota * share),
    robo: Math.round(empresaData.robo * share),
    total: Math.round(empresaData.total * share)
  };
}

function getCompanyResumo(companyId, dados) {
  var d = dados && dados[companyId] ? dados[companyId] : { monitor: 0, prenota: 0, robo: 0, total: 0 };
  return {
    total: d.total,
    monitor: d.monitor,
    prenota: d.prenota,
    robo: d.robo,
    pctRoboMon: d.monitor > 0 ? (d.robo / d.monitor * 100).toFixed(1) : 0,
    pctPrenota: d.total > 0 ? (d.prenota / d.total * 100).toFixed(1) : 0
  };
}

/* Full-year accumulation for MAAS person views */
var _fullYearData = null;

function getFullYearData() {
  if (_fullYearData) return _fullYearData;
  var reg = DATA_REGISTRY[2026];
  var sum = {};
  COMPANIES.forEach(function(emp) {
    sum[emp.id] = { monitor: 0, prenota: 0, robo: 0, total: 0 };
    if (emp.responsaveis) {
      emp.responsaveis.forEach(function(p) { sum[emp.id][p.id] = { monitor: 0, prenota: 0, robo: 0, total: 0 }; });
    }
  });
  for (var mk in reg) {
    if (!reg.hasOwnProperty(mk)) continue;
    var mData = reg[mk];
    for (var wn in mData.weeks) {
      if (!mData.weeks.hasOwnProperty(wn)) continue;
      var week = mData.weeks[wn];
      for (var dk in week.data) {
        if (week.data.hasOwnProperty(dk)) {
          var dayData = week.data[dk];
          COMPANIES.forEach(function(emp) {
            var dd = dayData[emp.id];
            if (dd) {
              sum[emp.id].monitor += dd.monitor;
              sum[emp.id].prenota += dd.prenota;
              sum[emp.id].robo += dd.robo;
              sum[emp.id].total += dd.total;
              if (emp.responsaveis) {
                emp.responsaveis.forEach(function(p) {
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
  _fullYearData = sum;
  return sum;
}

function getDadosMaasPorPessoaFullYear(personId) {
  var full = getFullYearData();
  return getDadosMaasPorPessoa(full, personId);
}
