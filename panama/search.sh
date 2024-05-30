#!/bin/bash

curl -X GET http://localhost:8080 -H "content-type: application/json" --data '{"ext": {"ubi": { "query_id": "1234"}}, "query": {"match_all": {}}}'

#curl -s -X GET http://192.168.1.24:9200/ecommerce/_search -H "content-type: application/json" --data '{"ext": {"ubi": { "query_id": "1234"}}, "query": {"match_all": {}}}'