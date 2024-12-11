import json
import os
import uuid
import flask
import string
import pickle
import requests
import numpy as np
from flask import Flask, request, Response, jsonify
from sklearn.ensemble import RandomForestRegressor
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

# Local cache for product asin -> cost (sensitive information)
cache = {}

print("Using OTel endpoint: " + OTEL_COLLECTOR_ENDPOINT)

# This proxies the traditional _search end point across any index.
# ecommerce/_search
# ecommerce_keyword/_search
# ecommerce_neural/_search
@app.route('/<path:prefix>/_search', methods=["GET", "POST", "OPTIONS"])
def search(prefix):

    if request.method == "OPTIONS":
        response = flask.jsonify(status=200, mimetype="application/json")
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Authorization, Content-Type")
        response.headers.add("Access-Control-Request-Method", "*")
        return response

    else:
      # Based on https://stackoverflow.com/a/36601467
      res = requests.request(
          method          = request.method,
          url             = request.url.replace(request.host_url, f"{OPENSEARCH_ENDPOINT}/"),
          headers         = {k:v for k,v in request.headers if k.lower() != "host"}, # exclude "host" header
          data            = request.get_data(),
          cookies         = request.cookies,
          allow_redirects = False
      )

      excluded_headers = ["content-encoding", "content-length", "transfer-encoding", "connection"]

      headers = {}
      for k,v in res.raw.headers.items():
          if k not in excluded_headers:
              headers[k] = v

      search_response = res.json()

      response = search_response

      ubi_query_id = search_response.get("ext", {}).get("ubi", {}).get("query_id")
      if ubi_query_id is not None:
          for hit in response["hits"]["hits"]:
              asin = hit["_source"]["asin"]
              cost = hit["_source"]["cost"]
              
              # Strip out of the sensitive data from what is sent to browser
              del hit["_source"]["cost"]
      
              # Cache cost for product based on QueryId + ASIN
              cache[f"{ubi_query_id}-{asin}"] = cost
  
      response = flask.Response(json.dumps(search_response), res.status_code, headers=headers)
  
      return response

# This proxies the Multi Search _msearch end point across any index.
# ecommerce/_msearch
# ecommerce_keyword/_msearch
# ecommerce_neural/_msearch
@app.route("/<path:prefix>/_msearch", methods=["GET", "POST", "OPTIONS"])
def multisearch(prefix):

    if request.method == "OPTIONS":
        response = flask.jsonify(status=200, mimetype="application/json")
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Authorization, Content-Type")
        response.headers.add("Access-Control-Request-Method", "*")
        return response

    else:
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
      
      ubi_query_id = search_response.get("ext", {}).get("ubi", {}).get("query_id")
      if ubi_query_id is not None:
        for response in search_response["responses"]:
          for hit in response["hits"]["hits"]:
            asin = hit["_source"]["asin"][0]
            cost = hit["_source"]["cost"]

            # Strip out of the sensitive data from what is sent to browser
            del hit["_source"]["cost"]

            # Cache cost for product based on QueryId + ASIN
            cache[f"{ubi_query_id}-{asin}"] = cost

      response = flask.Response(json.dumps(search_response), res.status_code, headers=headers)

      return response


@app.route("/ubi_events", methods=["PUT", "POST", "OPTIONS"])
def ubi_events():

    if request.method == "OPTIONS":
        response = flask.jsonify(status=200, mimetype="application/json")
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Authorization, Content-Type")
        response.headers.add("Access-Control-Request-Method", "POST")
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
        #         "query_id": "00112233-4455-6677-8899-aabbccddeeff",
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

        tracer = trace.get_tracer(__name__)

        for event in events:                     
            ubi_query_id = event["query_id"]
            # Add back the sensitive information (cost) to the data being sent to the UBI Events datastore.            
            cost = None

            # couldn't get this to work so doing a more painful approach below.
            # asin = event["event_attributes"]["object"]["object_id"] 

            event_attributes = event["event_attributes"]
            if event_attributes is not None:
                obj = event_attributes["object"]
                if obj is not None:
                    asin = obj["object_id"]                    
                    if asin is not None:
                        if f"{ubi_query_id}-{asin}" in cache:
                            cost = cache[f"{ubi_query_id}-{asin}"]
                        else:
                            cost = None

            if cost is not None:
                event['event_attributes']['cost'] = cost

            # First we demonstrate indexing directly into ubi_events index
            client.index(
                index="ubi_events",
                body=event,
                id=str(uuid.uuid4()),
                refresh=True
            )

            # Now we demonstrate indexing via OTEL into otel_ubi_events index
            with tracer.start_as_current_span("ubi_event") as span:

                for key, value in event.items():
                    if value is not None and key != "event_attributes":
                        span.set_attribute("ubi." + key, value)
                span.set_attribute("ubi.event_attributes", json.dumps(event['event_attributes']))

        return '{"status": "submitted"}'


@app.route("/ubi_queries", methods=["PUT", "POST", "OPTIONS"])
def ubi_queries():
    if request.method == "OPTIONS":
        response = flask.jsonify(status=200, mimetype="application/json")
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Authorization, Content-Type")
        response.headers.add("Access-Control-Request-Method", "POST")
        return response
        
    else:

        # Send the event to Data Prepper.
        queries = request.get_json()

        print("Received UBI query:")
        print(queries)

        # Example received UBI event.
        # [
        #     {
        #         "application": "Chorus",
        #         "client_id": "USER-eeed-43de-959d-90e6040e84f9",
        #         "query_id": "00112233-4455-6677-8899-aabbccddeeff",
        #         "user_query": "Ram memory"
        #         "object_id_field": "_id"
        #         "message_type": "INFO",
        #         "message": "Integral 2GB SD Card memory card (undefined)",
        #         "timestamp": 1724944081669,
        #         "query_attributes": {},
        #         }
        #     }
        # ]

        # Index the UBI event to OpenSearch.
        client = OpenSearch(hosts=[{"host": OPENSEARCH_HOST, "port": 9200}])


        # only one, but we use an array to make DataPrepper happy
        for query in queries:
                     
            ubi_query_id = query["query_id"]
            
            # First we demonstrate indexing directly into ubi_queries index
            client.index(
                index="ubi_queries",
                body=query,
                id=ubi_query_id,
                refresh=True
            )
              
        return '{"status": "submitted"}'

        
@app.route('/dump_cache', methods=["GET"])
def dump_cache():
  response = flask.jsonify(cache=cache)
  return response

with open("model.pkl", "rb") as model_file:
    model = pickle.load(model_file)

@app.route("/get_neuralness", methods=["GET"])
def get_neuralness():
    # Get the query string from the request
    query = request.args.get("query")
    if not query:
        return jsonify({"error": "Query parameter is missing"}), 400
    
    # Initialize variables to track the maximum prediction and corresponding neuralness value
    max_prediction = float('-inf')
    best_neuralness = None

    # Iterate over neuralness values from 0 to 1.0 in 0.1 steps
    for i in range(11):  # 11 because we need 0 to 10 inclusive
        neuralness = i * 0.1

        # Calculate features
        features = [
            neuralness,
            num_of_terms(query),
            query_length(query),
            has_numbers(query),
            has_special_char(query)
        ]

        # Predict the value using the model
        try:
            prediction = model.predict([features])[0]
        except Exception as e:
            return jsonify({"error": f"Model prediction failed: {str(e)}"}), 500
        
        # Update max_prediction and best_neuralness if current prediction is greater
        if prediction > max_prediction:
            max_prediction = prediction
            best_neuralness = neuralness

        # Return the prediction as JSON
    print(f"Ran predictions for query {query}")
    return jsonify({"best_neuralness": best_neuralness})

def num_of_terms(query_string):
    terms = query_string.split(" ")
    return len(terms)

def query_length(query_string):
    return len(query_string)

def has_numbers(query_string):
    return int(any(char.isdigit() for char in query_string))

def has_special_char(query_string):
    # Define special characters (all non-alphanumeric characters)
    special_chars = string.punctuation
    # Return True if any character in the string is a special character
    return int(any(char in special_chars for char in query_string))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9090, debug=True)
