import os
from typing import Optional
from dotenv import load_dotenv
from extracao import extrair_estoque
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# carrega as variáveis do arquivo .env
load_dotenv()

app = FastAPI(title="sistema de consulta de estoque")

app.mount("/static", StaticFiles(directory="static"), name="static")

esquema_seguranca = HTTPBearer()

# credenciais e token recuperados do arquivo .env
TOKEN_VALIDO = os.getenv("APP_TOKEN")
USUARIO_SISTEMA = os.getenv("APP_USER")
SENHA_SISTEMA = os.getenv("APP_PASSWORD")


class ModeloLogin(BaseModel):
  usuario: str
  senha: str


def validar_token(
    credenciais: HTTPAuthorizationCredentials = Depends(esquema_seguranca),
):
  if credenciais.credentials != TOKEN_VALIDO:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="acesso negado: token inválido ou expirado.",
    )
  return credenciais.credentials


@app.get("/")
def abrir_pagina_inicial():
  return FileResponse("static/index.html")


@app.post("/api/login")
def realizar_login(dados: ModeloLogin):
  if dados.usuario == USUARIO_SISTEMA and dados.senha == SENHA_SISTEMA:
    return {
        "status": "sucesso",
        "token": TOKEN_VALIDO,
        "mensagem": "login realizado com sucesso!",
    }

  raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="usuário ou senha incorretos.",
  )


@app.get("/api/estoque")
def obter_estoque(
    limite: float = 50.0,
    codigo: Optional[str] = None,
    nome: Optional[str] = None,
    estrutura: Optional[str] = None,
    token: str = Depends(validar_token),
):
  try:
    dados = extrair_estoque(
        limite=limite, codigo=codigo, nome=nome, estrutura=estrutura
    )

    if not dados:
      raise HTTPException(
          status_code=404,
          detail="nenhum produto encontrado com os filtros aplicados.",
      )

    return {"total_itens": len(dados), "itens": dados}

  except Exception as erro:
    if isinstance(erro, HTTPException):
      raise erro
    raise HTTPException(status_code=500, detail=f"erro interno: {str(erro)}")