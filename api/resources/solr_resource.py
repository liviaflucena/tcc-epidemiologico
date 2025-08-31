from flask import Blueprint, request, jsonify, current_app
import requests
import os
import unicodedata
import re

bp_solr = Blueprint("solr", __name__)

SOLR_BASE_URL = os.getenv("SOLR_URL", "http://solr:8983/solr/dengue")

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

@bp_solr.route("/solr/<core>/select", methods=["GET"])
def solr_select(core):
    try:
        # Se o core for 'estados', usa o core 'dengue' que já existe
        if core == "estados":
            solr_url = f"{SOLR_BASE_URL}/select"
        else:
            solr_url = f"{SOLR_BASE_URL.replace('/dengue', f'/{core}')}/select"
        
        params = dict(request.args)
        
        # Normaliza a query se for busca de estados
        if core == "estados" and "q" in params:
            original_query = params["q"]
            normalized_query = normalize_text(original_query)
            
            # Sempre inclui o campo nome_normalizado para buscas sem acentos
            if "qf" in params:
                if "nome_normalizado" not in params["qf"]:
                    params["qf"] = params["qf"] + " nome_normalizado^2"
            else:
                params["qf"] = "uf^3 nome nome_normalizado^2"
            
            # Se a query foi normalizada, tenta buscar com ambas as versões
            if normalized_query != original_query.lower():
                # Primeiro tenta com a query original
                response = requests.get(solr_url, params=params, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("response", {}).get("numFound", 0) > 0:
                        current_app.logger.info(f"Encontrou resultados com query original: {original_query}")
                        return jsonify(data), 200
                
                # Se não encontrou, tenta com a query normalizada
                params["q"] = normalized_query
                current_app.logger.info(f"Tentando com query normalizada: {normalized_query}")
            else:
                current_app.logger.info(f"Query já normalizada: {normalized_query}")
        
        current_app.logger.info(f"Fazendo requisição para Solr: {solr_url} com params: {params}")
        
        response = requests.get(solr_url, params=params, timeout=10)
        
        current_app.logger.info(f"Resposta do Solr - Status: {response.status_code}, Content-Type: {response.headers.get('content-type')}")
        
        # Verifica se a resposta é válida
        if response.status_code != 200:
            current_app.logger.error(f"Solr retornou status {response.status_code}: {response.text}")
            return jsonify({"error": f"Solr retornou status {response.status_code}", "detail": response.text}), response.status_code
        
        # Verifica se o conteúdo é JSON
        if not response.text.strip():
            current_app.logger.error("Solr retornou resposta vazia")
            return jsonify({"error": "Solr retornou resposta vazia"}), 500
        
        try:
            json_data = response.json()
            return jsonify(json_data), 200
        except ValueError as json_error:
            current_app.logger.error(f"Resposta do Solr não é JSON válido: {response.text[:200]}")
            return jsonify({"error": "Resposta do Solr não é JSON válido", "detail": str(json_error), "response": response.text[:200]}), 500
        
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Erro ao acessar Solr: {e}")
        return jsonify({"error": "Erro ao acessar Solr", "detail": str(e)}), 500
    except Exception as e:
        current_app.logger.exception("Erro inesperado no proxy Solr")
        return jsonify({"error": "Internal Server Error", "detail": str(e)}), 500

@bp_solr.route("/solr/status", methods=["GET"])
def solr_status():
    """Endpoint para verificar o status do Solr"""
    try:
        # Verifica se o Solr está respondendo
        response = requests.get(f"{SOLR_BASE_URL.replace('/dengue', '')}/admin/cores?action=STATUS", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            cores = list(data.get("status", {}).keys())
            return jsonify({
                "status": "ok",
                "cores": cores,
                "solr_url": SOLR_BASE_URL
            })
        else:
            return jsonify({
                "status": "error",
                "message": f"Solr retornou status {response.status_code}",
                "response": response.text
            }), 500
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Erro ao conectar com Solr: {str(e)}"
        }), 500