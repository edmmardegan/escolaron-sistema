const API_BASE = 'http://localhost:8080';

// Função genérica para facilitar nossa vida
const request = async (endpoint, options = {}) => {
  const headers = { 'Content-Type': 'application/json' };
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || 'Erro na requisição');
  }

  // Se for DELETE ou status 204, não tenta converter pra JSON
  if (res.status === 204 || options.method === 'DELETE') return true;
  return res.json();
};

export const api = {
  // ALUNOS
  getAlunos: () => request('/alunos'),
  saveAluno: (aluno, id) =>
    request(id ? `/alunos/${id}` : '/alunos', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(aluno),
    }),
  deleteAluno: (id) => request(`/alunos/${id}`, { method: 'DELETE' }),

  // CURSOS
  getCursos: () => request('/cursos'),
  saveCurso: (curso, id) =>
    request(id ? `/cursos/${id}` : '/cursos', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(curso),
    }),
  deleteCurso: (id) => request(`/cursos/${id}`, { method: 'DELETE' }),

  // MATRÍCULAS
  getMatriculas: () => request('/matriculas'),
  saveMatricula: (dados, id) =>
    request(id ? `/matriculas/${id}` : '/matriculas', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(dados),
    }),
  deleteMatricula: (id) => request(`/matriculas/${id}`, { method: 'DELETE' }),
  updateNota: (termoId, nota) =>
    request(`/matriculas/termos/${termoId}`, {
      method: 'PUT',
      body: JSON.stringify({ nota }),
    }),

  // FINANCEIRO
  getFinanceiroGeral: (params) => request(`/financeiro?${params}`),
  getPorMatricula: (id) => request(`/financeiro/matricula/${id}`),
  gerarCarnet: (id, ano) =>
    request(`/financeiro/gerar/${id}`, {
      method: 'POST',
      body: JSON.stringify({ ano }),
    }),
  gerarMassivo: (ano) =>
    request(`/financeiro/gerar-massivo`, {
      method: 'POST',
      body: JSON.stringify({ ano }),
    }),
  pagar: (id) => request(`/financeiro/pagar/${id}`, { method: 'PATCH' }),
  estornar: (id) => request(`/financeiro/estornar/${id}`, { method: 'PATCH' }),
  deleteParcela: (id) => request(`/financeiro/${id}`, { method: 'DELETE' }),
};
