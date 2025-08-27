from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import text
from helpers.database import engine

bp_cases = Blueprint("cases", __name__)

def _resolve_uf_param(conn, uf_param: str | None) -> str | None:
    """Converte sigla (SP) -> código IBGE ('35'); mantém numérico se já vier."""
    if not uf_param:
        return None
    uf = uf_param.strip().upper()
    if uf.isdigit():
        return uf
    row = conn.execute(
        text("SELECT ibge_id::text AS codigo FROM estados WHERE uf = :sigla"),
        {"sigla": uf},
    ).mappings().first()
    return row["codigo"] if row else None

@bp_cases.route("/cases", methods=["GET"])
def cases():
    agg = (request.args.get("agg") or "state").lower()
    uf_param = request.args.get("uf")

    try:
        with engine.connect() as conn:
            if agg == "state":
                sql = text("""
                    SELECT e.uf AS uf_sigla,
                           e.nome AS uf_nome,
                           SUM(d.casos)  AS casos,
                           SUM(d.obitos) AS obitos
                    FROM dengue_stats d
                    JOIN estados e ON e.ibge_id::text = d.uf
                    GROUP BY e.uf, e.nome
                    ORDER BY e.uf
                """)
                rows = conn.execute(sql).mappings().all()
                return jsonify([dict(r) for r in rows])

            elif agg == "city":
                uf_code = _resolve_uf_param(conn, uf_param)
                if not uf_code:
                    return jsonify({"error": "parâmetro 'uf' é obrigatório (sigla ex.: SP ou código IBGE ex.: 35)"}), 400
                sql = text("""
                    SELECT d.municipio_ibge_id,
                           SUM(d.casos)  AS casos,
                           SUM(d.obitos) AS obitos
                    FROM dengue_stats d
                    WHERE d.uf = :uf
                    GROUP BY d.municipio_ibge_id
                    ORDER BY d.municipio_ibge_id
                """)
                rows = conn.execute(sql, {"uf": uf_code}).mappings().all()
                return jsonify([dict(r) for r in rows])

            elif agg == "week":
                uf_code = _resolve_uf_param(conn, uf_param)
                if not uf_code:
                    return jsonify({"error": "parâmetro 'uf' é obrigatório (sigla ex.: SP ou código IBGE ex.: 35)"}), 400
                sql = text("""
                    SELECT date_trunc('week', d.ref_date)::date AS semana,
                           SUM(d.casos)  AS casos,
                           SUM(d.obitos) AS obitos
                    FROM dengue_stats d
                    WHERE d.uf = :uf
                    GROUP BY 1
                    ORDER BY 1
                """)
                rows = conn.execute(sql, {"uf": uf_code}).mappings().all()
                # Não assume tipo date: converte de forma segura pra string
                out = []
                for r in rows:
                    semana = r.get("semana")
                    semana_str = getattr(semana, "isoformat", lambda: str(semana))()
                    out.append({"semana": semana_str, "casos": r["casos"], "obitos": r["obitos"]})
                return jsonify(out)

            else:
                return jsonify({"error": "agg inválido. Use: state | city | week"}), 400

    except Exception as e:
        current_app.logger.exception("Erro em /cases")
        return jsonify({"error": "Internal Server Error", "detail": str(e)}), 500