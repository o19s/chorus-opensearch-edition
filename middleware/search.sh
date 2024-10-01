#!/bin/bash

# Examples of traditional Search
curl -X GET http://localhost:9090/ecommerce/_search -H "content-type: application/json" --data '{"ext": {"ubi": { "query_id": "1234"}}, "query": {"match_all": {}}}'

#curl -s -X GET http://192.168.1.24:9200/ecommerce/_search -H "content-type: application/json" --data '{"ext": {"ubi": { "query_id": "1234"}}, "query": {"match_all": {}}}'

# example of Multi Search
#curl -X GET http://localhost:9090/ecommerce/_msearch -H "content-type: application/x-ndjson" --data-raw $'{"preference":"supplier_name"}\n{"query":{"bool":{"must":[{"bool":{"must":[{"multi_match":{"query":"t","fields":["id","name","title","product_type","short_description","ean","search_attributes","primary_ean"]}}]}}]}},"size":20,"_source":{"includes":["*"],"excludes":[]},"ext":{"ubi":{"query_id":"Q-3de541d0-f3a5-45c9-adbe-a989592ba16a","user_query":"t","client_id":"USER-eeed-43de-959d-90e6040e84f9","object_id_field":"primary_ean","query_attributes":{"application":"chorus"}}},"from":0}\n'
