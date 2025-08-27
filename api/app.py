from flask import Flask
from flask_cors import CORS
from helpers.logging import configure_logging

def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/": {"origins": "*"}})

    # logging
    configure_logging(app)
    app.logger.info("Aplicação inicializada!")

    # importar e registrar blueprints
    from resources.health_resource import bp_health
    from resources.meta_resource import bp_states
    from resources.cases_resource import bp_cases

    app.register_blueprint(bp_health)
    app.register_blueprint(bp_states)
    app.register_blueprint(bp_cases)

    return app