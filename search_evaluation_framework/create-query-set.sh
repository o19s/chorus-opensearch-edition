#!/bin/bash -e

# Create a query set using sampling.
java -jar ../target/search-evaluation-framework-1.0.0-SNAPSHOT-jar-with-dependencies.jar -s sampling.json

# Run a query set.
#java -jar ../target/search-evaluation-framework-1.0.0-SNAPSHOT-jar-with-dependencies.jar -r queryset.json
