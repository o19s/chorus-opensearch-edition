#!/bin/bash -e

docker compose run search_evaluation_framework java -jar /app/search-evaluation-framework.jar -r /app/files/queryset.json
