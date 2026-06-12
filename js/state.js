var state = {
  paginaAtual: 'geral',
  dados: null,
  dadosCompletos: null,
  maasPersona: 'all',
  user: null,
  isAuthenticated: false
};

function setPaginaAtual(p) { state.paginaAtual = p; }
function setMaasPersona(p) { state.maasPersona = p; }
function getMaasPersona() { return state.maasPersona || 'all'; }
