# Sistema de Consulta de Estoque - Loja

Aplicação web local desenvolvida em FastAPI e Python para consulta rápida de estoque via rede interna (Wi-Fi/LAN), integrada ao banco de dados SQL Server da empresa.

## Estrutura do Projeto
- `main.py`: Servidor FastAPI, rotas de API, autenticação por token e entrega de arquivos estáticos.
- `extracao.py`: Consultas SQL dinâmicas com filtros de quantidade, código, nome e estrutura de estoque.
- `static/`: Interface visual do usuário (`index.html`, `style.css`, `app.js`).
- `.env`: Configurações confidenciais e credenciais de acesso isoladas.

## Como Executar Manualmente
1. Abra o terminal na pasta raiz do projeto.
2. Ative o ambiente virtual: `venv\Scripts\activate`
3. Inicie o servidor Uvicorn: `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
4. Acesse pelo navegador na rede local usando o IP do servidor na porta 8000. 0.0.0.0:8000

## Como Iniciar Automaticamente.
1. Renomeie o arquivo iniciar.txt para `iniciar.bat`.
2. Mantenha o .bat dentro da raiz do projeto.
3. Clique com o botão direito no arquivo `criar_tarefa.bat` e selecione Executar como Administrador.
4. Para testar imediatamente sem reiniciar o servidor: Abra o Prompt de Comando como Administrador e digite:
	`schtasks /run /tn "EstoqueLojaAPI"`.
