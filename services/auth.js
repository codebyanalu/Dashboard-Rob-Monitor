function sha256(str) {
  var buffer = new TextEncoder().encode(str);
  return crypto.subtle.digest('SHA-256', buffer).then(function(hash) {
    var hex = '';
    var bytes = new Uint8Array(hash);
    for (var i = 0; i < bytes.length; i++) {
      hex += ('00' + bytes[i].toString(16)).slice(-2);
    }
    return hex;
  });
}

window.handleLogin = function() {
  var email = document.getElementById('login-email').value.trim().toLowerCase();
  var password = document.getElementById('login-password').value;
  var btn = document.getElementById('login-btn');
  var errorEl = document.getElementById('login-error');

  errorEl.classList.remove('visible');
  errorEl.textContent = '';

  if (!email || !password) {
    errorEl.textContent = 'Preencha todos os campos';
    errorEl.classList.add('visible');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errorEl.textContent = 'Formato de e-mail inválido';
    errorEl.classList.add('visible');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="login-spinner"></span>Entrando...';

  var userPerm = USERS_PERMISSIONS[email];
  if (!userPerm) {
    btn.disabled = false;
    btn.innerHTML = 'Entrar';
    errorEl.textContent = 'Usuário não encontrado';
    errorEl.classList.add('visible');
    return;
  }

  sha256(password).then(function(hash) {
    btn.disabled = false;
    btn.innerHTML = 'Entrar';

    if (hash !== userPerm.passwordHash) {
      errorEl.textContent = 'Senha incorreta';
      errorEl.classList.add('visible');
      return;
    }

    state.user = {
      email: email,
      name: userPerm.name,
      role: userPerm.role,
      allowedCompanies: userPerm.allowedCompanies
    };
    state.isAuthenticated = true;

    try {
      localStorage.setItem('gcon_sian_session', JSON.stringify({
        email: email,
        name: userPerm.name,
        role: userPerm.role,
        allowedCompanies: userPerm.allowedCompanies,
        expires: Date.now() + 8 * 60 * 60 * 1000
      }));
    } catch(e) {}

    document.getElementById('login-overlay').classList.add('hidden');
    atualizarTopbarUsuario();
    initDashboard();
    mostrarToast('Bem-vindo, ' + state.user.name.split(' ')[0] + '!');
  }).catch(function() {
    btn.disabled = false;
    btn.innerHTML = 'Entrar';
    errorEl.textContent = 'Erro ao processar login';
    errorEl.classList.add('visible');
  });
};

window.loginFormSubmit = function(e) {
  e.preventDefault();
  handleLogin();
  return false;
};

var authService = {
  checkSession: function() {
    try {
      var saved = localStorage.getItem('gcon_sian_session');
      if (!saved) return null;
      var session = JSON.parse(saved);
      if (Date.now() > session.expires) {
        localStorage.removeItem('gcon_sian_session');
        return null;
      }
      return session;
    } catch(e) {
      return null;
    }
  },

  validarSessao: function() {
    if (!state.isAuthenticated || !state.user) return false;
    try {
      var saved = localStorage.getItem('gcon_sian_session');
      if (!saved) return false;
      var session = JSON.parse(saved);
      if (Date.now() > session.expires) {
        localStorage.removeItem('gcon_sian_session');
        return false;
      }
      if (session.email !== state.user.email) return false;
      return true;
    } catch(e) {
      return false;
    }
  },

  logout: function(callback) {
    try { localStorage.removeItem('gcon_sian_session'); } catch(e) {}
    state.isAuthenticated = false;
    state.user = null;
    if (callback) callback(null);
  }
};

(function() {
  var originalLog = console.log;
  console.log = function() {
    if (arguments.length > 0 && typeof arguments[0] === 'string' &&
        (arguments[0].indexOf('state') !== -1 || arguments[0].indexOf('DATA_REGISTRY') !== -1 ||
         arguments[0].indexOf('USERS_PERMISSIONS') !== -1)) {
      return;
    }
    return originalLog.apply(console, arguments);
  };

  var originalDir = console.dir;
  console.dir = function() {
    if (arguments.length > 0 && arguments[0] &&
        (arguments[0] === state || arguments[0] === window.DATA_REGISTRY ||
         arguments[0] === window.USERS_PERMISSIONS)) {
      console.log('%cAcesso restrito: dados protegidos por sessão', 'color:#DC2626;font-weight:bold');
      return;
    }
    return originalDir.apply(console, arguments);
  };
})();
