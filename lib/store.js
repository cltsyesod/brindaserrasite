// lib/store.js
// Armazenamento em memória resiliente e sincronização compartilhada entre Serverless Functions

const store = {
  overrides: {},
  exclusoes: {
    vendedores: [],
    cervejarias: [],
    leads: [],
    hoteis: [],
    cards: []
  },
  leads: [],
  vendedores: [],
  cervejarias: [],
  hoteis: [
    { id: 1, nome: 'Hotel Casa da Montanha', cidade: 'Gramado', endereco: 'Av. Borges de Medeiros, 3166 - Gramado', tel: '(54) 3286-5000', resp: 'Concierge Chefe', status: 'ativo' },
    { id: 2, nome: 'Hotel Alpestre', cidade: 'Gramado', endereco: 'Rua Ceará, 94 - Bairro Planalto - Gramado', tel: '(54) 3286-3555', resp: 'Recepção Executiva', status: 'ativo' },
    { id: 3, nome: 'Grande Hotel Canela', cidade: 'Canela', endereco: 'Rua Getúlio Vargas, 300 - Canela', tel: '(54) 3282-1285', resp: 'Gerência de Atendimento', status: 'ativo' },
    { id: 4, nome: 'Villa Bella Hotel & Spa', cidade: 'Gramado', endereco: 'Rua Villa Bella, 125 - Gramado', tel: '(54) 3295-8100', resp: 'Equipe de Hospedagem', status: 'ativo' },
    { id: 5, nome: 'Hotel Ritta Höppner', cidade: 'Gramado', endereco: 'Rua Pedro Candiago, 305 - Gramado', tel: '(54) 3286-1334', resp: 'Concierge', status: 'ativo' },
    { id: 6, nome: 'Hotel Laghetto Stilo', cidade: 'Gramado', endereco: 'Rua Borges de Medeiros, 2083 - Gramado', tel: '(54) 3421-8191', resp: 'Recepção', status: 'ativo' },
    { id: 7, nome: 'Pousada Blumenberg', cidade: 'Canela', endereco: 'Rua Borges de Medeiros, 499 - Canela', tel: '(54) 3282-2806', resp: 'Atendimento', status: 'ativo' }
  ]
};

function normalizeKey(str) {
  return String(str || '').toLowerCase().trim();
}

function isExcluido(tipo, key) {
  const list = store.exclusoes[tipo] || [];
  return list.includes(normalizeKey(key));
}

function getEffectiveStatus(tipo, key, defaultStatus = 'ativo') {
  const k = normalizeKey(key);
  if (isExcluido(tipo, k)) return 'excluido';
  return store.overrides[k] || defaultStatus;
}

function setOverride(key, status) {
  store.overrides[normalizeKey(key)] = status;
}

function addExclusao(tipo, key) {
  const k = normalizeKey(key);
  if (!store.exclusoes[tipo]) store.exclusoes[tipo] = [];
  if (!store.exclusoes[tipo].includes(k)) store.exclusoes[tipo].push(k);
}

function addLead(lead) {
  store.leads.unshift(lead);
}

function addVendedor(vendedor) {
  store.vendedores.unshift(vendedor);
}

function addCervejaria(cervejaria) {
  store.cervejarias.unshift(cervejaria);
}

function addHotel(hotel) {
  store.hoteis.unshift(hotel);
}

module.exports = {
  store,
  normalizeKey,
  isExcluido,
  getEffectiveStatus,
  setOverride,
  addExclusao,
  addLead,
  addVendedor,
  addCervejaria,
  addHotel
};
