import flask
import os
import json
from flask import Flask, request
from flask_cors import CORS
from opentelemetry import trace

# For otel-desktop-viewer, use from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

OTEL_COLLECTOR_ENDPOINT = "http://dataprepper:21890/opentelemetry.proto.collector.trace.v1.TraceService/Export"

app = Flask(__name__)
CORS(app, supports_credentials=True)

print("Using OTel endpoint: " + OTEL_COLLECTOR_ENDPOINT)

@app.route("/ubi_events", methods=["POST", "OPTIONS"])
def ubi_events():

    if request.method == "OPTIONS":
        response = flask.jsonify(status=200, mimetype="application/json")
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:4000")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        return response

    else:

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

        # Make OTel traces from UBI events in the request body.

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

                for key, value in event.items():
                    if value is not None and key is not "event_attributes":
                        span.set_attribute("ubi." + key, value)

                # TODO: Handle event_attributes

        return "{'status': 'submitted'}"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9090, debug=True)
