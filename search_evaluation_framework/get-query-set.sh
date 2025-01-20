#!/bin/bash -e

QUERY_SET_ID="${1}"

curl -s "http://localhost:9200/search_quality_eval_query_sets/_doc/${QUERY_SET_ID}" | jq
