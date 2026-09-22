// Elementos da interface
const telaLogin = document.getElementById('tela-login');
const telaConsulta = document.getElementById('tela-consulta');
const formLogin = document.getElementById('form-login');
const mensagemErroLogin = document.getElementById('mensagem-erro-login');
const btnSair = document.getElementById('btn-sair');
const btnBuscar = document.getElementById('btn-buscar');
const corpoTabela = document.getElementById('corpo-tabela');
const cabecalhosOrdenaveis = document.querySelectorAll('#tabela-resultados th[data-campo]');

// Guarda o último resultado buscado, para reordenar sem nova consulta ao servidor
let itensAtuais = [];
let ordenacaoAtual = { campo: 'estoque_fisico', direcao: 'desc' };

// Verifica se já existe token salvo ao abrir a página
window.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token_loja');
  if (token) {
    exibir_tela_consulta();
  }
});

// Evento de Login
formLogin.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mensagemErroLogin.textContent = '';

  const usuario = document.getElementById('usuario').value;
  const senha = document.getElementById('senha').value;

  try {
    const resposta = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      localStorage.setItem('token_loja', dados.token);
      exibir_tela_consulta();
    } else {
      mensagemErroLogin.textContent = dados.detail || 'erro ao realizar login.';
    }
  } catch (erro) {
    mensagemErroLogin.textContent = 'erro de conexão com o servidor.';
  }
});

// Evento de Logout (Sair)
btnSair.addEventListener('click', () => {
  localStorage.removeItem('token_loja');
  telaConsulta.classList.add('escondido');
  telaLogin.classList.remove('escondido');
});

// Evento de Pesquisa no Estoque
btnBuscar.addEventListener('click', async () => {
  const token = localStorage.getItem('token_loja');
  if (!token) {
    alert('sessão expirada. faça login novamente.');
    btnSair.click();
    return;
  }

  const codigo = document.getElementById('filtro-codigo').value;
  const nome = document.getElementById('filtro-nome').value;
  const estrutura = document.getElementById('filtro-estrutura').value;
  const limite = document.getElementById('filtro-limite').value || 50.0;

  // Monta a URL com os parâmetros preenchidos
  const parametros = new URLSearchParams();
  parametros.append('limite', limite);
  if (codigo) parametros.append('codigo', codigo);
  if (nome) parametros.append('nome', nome);
  if (estrutura) parametros.append('estrutura', estrutura);

  corpoTabela.innerHTML = '<tr><td colspan="5" class="texto-vazio">Buscando dados no banco de dados...</td></tr>';

  try {
    const resposta = await fetch(`/api/estoque?${parametros.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      itensAtuais = dados.itens || [];
      ordenar_e_renderizar();
    } else {
      itensAtuais = [];
      corpoTabela.innerHTML = `<tr><td colspan="5" class="texto-vazio">${dados.detail || 'nenhum item encontrado.'}</td></tr>`;
    }
  } catch (erro) {
    itensAtuais = [];
    corpoTabela.innerHTML = '<tr><td colspan="5" class="texto-vazio">erro ao comunicar com o servidor.</td></tr>';
  }
});

// Clique (ou Enter/Espaço) em um cabeçalho ordena a tabela por aquela coluna
cabecalhosOrdenaveis.forEach((cabecalho) => {
  cabecalho.addEventListener('click', () => {
    ordenar_por_campo(cabecalho.dataset.campo);
  });
  cabecalho.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      ordenar_por_campo(cabecalho.dataset.campo);
    }
  });
});

// Define o campo de ordenação; se já era esse campo, inverte a direção
function ordenar_por_campo(campo) {
  if (ordenacaoAtual.campo === campo) {
    ordenacaoAtual.direcao = ordenacaoAtual.direcao === 'asc' ? 'desc' : 'asc';
  } else {
    const direcaoInicial = (campo === 'preco_venda' || campo === 'estoque_fisico') ? 'desc' : 'asc';
    ordenacaoAtual = { campo, direcao: direcaoInicial };
  }
  ordenar_e_renderizar();
}

// Ordena itensAtuais conforme ordenacaoAtual e redesenha a tabela
function ordenar_e_renderizar() {
  const { campo, direcao } = ordenacaoAtual;

  const itensOrdenados = [...itensAtuais].sort((a, b) => {
    const valorA = obter_valor_ordenacao(a, campo);
    const valorB = obter_valor_ordenacao(b, campo);
    if (valorA < valorB) return direcao === 'asc' ? -1 : 1;
    if (valorA > valorB) return direcao === 'asc' ? 1 : -1;
    return 0;
  });

  preencher_tabela(itensOrdenados);
  atualizar_indicadores_ordenacao();
}

// Extrai o valor de comparação certo pra cada tipo de coluna
function obter_valor_ordenacao(item, campo) {
  if (campo === 'preco_venda' || campo === 'estoque_fisico') {
    return parseFloat(item[campo]) || 0;
  }
  return (item[campo] || '').toString().toLowerCase();
}

// Marca visualmente qual coluna está ordenando, e em qual direção
function atualizar_indicadores_ordenacao() {
  cabecalhosOrdenaveis.forEach((cabecalho) => {
    cabecalho.classList.remove('ordenado-asc', 'ordenado-desc');
    if (cabecalho.dataset.campo === ordenacaoAtual.campo) {
      const classe = ordenacaoAtual.direcao === 'asc' ? 'ordenado-asc' : 'ordenado-desc';
      cabecalho.classList.add(classe);
      cabecalho.setAttribute('aria-sort', ordenacaoAtual.direcao === 'asc' ? 'ascending' : 'descending');
    } else {
      cabecalho.setAttribute('aria-sort', 'none');
    }
  });
}

// Alterna para a tela de consulta
function exibir_tela_consulta() {
  telaLogin.classList.add('escondido');
  telaConsulta.classList.remove('escondido');
}

// Renderiza as linhas da tabela dinamicamente (recebe os itens já ordenados)
function preencher_tabela(itens) {
  if (!itens || itens.length === 0) {
    corpoTabela.innerHTML = '<tr><td colspan="5" class="texto-vazio">Nenhum produto encontrado.</td></tr>';
    return;
  }

  corpoTabela.innerHTML = '';
  itens.forEach((item) => {
    const linha = document.createElement('tr');

    const precoFormatado = item.preco_venda
      ? parseFloat(item.preco_venda).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      : 'R$ 0,00';

    linha.innerHTML = `
      <td>${item.cod_produto}</td>
      <td>${item.produto}</td>
      <td>${item.estdesc || '-'}</td>
      <td>${precoFormatado}</td>
      <td class="destaque-estoque">${parseFloat(item.estoque_fisico).toFixed(2)}</td>
    `;
    corpoTabela.appendChild(linha);
  });
}

