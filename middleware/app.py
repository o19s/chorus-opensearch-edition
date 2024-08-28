import os

from flask import Flask, request, Response
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

OTEL_COLLECTOR_ENDPOINT = os.environ.get("OTEL_COLLECTOR_ENDPOINT", "http://localhost:4318/v1/traces")

app = Flask(__name__)

@app.route("/ubi_events", methods=["POST"])
def ubi_events():

    # Send the event to Data Prepper.
    ubi_event = request.get_json()

    # Example UBI event for OpenSearch.
    # {
    #     "action_name": "page_exit",
    #     "user_id": "1821196507152684",
    #     "query_id": "00112233-4455-6677-8899-aabbccddeeff",
    #     "session_id": "c3d22be7-6bdc-4250-91e1-fc8a92a9b1f9",
    #     "page_id": "/docs/latest/",
    #     "timestamp": "2024-05-16T12:34:56.789Z",
    #     "message_type": "INFO",
    #     "message": "On page /docs/latest/ for 3.35 seconds",
    #     "event_attributes": {
    #         "position": {},
    #         "object": {
    #             "idleTimeoutMs": 5000,
    #             "currentIdleTimeMs": 250,
    #             "checkIdleStateRateMs": 250,
    #             "isUserCurrentlyOnPage": true,
    #             "isUserCurrentlyIdle": false,
    #             "currentPageName": "http://localhost:4000/docs/latest/",
    #             "timeElapsedCallbacks": [],
    #             "userLeftCallbacks": [],
    #             "userReturnCallbacks": [],
    #             "visibilityChangeEventName": "visibilitychange",
    #             "hiddenPropName": "hidden"
    #         }
    #     }
    # }

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

    with tracer.start_as_current_span("foo"):
        print("Hello world!")

    return Response("{'status': 'submitted'}", status=201, mimetype="application/json")
