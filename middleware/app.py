import json
import os
import uuid

import flask
import requests
from flask import Flask, request, Response
from flask_cors import CORS
from opensearchpy import OpenSearch
from opentelemetry import trace
# For otel-desktop-viewer, use from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

OTEL_COLLECTOR_ENDPOINT = os.getenv("OTEL_COLLECTOR_ENDPOINT", "http://dataprepper:21890/opentelemetry.proto.collector.trace.v1.TraceService/Export")
OPENSEARCH_ENDPOINT = os.getenv("OPENSEARCH_ENDPOINT", "http://opensearch:9200")
OPENSEARCH_HOST = os.getenv("OPENSEARCH_HOST", "opensearch")

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Local cache for product ean -> cost (sensitive information)
cache = {}

print("Using OTel endpoint: " + OTEL_COLLECTOR_ENDPOINT)


@app.route("/ecommerce/_search", methods=["GET"])
def search():

    # Based on https://stackoverflow.com/a/36601467
    res = requests.request(
        method          = request.method,
        url             = request.url.replace(request.host_url, f"{OPENSEARCH_ENDPOINT}/"),
        headers         = {k:v for k,v in request.headers if k.lower() != "host"}, # exclude "host" header
        data            = request.get_data(),
        cookies         = request.cookies,
        allow_redirects = False,
    )

    excluded_headers = ["content-encoding", "content-length", "transfer-encoding", "connection"]

    headers = {}
    for k,v in res.raw.headers.items():
        if k not in excluded_headers:
            headers[k] = v

    search_response = res.json()

    for hit in search_response["hits"]["hits"]:
        ean = hit["_source"]["ean"][0]
        cost = hit["_source"]["cost"]
        del hit["_source"]["cost"]

        # Cache cost for products.
        cache[ean] = cost

    response = flask.Response(json.dumps(search_response), res.status_code, headers=headers)

    return response


@app.route("/ubi_events", methods=["POST", "OPTIONS"])
def ubi_events():

    if request.method == "OPTIONS":
        response = flask.jsonify(status=200, mimetype="application/json")
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type")
        return response

    else:

        # Send the event to Data Prepper.
        events = request.get_json()

        #print("Received UBI events:")
        #print(events)

        # Example received UBI event.
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

        # Index the UBI event to OpenSearch.
        client = OpenSearch(hosts=[{"host": OPENSEARCH_HOST, "port": 9200}])

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

        for event in events:

            client.index(
                index="ubi_events",
                body=event,
                id=str(uuid.uuid4()),
                refresh=True
            )

            with tracer.start_as_current_span("ubi_event") as span:

                for key, value in event.items():
                    if value is not None and key is not "event_attributes":
                        span.set_attribute("ubi." + key, value)

                # TODO: Handle event_attributes

                # Populate the cost (sensitive information) about the product.
                ean = event["event_attributes"]["object"]["object_id"]
                if ean in cache:
                    cost = cache[ean]
                    span.set_attribute("ubi.product_cost", cost)

        return '{"status": "submitted"}'


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9090, debug=True)