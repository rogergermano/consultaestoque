# Documentação Técnica e Manutenção

## 1. Arquitetura e Segurança
- **Autenticação:** Baseada em Bearer Token validado pelo FastAPI, com credenciais protegidas via variáveis de ambiente (`.env`).
- **Escopo de Acesso:** Restrito estritamente à rede local (Wi-Fi/LAN) da loja, bloqueando requisições externas.

## 2. Automação no Inicialização do Servidor
Para garantir que a aplicação suba automaticamente com o Windows Server:
* Abra o **Agendador de Tarefas** (`taskschd.msc`) no perfil de administrador.
* Crie uma nova **Tarefa Básica** com o gatilho **Ao iniciar o computador**.
* Configure a ação para iniciar o programa `cmd.exe` com o argumento:
  `/c cd /d C:\Caminho\Do\Projeto && venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000`
* Habilite a opção **Executar com privilégios mais altos** nas propriedades da tarefa.