#!/bin/bash

curl -X GET http://localhost:8080 -H "content-type: application/json" --data '{"ext": {"ubi": { "query_id": "1234"}}, "query": {"match_all": {}}}'
