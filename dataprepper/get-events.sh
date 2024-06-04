#!/bin/bash -e

curl -s http://localhost:9200/ubi_events/_search | jq
