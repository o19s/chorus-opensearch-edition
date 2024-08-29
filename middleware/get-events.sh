#!/bin/bash -e

curl http://localhost:9200/ubi_events/_search | jq
