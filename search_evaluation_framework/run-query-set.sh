#!/bin/bash -e

docker compose run search_evaluation_framework java -jar /app/search-evaluation-framework.jar -o http://opensearch:9200 -r /app/files/run-query-set.json
