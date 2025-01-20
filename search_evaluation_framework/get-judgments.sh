#!/bin/bash -e

#JUDGMENT_ID=$1
#curl -s "http://localhost:9200/judgments/_doc/${JUDGMENT_ID}" | jq

curl -s "http://localhost:9200/judgments/_search" | jq
