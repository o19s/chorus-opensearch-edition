#!/bin/bash -e

# Create a query set using sampling.
docker compose run search_evaluation_framework java -jar /app/search-evaluation-framework.jar -o http://opensearch:9200 -s creat-query-set.json
