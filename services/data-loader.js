var dataLoader = (function() {
  var _db = null;
  var _raw = null;

  function _filtrar(json, allowedIds) {
    if (!json || !json[2026]) return json;
    if (!allowedIds || allowedIds === 'all') return json;

    var filtrado = { 2026: {} };
    var anos = Object.keys(json);
    anos.forEach(function(ano) {
      filtrado[ano] = {};
      var meses = Object.keys(json[ano]);
      meses.forEach(function(mes) {
        var mData = json[ano][mes];
        filtrado[ano][mes] = {
          month: mData.month,
          monthNum: mData.monthNum,
          year: mData.year,
          weeks: {}
        };
        var weeks = Object.keys(mData.weeks);
        weeks.forEach(function(wn) {
          var week = mData.weeks[wn];
          filtrado[ano][mes].weeks[wn] = {
            calendar: week.calendar,
            data: {}
          };
          var dias = Object.keys(week.data);
          dias.forEach(function(dk) {
            filtrado[ano][mes].weeks[wn].data[dk] = {};
            allowedIds.forEach(function(empId) {
              if (week.data[dk][empId]) {
                filtrado[ano][mes].weeks[wn].data[dk][empId] = week.data[dk][empId];
              }
            });
          });
        });
      });
    });
    return filtrado;
  }

  return {
    load: function(callback) {
      fetch('data/dados.json')
        .then(function(r) {
          if (!r.ok) throw new Error('Erro ao carregar dados: ' + r.status);
          return r.json();
        })
        .then(function(json) {
          _raw = json;
          var permitidas = state.user ? state.user.allowedCompanies : null;
          _db = _filtrar(json, permitidas);
          callback(null, _db);
        })
        .catch(function(err) {
          callback(err);
        });
    },

    getRegistry: function() {
      if (!state || !state.isAuthenticated) return null;
      return _db;
    },

    reload: function(callback) {
      if (!_raw) {
        this.load(callback);
        return;
      }
      var permitidas = state.user ? state.user.allowedCompanies : null;
      _db = _filtrar(_raw, permitidas);
      callback(null, _db);
    },

    getAno: function(ano) {
      var reg = this.getRegistry();
      return reg ? reg[ano] : null;
    }
  };
})();
