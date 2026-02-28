#!/bin/bash

# This script sets up sample data to exercise the features of the Search Relevance Workbench.
#
# It will clear out any existing indexes as part of running it.

# OpenSearch connection settings
OS_URL="https://localhost:9200"

# Helper script for capturing return values from curl commands
exe() { (set -x ; curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' "$@") | jq | tee build/RES; echo; }


echo Deleting UBI indexes
(curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' -s -X DELETE "$OS_URL/ubi_queries" > /dev/null) || true
(curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' -s -X DELETE "$OS_URL/ubi_events" > /dev/null) || true

echo Creating UBI indexes using mappings
curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' -s -X POST "$OS_URL/_plugins/ubi/initialize"

echo Updating UBI timestamps to current date
docker run --rm -v "$(pwd)":/workspace -w /workspace python:3.9-slim python sample-data/update_ubi_timestamps.py sample-data/ubi_queries_events.ndjson build/ubi_queries_events_updated.ndjson

echo Loading sample UBI data
curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' -o /dev/null -X POST "$OS_URL/_bulk?pretty" --data-binary @build/ubi_queries_events_updated.ndjson -H "Content-Type: application/x-ndjson"

echo Refreshing UBI indexes to make indexed data available for query sampling
curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' -XPOST "$OS_URL/ubi_queries/_refresh"
echo
curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' -XPOST "$OS_URL/ubi_events/_refresh"

read -r -d '' QUERY_BODY << EOF
{
  "query": {
    "match_all": {}
  },
  "size": 0
}
EOF

NUMBER_OF_QUERIES=$(curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' -s -XGET "$OS_URL/ubi_queries/_search" \
  -H "Content-Type: application/json" \
  -d "${QUERY_BODY}" | jq -r '.hits.total.value')

NUMBER_OF_EVENTS=$(curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' -s -XGET "$OS_URL/ubi_events/_search" \
  -H "Content-Type: application/json" \
  -d "${QUERY_BODY}" | jq -r '.hits.total.value')

echo
echo "Indexed UBI data: $NUMBER_OF_QUERIES queries and $NUMBER_OF_EVENTS events"

echo Deleting queryset, search config, judgment and experiment indexes
(curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' -s -X DELETE "$OS_URL/search-relevance-search-config" > /dev/null) || true
(curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' -s -X DELETE "$OS_URL/search-relevance-queryset" > /dev/null) || true
(curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' -s -X DELETE "$OS_URL/search-relevance-judgment" > /dev/null) || true
(curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' -s -X DELETE "$OS_URL/.plugins-search-relevance-experiment" > /dev/null) || true
(curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' -s -X DELETE "$OS_URL/search-relevance-evaluation-result" > /dev/null) || true
(curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' -s -X DELETE "$OS_URL/search-relevance-experiment-variant" > /dev/null) || true

sleep 2
echo Create search configs

exe -s -X PUT "$OS_URL/_plugins/_search_relevance/search_configurations" \
-H "Content-type: application/json" \
-d'{
      "name": "baseline",
      "query": "{\"query\":{\"multi_match\":{\"query\":\"%SearchText%\",\"fields\":[\"id\",\"title\",\"category\",\"bullet_points\",\"description\",\"brand\",\"color\"]}}}",
      "index": "ecommerce"
}'

SC_BASELINE=`jq -r '.search_configuration_id' < build/RES`

exe -s -X PUT "$OS_URL/_plugins/_search_relevance/search_configurations" \
-H "Content-type: application/json" \
-d'{
      "name": "baseline with title weight",
      "query": "{\"query\":{\"multi_match\":{\"query\":\"%SearchText%\",\"fields\":[\"id\",\"title^25\",\"category\",\"bullet_points\",\"description\",\"brand\",\"color\"]}}}",
      "index": "ecommerce"
}'

SC_CHALLENGER=`jq -r '.search_configuration_id' < build/RES`

echo
echo List search configurations
exe -s -X GET "$OS_URL/_plugins/_search_relevance/search_configurations" \
-H "Content-type: application/json" \
-d'{
     "sort": {
       "timestamp": {
         "order": "desc"
       }
     },
     "size": 10
   }'

echo
echo Baseline search config id: $SC_BASELINE
echo Challenger search config id: $SC_CHALLENGER

echo
echo Create Query Sets by Sampling UBI Data
exe -s -X POST "$OS_URL/_plugins/_search_relevance/query_sets" \
-H "Content-type: application/json" \
-d'{
   	"name": "Top 20",
   	"description": "Top 20 most frequent queries sourced from user searches.",
   	"sampling": "topn",
   	"querySetSize": 20
}'

QUERY_SET_UBI=`jq -r '.query_set_id' < build/RES`

sleep 2

echo
echo Upload Manually Curated Query Set

exe -s -X PUT "$OS_URL/_plugins/_search_relevance/query_sets" \
-H "Content-type: application/json" \
-d'{
   	"name": "TVs",
   	"description": "Some TVs that people might want",
   	"sampling": "manual",
   	"querySetQueries": [
    	{"queryText": "tv"},
    	{"queryText": "led tv"}
    ]
}'

QUERY_SET_MANUAL=`jq -r '.query_set_id' < build/RES`

echo
echo Upload ESCI Query Set

exe -s -X PUT "$OS_URL/_plugins/_search_relevance/query_sets" \
-H "Content-type: application/json" \
--data-binary @sample-data/esci_us_queryset.json



QUERY_SET_ESCI=`jq -r '.query_set_id' < build/RES`

echo
echo List Query Sets

exe -s -X GET "$OS_URL/_plugins/_search_relevance/query_sets" \
-H "Content-type: application/json" \
-d'{
     "sort": {
       "sampling": {
         "order": "desc"
       }
     },
     "size": 10
   }'

echo
echo Create Implicit Judgments
exe -s -X PUT "$OS_URL/_plugins/_search_relevance/judgments" \
-H "Content-type: application/json" \
-d'{
   	"clickModel": "coec",
    "maxRank": 20,
   	"name": "Implicit Judgements",
   	"type": "UBI_JUDGMENT"
  }'

UBI_JUDGMENT_LIST_ID=`jq -r '.judgment_id' < build/RES`

# wait for judgments to be created in the background
sleep 2

echo
echo Import Manually Curated Judgements
exe -s -X PUT "$OS_URL/_plugins/_search_relevance/judgments" \
-H "Content-type: application/json" \
-d'{
    "name": "Imported Judgments",
    "description": "Judgments generated outside SRW",
    "type": "IMPORT_JUDGMENT",
    "judgmentRatings": [
        {
            "query": "red dress",
            "ratings": [
                {
                    "docId": "B077ZJXCTS",
                    "rating": "0.000"
                },
                {
                    "docId": "B071S6LTJJ",
                    "rating": "0.000"
                },
                {
                    "docId": "B01IDSPDJI",
                    "rating": "0.000"
                },
                {
                    "docId": "B07QRCGL3G",
                    "rating": "0.000"
                },
                {
                    "docId": "B074V6Q1DR",
                    "rating": "0.000"
                }
            ]
        },
        {
            "query": "blue jeans",
            "ratings": [
                {
                    "docId": "B07L9V4Y98",
                    "rating": "0.000"
                },
                {
                    "docId": "B01N0DSRJC",
                    "rating": "0.000"
                },
                {
                    "docId": "B001CRAWCQ",
                    "rating": "0.000"
                },
                {
                    "docId": "B075DGJZRM",
                    "rating": "0.000"
                },
                {
                    "docId": "B009ZD297U",
                    "rating": "0.000"
                }
            ]
        }
    ]
}'

IMPORTED_JUDGMENT_LIST_ID=`jq -r '.judgment_id' < build/RES`

echo
echo Upload ESCI Judgments

exe -s -X PUT "$OS_URL/_plugins/_search_relevance/judgments" \
-H "Content-type: application/json" \
--data-binary @sample-data/esci_us_judgments.json



ESCI_JUDGMENT_LIST_ID=`jq -r '.judgment_id' < build/RES`

echo
echo Create PAIRWISE Experiment
exe -s -X PUT "$OS_URL/_plugins/_search_relevance/experiments" \
-H "Content-type: application/json" \
-d"{
   	\"querySetId\": \"$QUERY_SET_ESCI\",
   	\"searchConfigurationList\": [\"$SC_BASELINE\", \"$SC_CHALLENGER\"],
   	\"size\": 10,
   	\"type\": \"PAIRWISE_COMPARISON\"
   }"


EX_PAIRWISE=`jq -r '.experiment_id' < build/RES`

echo
echo Experiment id: $EX_PAIRWISE

echo
echo Show PAIRWISE Experiment
exe -s -X GET "$OS_URL/_plugins/_search_relevance/experiments/$EX_PAIRWISE"

echo
echo Create POINTWISE Experiment

exe -s -X PUT "$OS_URL/_plugins/_search_relevance/experiments" \
-H "Content-type: application/json" \
-d"{
   	\"querySetId\": \"$QUERY_SET_ESCI\",
   	\"searchConfigurationList\": [\"$SC_BASELINE\"],
    \"judgmentList\": [\"$ESCI_JUDGMENT_LIST_ID\"],
   	\"size\": 8,
   	\"type\": \"POINTWISE_EVALUATION\"
   }"

EX_POINTWISE=`jq -r '.experiment_id' < build/RES`

echo
echo Experiment id: $EX_POINTWISE

echo
echo Show POINTWISE Experiment
exe -s -X GET "$OS_URL/_plugins/_search_relevance/experiments/$EX_POINTWISE"

echo
echo List experiments
exe -s -X GET "$OS_URL/_plugins/_search_relevance/experiments" \
-H "Content-type: application/json" \
-d'{
     "sort": {
       "timestamp": {
         "order": "desc"
       }
     },
     "size": 3
   }'


## BEGIN HYBRID OPTIMIZER DEMO ##
echo
echo
echo BEGIN HYBRID OPTIMIZER DEMO
echo
echo Retrieving model_id
MODEL_ID=$(curl -k -u 'admin:MyStr0ng!P@ssw0rd2024' -XPOST "$OS_URL/_plugins/_ml/models/_search" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match_all": {}
  },
  "size": 1000
}
' | jq -r '.hits.hits[0]._source.model_id')

# Check if the variable is set and print it
if [ -n "$MODEL_ID" ]; then
    echo "Successfully extracted model_id: $MODEL_ID"
else
    echo "Failed to extract model_id."
    exit 1
fi

echo Creating Hybrid Query to be Optimized
exe -s -X PUT "$OS_URL/_plugins/_search_relevance/search_configurations" \
-H "Content-type: application/json" \
-d"{\"name\":\"hybrid_search_query\",\"query\":\"{\\\"query\\\":{\\\"hybrid\\\":{\\\"queries\\\":[{\\\"multi_match\\\":{\\\"query\\\":\\\"%SearchText%\\\",\\\"fields\\\":[\\\"id\\\",\\\"title\\\",\\\"category\\\",\\\"bullet_points\\\",\\\"description\\\",\\\"brand\\\",\\\"color\\\"]}},{\\\"neural\\\":{\\\"title_embedding\\\":{\\\"query_text\\\":\\\"%SearchText%\\\",\\\"k\\\":100,\\\"model_id\\\":\\\"$MODEL_ID\\\"}}}]}},\\\"size\\\":10,\\\"_source\\\":[\\\"id\\\",\\\"title\\\",\\\"category\\\",\\\"brand\\\",\\\"image\\\"]}\",\"searchPipeline\":\"hybrid-search-pipeline\",\"index\":\"ecommerce\"}"

SC_HYBRID=`jq -r '.search_configuration_id' < build/RES`

echo
echo Hybrid search config id: $SC_HYBRID

echo
echo Create HYBRID OPTIMIZER Experiment

exe -s -X PUT "$OS_URL/_plugins/_search_relevance/experiments" \
-H "Content-type: application/json" \
-d"{
   	\"querySetId\": \"$QUERY_SET_MANUAL\",
   	\"searchConfigurationList\": [\"$SC_HYBRID\"],
    \"judgmentList\": [\"$IMPORTED_JUDGMENT_LIST_ID\"],
   	\"size\": 10,
   	\"type\": \"HYBRID_OPTIMIZER\"
  }"

EX_HO=`jq -r '.experiment_id' < build/RES`

echo
echo Experiment id: $EX_HO

echo
echo Show HYBRID OPTIMIZER Experiment
exe -s -X GET "$OS_URL/_plugins/_search_relevance/experiments/$EX_HO"


echo
echo Set up baseline ART controlled Search Configuration
exe -s -X PUT "$OS_URL/_plugins/_search_relevance/search_configurations" \
-H "Content-type: application/json" \
-d'{
      "name": "art_controlled",
      "query": "{\"query\":{\"multi_match\":{\"query\":\"%SearchText%\",\"fields\":[\"id\",\"title^2\",\"category\",\"bullets\",\"description\",\"Brand\",\"Color\"]}}}",
      "index": "ecommerce"
}'

SC_ART_CONTROLLED=`jq -r '.search_configuration_id' < build/RES`

echo
echo Upload ART Query Set

exe -s -X PUT "$OS_URL/_plugins/_search_relevance/query_sets" \
-H "Content-type: application/json" \
--data-binary @sample-data/art_queryset.json

echo
echo Upload ART Judgments

exe -s -X PUT "$OS_URL/_plugins/_search_relevance/judgments" \
-H "Content-type: application/json" \
--data-binary @sample-data/art_judgments.json