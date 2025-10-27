import json
import os
import uuid
import logging
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
from interleave import Interleave

OTEL_COLLECTOR_ENDPOINT = os.getenv("OTEL_COLLECTOR_ENDPOINT", "http://dataprepper:21890/opentelemetry.proto.collector.trace.v1.TraceService/Export")
OPENSEARCH_ENDPOINT = os.getenv("OPENSEARCH_ENDPOINT", "http://opensearch:9200")
OPENSEARCH_HOST = os.getenv("OPENSEARCH_HOST", "opensearch")

app = Flask(__name__)
CORS(app, supports_credentials=True)

# Basic configuration for logging
logging.basicConfig(level=logging.INFO,
                    format='%(name)s - %(levelname)s - %(message)s')

logger = logging.getLogger(__name__)

# Local cache for product asin -> cost (sensitive information)
cache = {}

# Local mapping for query_id -> user_query information
user_query_cache = {}

print("Using OTel endpoint: " + OTEL_COLLECTOR_ENDPOINT)

# This proxies the traditional _search end point across any index.
# ecommerce/_search
@app.route('/ecommerce/_search', methods=["GET", "POST", "OPTIONS"])
def search():

    if request.method == "OPTIONS":
        response = flask.jsonify(status=200, mimetype="application/json")
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Authorization, Content-Type")
        response.headers.add("Access-Control-Request-Method", "*")
        return response

    else:
      # Based on https://stackoverflow.com/a/36601467
      # 
      last_search_query = request.get_data().decode('utf-8')
      last_search = json.loads(last_search_query)
      user_query = last_search.get("ext", {}).get("ubi", {}).get("user_query")  
      ubi_query_id_to_cache = last_search.get("ext", {}).get("ubi", {}).get("query_id")     
      
      # cache the user_query by the query_id
      if ubi_query_id_to_cache is not None:
        if user_query is not None:
          user_query_cache[ubi_query_id_to_cache] = user_query
          
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
            
            # Check if we have a user_query in our cache from the query and add it to the event.BaseException
            if ubi_query_id in user_query_cache:
                event['user_query'] = user_query_cache[ubi_query_id]
            
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

        # Example received UBI query.
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
        
       

        # Index the UBI query to OpenSearch.
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
  
@app.route('/dump_user_query_cache', methods=["GET"])
def dump_user_query_cache():
  response = flask.jsonify(user_query_cache=user_query_cache)
  return response

def strip_keys(json_rep: str, keys: list) -> str:
    dict_value = json.loads(json_rep)
    for key in keys:
        if ('ext' in dict_value) and (key in dict_value['ext']):
            del dict_value['ext'][key]
    return json.dumps(dict_value)

# This provides the ab_search interleaving using search configurations.
# if no configs are provided, employ the original _msearch
# ecommerce/_msearch
@app.route('/ecommerce/_msearch', methods=["GET", "POST", "OPTIONS"])
def ab_search():

    if request.method == "OPTIONS":
        response = flask.jsonify(status=200, mimetype="application/json")
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add("Access-Control-Allow-Headers", "Authorization, Content-Type")
        response.headers.add("Access-Control-Request-Method", "*")
        return response
    else:
        # Based on https://stackoverflow.com/a/36601467
        #
        req_data_array = request.get_data().decode('utf-8').splitlines()
        last_search_query = req_data_array[-1]
        last_search = json.loads(last_search_query)
        user_query = last_search.get("ext", {}).get("ubi", {}).get("user_query")
        ubi_query_id_to_cache = last_search.get("ext", {}).get("ubi", {}).get("query_id")
        # cache the user_query by the query_id
        if ubi_query_id_to_cache is not None:
            if user_query is not None:
                user_query_cache[ubi_query_id_to_cache] = user_query
        conf_a = last_search.get("ext", {}).get("conf_a", None)
        conf_b = last_search.get("ext", {}).get("conf_b", None)
        do_ab = (len(req_data_array) == 6) and conf_a and conf_b
        do_agentic = (conf_a == "agentic")
        logger.info(f"Got conf_a value '{conf_a}' and '{conf_b}' on '{user_query}'")
        # Are we doing an AB test run?
        if do_ab:
            logger.info(f"Performing TDI of '{conf_a}' and '{conf_b}' on '{user_query}'")
            k = last_search.get("size")
            source = last_search.get("_source")
            ext = last_search.get("ext", {})
            # have to strip out the conf_* parameters
            try:
                del ext['conf_a']
                del ext['conf_b']
            except:
                pass
            interleaved = Interleave().run_ab(user_query, conf_a, conf_b, k, source, ext)
            #update the req_data to drop the final two items and end with a newline character
            # have to strip out the conf_* parameters
            req_data_array = [ strip_keys(x, ['conf_a', 'conf_b']) for x in req_data_array[:-2]]
            req_data = "\n".join(req_data_array) + "\n"
            req_data = req_data.encode('utf-8')
        elif do_agentic:
            logger.info(f"Looking up 'agentic' search configuration. '{conf_a}' on '{user_query}'")
            # Need to look up 
            
            search_configuration = Interleave().get_search_config(conf_a)
            logger.info(f"Found ${search_configuration}")
            
            query = user_query.replace('"', '\\"')
            body = json.loads(search_configuration['query'].replace("%SearchText%", query))
            
            
          
            req_data_array = req_data_array[:-1] 
            req_data = "\n".join(req_data_array) + "\n"
            req_data = req_data.encode('utf-8')
            req_data_array.append(json.dumps(body))
            req_data_array = [ strip_keys(x, ['conf_a', 'conf_b']) for x in req_data_array]
            req_data = "\n".join(req_data_array) + "\n"
            req_data = req_data.encode('utf-8')
            
            
            #q_a = Interleave().populate_query(query, conf_a, size=size, source=source, ext=ext)df
            
        else:
            if conf_a:
                #still have to strip the conf_* keys
                req_data_array = [ strip_keys(x, ['conf_a', 'conf_b']) for x in req_data_array]
                req_data = "\n".join(req_data_array) + "\n"
                req_data = req_data.encode('utf-8')
            else:
                req_data = request.get_data()
        # run the msearch, getting the aggs, if not doing AB, also get the actual query
 
        logger.info(f"req_data:{req_data}")
        res = requests.request(
            method          = request.method,
            url             = request.url.replace(request.host_url, f"{OPENSEARCH_ENDPOINT}/").replace('_old', ''),
            headers         = {k:v for k,v in request.headers if k.lower() != "host"}, # exclude "host" header
            data            = req_data,
            cookies         = request.cookies,
            allow_redirects = False,
        )

        excluded_headers = ["content-encoding", "content-length", "transfer-encoding", "connection"]

        headers = {}
        for k,v in res.raw.headers.items():
            if k not in excluded_headers:
                headers[k] = v

        search_response = res.json()
        if do_ab:
            if "responses" in search_response:
                search_response["responses"].append(interleaved)
            else:
                search_response["hits"].append(interleaved)
        ubi_query_id = search_response.get("responses", [{}])[-1].get("ext", {}).get("ubi", {}).get("query_id")
        # for some responses we are not getting back the ubi query_id..
        if ubi_query_id is not None:
            for response in search_response["responses"]:
                for hit in response["hits"]["hits"]:
                    try:
                        asin = hit["_source"]["asin"][0]
                        cost = hit["_source"]["cost"]

                        # Strip out of the sensitive data from what is sent to browser
                        del hit["_source"]["cost"]

                        # Cache cost for product based on QueryId + ASIN
                        cache[f"{ubi_query_id}-{asin}"] = cost
                    except Exception as e:
                        pass

        logger.info(f"query id is {ubi_query_id} and user query is {user_query}")

        # cache the user_query by the query_id
        if ubi_query_id is not None:
            if user_query is not None:
                user_query_cache[ubi_query_id] = user_query

        response = flask.Response(json.dumps(search_response), res.status_code, headers=headers)

        return response


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9090, debug=True)
