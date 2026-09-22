import os
import pyodbc
from dotenv import load_dotenv

# carrega as variáveis de ambiente do arquivo .env
load_dotenv()


# estabelece a conexão com o banco de dados lendo o .env
def conectar_banco():
  string_conexao = (
      f"DRIVER={os.getenv('DB_DRIVER')};"
      f"SERVER={os.getenv('DB_SERVER')};"
      f"DATABASE={os.getenv('DB_DATABASE')};"
      f"UID={os.getenv('DB_USER')};"
      f"PWD={os.getenv('DB_PASSWORD')};"
      "TrustServerCertificate=yes;"
  )
  return pyodbc.connect(string_conexao)


# executa a consulta sql com filtros dinâmicos
def extrair_estoque(
    limite: float,
    codigo: str = None,
    nome: str = None,
    estrutura: str = None,
):
  conexao = conectar_banco()
  cursor = conexao.cursor()

  query_base = """
        WITH ultimas_vendas AS (
            SELECT
                [codigo do produto],
                rdata,
                ROW_NUMBER() OVER (
                    PARTITION BY [codigo do produto]
                    ORDER BY rdata DESC
                ) AS rn
            FROM [itens dos documentos fisc]
            WHERE [Codigo do tipo de documen] NOT IN ('o','O','p','P')
        ),
        vendas_pivot AS (
            SELECT
                [codigo do produto],
                MAX(CASE WHEN rn = 1 THEN rdata END) AS ultima_venda_1,
                MAX(CASE WHEN rn = 2 THEN rdata END) AS ultima_venda_2,
                MAX(CASE WHEN rn = 3 THEN rdata END) AS ultima_venda_3
            FROM ultimas_vendas
            WHERE rn <= 3
            GROUP BY [codigo do produto]
        )
        SELECT
            vp.[codigo] AS cod_produto,
            REPLACE(pr.[descricao], ',', '') AS produto,
            vp.estruturaestoquecodigo AS codest,
            vp.estruturaestoquedescricao AS estdesc,
            vp.estruturaestoquepaicodigo AS codpai,
            vp.estruturaestoquepaidescricao AS paidesc,
            vp.estruturaestoqueavocodigo AS codavo,
            vp.estruturaestoqueavodescricao AS avodesc,
            p.[preco1] AS preco_venda,
            vp.[custoatual] AS custo_atual,
            vp.[estoquefisico] AS estoque_fisico,
            CAST((p.[preco1] - vp.[custoatual]) / NULLIF(p.[preco1], 0) AS DECIMAL(10,4)) AS margem,
            CAST(p.[preco1] / NULLIF(vp.[custoatual], 0) AS DECIMAL(10,4)) AS markup,
            pd.[classificacao curva abc] AS curva_abc,
            vp.ultimaentrada AS ultima_entrada,
            uv.ultima_venda_1,
            uv.ultima_venda_2,
            uv.ultima_venda_3
        FROM viewprodutos vp
        INNER JOIN produtos_dados pd
            ON vp.[codigo] = pd.[codigo do produto]
            AND pd.[filial] = 1
        INNER JOIN precos p
            ON vp.[codigo] = p.[codigo do produto]
            AND p.[filial] = 1
        INNER JOIN produtos pr
            ON vp.[codigo] = pr.[codigo do produto]
        LEFT JOIN vendas_pivot uv
            ON vp.[codigo] = uv.[codigo do produto]
  """

  filtros = ["vp.[estoquefisico] > ?"]
  parametros = [limite]

  if codigo:
    filtros.append("vp.[codigo] LIKE ?")
    parametros.append(f"%{codigo}%")

  if nome:
    filtros.append("pr.[descricao] LIKE ?")
    parametros.append(f"%{nome}%")

  if estrutura:
    filtros.append("vp.estruturaestoquedescricao LIKE ?")
    parametros.append(f"%{estrutura}%")

  where_sql = " WHERE " + " AND ".join(filtros)
  order_sql = " ORDER BY uv.ultima_venda_1 DESC"

  query_final = query_base + where_sql + order_sql

  cursor.execute(query_final, tuple(parametros))

  colunas = [coluna[0] for coluna in cursor.description]

  lista_produtos = []
  for linha in cursor.fetchall():
    lista_produtos.append(dict(zip(colunas, linha)))

  conexao.close()
  return lista_produtos