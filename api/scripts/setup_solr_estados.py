#!/usr/bin/env python3
"""
Script para carregar dados dos estados no core 'dengue' do Solr.
"""

import os
import requests
import json
import unicodedata
from sqlalchemy import create_engine, text

def normalize_text(text):
    """Normaliza texto removendo acentos e convertendo para minúsculas"""
    if not text:
        return text
    
    # Remove acentos
    normalized = unicodedata.normalize('NFD', text)
    normalized = ''.join(c for c in normalized if not unicodedata.combining(c))
    
    # Converte para minúsculas
    normalized = normalized.lower()
    
    return normalized

# Configurações
SOLR_BASE_URL = os.getenv("SOLR_URL", "http://solr:8983/solr/dengue")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg2://postgres:postgres@db:5432/dengue_db")

def load_estados_data():
    """Carrega dados dos estados do PostgreSQL para o Solr"""
    try:
        # Conecta ao PostgreSQL
        engine = create_engine(DATABASE_URL)
        
        # Busca dados dos estados
        with engine.connect() as conn:
            result = conn.execute(text("SELECT uf, nome, ibge_id FROM estados ORDER BY uf"))
            estados = [{"uf": row.uf, "nome": row.nome, "ibge_id": row.ibge_id} for row in result]
        
        if not estados:
            print("Nenhum estado encontrado no banco de dados!")
            return False
        
        # Envia dados para o Solr (usa core 'dengue')
        solr_url = f"{SOLR_BASE_URL}/update?commit=true"
        
        # Formata dados para o Solr
        docs = []
        for estado in estados:
            # Cria versão normalizada do nome para busca
            nome_normalizado = normalize_text(estado["nome"])
            
            docs.append({
                "id": f"estado_{estado['uf']}",  # Prefixo para evitar conflitos
                "uf": estado["uf"],
                "nome": estado["nome"],
                "nome_normalizado": nome_normalizado,  # Campo para busca sem acentos
                "ibge_id": estado["ibge_id"],
                "tipo": "estado"  # Campo para identificar que é um estado
            })
        
        print(f"Enviando {len(docs)} documentos para {solr_url}")
        
        # Envia para o Solr
        response = requests.post(
            solr_url,
            json=docs,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Resposta do Solr: {response.status_code} - {response.text}")
        
        if response.status_code == 200:
            print(f"Dados carregados com sucesso! {len(estados)} estados indexados.")
            return True
        else:
            print(f"Erro ao carregar dados: {response.text}")
            return False
            
    except Exception as e:
        print(f"Erro ao carregar dados: {e}")
        return False

def main():
    print("Carregando estados no Solr...")
    
    # Aguarda Solr ficar disponível
    print("Aguardando Solr ficar disponível...")
    for i in range(30):
        try:
            response = requests.get(f"{SOLR_BASE_URL}/select?q=*:*&rows=0")
            if response.status_code == 200:
                print("Solr está disponível!")
                break
        except:
            pass
        import time
        time.sleep(2)
    else:
        print("Erro: Solr não ficou disponível em 60 segundos!")
        return False
    
    # Carrega dados
    if not load_estados_data():
        return False
    
    print("Configuração do Solr concluída com sucesso!")
    return True

if __name__ == "__main__":
    main()
