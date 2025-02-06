#!/bin/bash -e

# Create a click model.
docker compose run search_evaluation_framework java -jar /app/search-evaluation-framework.jar -o http://opensearch:9200 -c coec
