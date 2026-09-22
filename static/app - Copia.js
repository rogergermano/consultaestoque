// Elementos da interface
const telaLogin = document.getElementById('tela-login');
const telaConsulta = document.getElementById('tela-consulta');
const formLogin = document.getElementById('form-login');
const mensagemErroLogin = document.getElementById('mensagem-erro-login');
const btnSair = document.getElementById('btn-sair');
const btnBuscar = document.getElementById('btn-buscar');
const corpoTabela = document.getElementById('corpo-tabela');

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
      preencher_tabela(dados.itens);
    } else {
      corpoTabela.innerHTML = `<tr><td colspan="5" class="texto-vazio">${dados.detail || 'nenhum item encontrado.'}</td></tr>`;
    }
  } catch (erro) {
    corpoTabela.innerHTML = '<tr><td colspan="5" class="texto-vazio">erro ao comunicar com o servidor.</td></tr>';
  }
});

// Alterna para a tela de consulta
function exibir_tela_consulta() {
  telaLogin.classList.add('escondido');
  telaConsulta.classList.remove('escondido');
}

// Renderiza as linhas da tabela dinamicamente
function preencher_tabela(itens) {
  if (!itens || itens.length === 0) {
    corpoTabela.innerHTML = '<tr><td colspan="5" class="texto-vazio">Nenhum produto encontrado.</td></tr>';
    return;
  }

  itens.sort((a, b) => parseFloat(b.estoque_fisico) - parseFloat(a.estoque_fisico));

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