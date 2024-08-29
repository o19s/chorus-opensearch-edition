import os

import flask
from flask import Flask, request, Response
from flask_cors import cross_origin, CORS
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

OTEL_COLLECTOR_ENDPOINT = os.environ.get("OTEL_COLLECTOR_ENDPOINT", "http://localhost:4318/v1/traces")

# api_v2_cors_config = {
#     "origins": ["*"],
#     "methods": ["*"],
#     "allow_headers": ["*"]
# }
app = Flask(__name__)
CORS(app)

# @app.after_request
# def after_request(response):
#     header = response.headers
#     header['Access-Control-Allow-Origin'] = '*'
#     header['Access-Control-Allow-Headers'] = '*'
#     header['Access-Control-Allow-Methods'] = '*'
#     return response

@app.route("/ubi_events", methods=["POST"])
#@cross_origin()
def ubi_events():

    # Send the event to Data Prepper.
    ubi_event = request.get_json()

    print("Received UBI event:")
    print(ubi_event)

    # Example UBI event for OpenSearch.
    # [
    #     {
    #         "action_name": "product_hover",
    #         "client_id": "USER-eeed-43de-959d-90e6040e84f9",
    #         "query_id": null,
    #         "page_id": "/",
    #         "message_type": "INFO",
    #         "message": "Integral 2GB SD Card memory card (undefined)",
    #         "timestamp": 1724944081669,
    #         "event_attributes": {
    #             "object": {
    #             "object_id_field": "product",
    #             "object_id": "1625640",
    #             "description": "Integral 2GB SD Card memory card",
    #             "object_detail": null
    #         },
    #         "position": null,
    #         "browser": null,
    #         "session_id": null,
    #         "page_id": null,
    #         "dwell_time": null
    #         }
    #     }
    # ]

    # Make OTel trace from UBI event.

    resource = Resource(attributes={
        "service.name": "ubi"
    })

    traceProvider = TracerProvider(resource=resource)
    processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=OTEL_COLLECTOR_ENDPOINT))
    traceProvider.add_span_processor(processor)
    trace.set_tracer_provider(traceProvider)

    trace.set_tracer_provider(TracerProvider(resource=resource))
    tracer = trace.get_tracer(__name__)
    otlp_exporter = OTLPSpanExporter()

    span_processor = BatchSpanProcessor(otlp_exporter)
    trace.get_tracer_provider().add_span_processor(span_processor)

    for event in ubi_event:

        with tracer.start_as_current_span("ubi_event") as span:
            span.set_attribute("ubi.client_id", event["client_id"])
            span.set_attribute("ubi.action_name", event["action_name"])

    response = flask.jsonify("{'status': 'submitted'}", status=201, mimetype="application/json")
    response.headers.add('Access-Control-Allow-Origin', '*')

    return response


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9090, debug=True)
