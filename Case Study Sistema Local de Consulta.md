Case Study: Sistema Local de Consulta de Estoque e Preços em Tempo Real ##
Visão Geral & Desafio de Negócio
No setor de varejo de materiais de construção, a agilidade na verificação de disponibilidade e preço dos produtos no salão de vendas impacta diretamente a conversão de vendas e o tempo de atendimento. A equipe de vendas necessitava de uma ferramenta leve e instantânea para consultar o estoque físico via dispositivos móveis (smartphones/tablets), sem a complexidade, a lentidão ou os custos de licenças adicionais de terminais ERP tradicionais.

Para resolver essa dor, foi projetada e implantada uma aplicação Web/REST API on-premise, integrada diretamente ao banco de dados relacional corporativo (SQL Server) e otimizada para execução em rede local sem dependência de serviços em nuvem.

Arquitetura & Solução Técnica
Backend & REST API (FastAPI & Uvicorn):

Desenvolvido em Python com FastAPI, aproveitando o assincronismo do framework para entregar respostas em milissegundos.

Validação de tipos e serialização automática de dados em JSON.

Camada de dados isolada (extracao.py) utilizando pyodbc com parametrização dinâmica de consultas para evitar SQL Injection e otimizar pesquisas filtradas (código, descrição, estrutura mercadológica e saldo mínimo).

Autenticação via Bearer Token gerenciada por middleware de dependência.

Frontend & UX Móvel (Vanilla JavaScript):

Interface construída com HTML5, CSS3 e JavaScript ES6 puro, sem overhead de frameworks pesados, garantindo carregamento instantâneo no celular.

Processamento client-side para ordenação dinâmica de tabelas por volume de estoque físico (estoque_fisico) e preço de venda (preco_venda).

Implementação de estratégia de Cache Busting versionado (?v=N) para garantir a atualização contínua dos ativos estáticos em todos os dispositivos da loja.

Suporte a PWA/Atalho de Tela Inicial, permitindo que os vendedores usem a aplicação como um aplicativo nativo.

Infraestrutura, Segurança & DevOps:

Hospedagem On-Premise: Implantado em ambiente Windows Server 2019.

Segurança de Rede: Escuta configurada via bind em 0.0.0.0 na porta 8000, com liberação de regras específicas de entrada (Inbound Rules) no Windows Defender Firewall e restrição estrita ao escopo da Wi-Fi/LAN local.

Resiliência e Automação de Inicialização: Automação via Windows Task Scheduler (schtasks) com gatilho ONSTART e privilégios elevados (HIGHEST), garantindo execução zero-touch no boot do servidor.

Gestão de Segredos: Configurações sensíveis (credenciais de banco e chaves de sessão) isoladas em arquivo .env fora do controle de versão (.gitignore).

Impacto e Resultados de Negócio
Velocidade de Consulta: Redução do tempo de verificação de estoque e preços de minutos (deslocamento até terminal fixo) para menos de 3 segundos no celular.

Adoção e Experiência do Usuário: Interface minimalista e de alta performance, aprovada imediatamente pela equipe comercial.

Custo-Benefício: Custo zero de licenças adicionais ao reutilizar a infraestrutura de servidor e banco de dados já existente.