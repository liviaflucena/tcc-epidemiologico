from flask import Blueprint, jsonify
from sqlalchemy import text
from helpers.database import engine

bp_states = Blueprint("states", __name__)

@bp_states.route("/states", methods=["GET"])
def list_states():
    sql = text("""
        SELECT uf, nome, ibge_id
        FROM estados
        ORDER BY uf
    """)
    with engine.connect() as conn:
        rows = conn.execute(sql).mappings().all()
        return jsonify([dict(r) for r in rows])