from flask import Blueprint, request, jsonify, current_app
import os
from sqlalchemy import create_engine, text

bp_cases = Blueprint("cases", __name__)

# Cria o engine uma vez só (evita problemas de escopo/local var)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@db:5432/dengue_db"
)
engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)


@bp_cases.route("/cases", methods=["GET"])
def cases():
    """
    /cases?agg=state
    /cases?agg=city&uf=SP
    /cases?agg=week&uf=SP
    """
    agg = (request.args.get("agg") or "").strip().lower()
    uf = request.args.get("uf")
    if uf:
        uf = uf.strip().upper()

    try:
        if agg == "state":
            # Soma por UF (converte código IBGE para sigla)
            sql = text("""
                SELECT e.uf AS uf,
                       SUM(d.casos)  AS casos,
                       SUM(d.obitos) AS obitos
                FROM dengue_stats d
                JOIN estados e ON d.uf::integer = e.ibge_id
                GROUP BY e.uf
                ORDER BY e.uf
            """)
            with engine.connect() as conn:
                rows = conn.execute(sql).mappings().all()
            # Mantém a ordem de chaves na saída
            data = [{"uf": r["uf"], "casos": int(r["casos"] or 0), "obitos": int(r["obitos"] or 0)} for r in rows]
            return jsonify(data)

        elif agg == "city":
            if not uf:
                return jsonify({"error": "Parâmetro 'uf' é obrigatório para agg=city."}), 400
            # Soma por município dentro da UF
            sql = text("""
                SELECT d.municipio_ibge_id,
                       SUM(d.casos)  AS casos,
                       SUM(d.obitos) AS obitos
                FROM dengue_stats d
                JOIN estados e ON d.uf::integer = e.ibge_id
                WHERE e.uf = :uf
                GROUP BY d.municipio_ibge_id
                ORDER BY d.municipio_ibge_id
            """)
            with engine.connect() as conn:
                rows = conn.execute(sql, {"uf": uf}).mappings().all()
            data = [
                {
                    "municipio_ibge_id": int(r["municipio_ibge_id"]) if r["municipio_ibge_id"] is not None else None,
                    "casos": int(r["casos"] or 0),
                    "obitos": int(r["obitos"] or 0),
                }
                for r in rows
            ]
            return jsonify(data)

        elif agg == "week":
            if not uf:
                return jsonify({"error": "Parâmetro 'uf' é obrigatório para agg=week."}), 400
            # Semana formatada como ISO (YYYY-MM-DD) para facilitar o front
            sql = text("""
                SELECT to_char(date_trunc('week', d.data_referencia)::date, 'YYYY-MM-DD') AS semana,
                       SUM(d.casos)  AS casos,
                       SUM(d.obitos) AS obitos
                FROM dengue_stats d
                JOIN estados e ON d.uf::integer = e.ibge_id
                WHERE e.uf = :uf
                GROUP BY 1
                ORDER BY 1
            """)
            with engine.connect() as conn:
                rows = conn.execute(sql, {"uf": uf}).mappings().all()
            data = [
                {
                    "semana": r["semana"],
                    "casos": int(r["casos"] or 0),
                    "obitos": int(r["obitos"] or 0),
                }
                for r in rows
            ]
            return jsonify(data)

        else:
            return jsonify({
                "error": "Parâmetro 'agg' inválido. Use: state | city | week."
            }), 400

    except Exception as e:
        current_app.logger.exception("Erro em /cases")
        return jsonify({"error": "Internal Server Error", "detail": str(e)}), 500