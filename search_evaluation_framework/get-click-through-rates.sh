#!/bin/bash -e

curl -s "http://localhost:9200/click_through_rates/_search" | jq
