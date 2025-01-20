#!/bin/bash -e

# Get the search pipeline.
curl -s http://localhost:9200/_search/pipeline/hybrid-search-pipeline | jq

#curl -s "http://localhost:9200/_plugins/_ml/models/_search" -H "Content-Type: application/json" -d'{
#    "query": {
#      "match_all": {}
#    }
#  }' | jq
