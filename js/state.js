var state = {
  paginaAtual: 'geral',
  dados: null,
  maasPersona: 'all'
};

function setPaginaAtual(p) { state.paginaAtual = p; }
function setMaasPersona(p) { state.maasPersona = p; }
function getMaasPersona() { return state.maasPersona || 'all'; }
