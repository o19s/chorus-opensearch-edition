#!/bin/bash -e

# This script starts up Chorus and runs through the basic setup tasks.

# Ansi color code variables
ERROR='\033[0;31m[QUICKSTART] '
MAJOR='\033[0;34m[QUICKSTART] '
MINOR='\033[0;37m[QUICKSTART]    '
RESET='\033[0m' # No Color

export DOCKER_SCAN_SUGGEST=false

if ! [ -x "$(command -v curl)" ]; then
  echo "${ERROR}Error: curl is not installed.${RESET}" >&2
  exit 1
fi
if ! [ -x "$(command -v docker)" ]; then
  echo "${ERROR}Error: docker is not installed.${RESET}" >&2
  exit 1
fi
if ! [ -x "$(command -v wget)" ]; then
  echo "${ERROR}Error: wget is not installed.${RESET}" >&2
  exit 1
fi

observability=false
shutdown=false
offline_lab=false
local_deploy=true
stop=false

while [ ! $# -eq 0 ]
do
	case "$1" in
		--help | -h)
	    echo -e "Use the option --with-offline-lab | -lab to include Quepid service in Chorus."
	    echo -e "Use the option --shutdown | -s to shutdown and remove the Docker containers and data."
	    echo -e "Use the option --stop to stop the Docker containers."
	    echo -e "Use the option --online-deployment | -online to update configuration to run on chorus-opensearch-edition.dev.o19s.com environment."
			exit
			;;
    --with-offline-lab | -lab)
			offline_lab=true
      echo -e "${MAJOR}Running Chorus with offline lab environment enabled\n${RESET}"
			;;
    --shutdown | -s)
			shutdown=true
      echo -e "${MAJOR}Shutting down Chorus\n${RESET}"
			;;
	  --stop)
    	stop=true
      echo -e "${MAJOR}Stopping Chorus\n${RESET}"
    	;;
    --online-deployment | -online)
      local_deploy=false
      echo -e "${MAJOR}Configuring Chorus for chorus-opensearch-edition.dev.o19s.com environment\n${RESET}"
      ;;
	esac
	shift
done

services="opensearch opensearch-dashboards dataprepper middleware reactivesearch"

if $offline_lab; then
  services="${services} quepid"
fi

if ! $local_deploy; then
  echo -e "${MAJOR}Updating configuration files for online deploy${RESET}"
  sed -i.bu 's/localhost/chorus-opensearch-edition.dev.o19s.com/g'  ./reactivesearch/src/App.js
  sed -i.bu 's/localhost/chorus-opensearch-edition.dev.o19s.com/g'  ./opensearch/wait-for-os.sh
fi

if $stop; then
  docker compose stop ${services}
  exit
fi

if $shutdown; then
  docker compose down -v
  exit
fi

docker compose up -d --build ${services}

echo -e "${MAJOR}Waiting for OpenSearch to start up and be online.${RESET}"
./opensearch/wait-for-os.sh # Wait for OpenSearch to be online

echo -e "${MAJOR}Configuring the ML Commons plugin.${RESET}"
curl -s -X PUT "http://localhost:9200/_cluster/settings" -H 'Content-Type: application/json' --data-binary '{
  "persistent": {
        "plugins": {
            "ml_commons": {
                "only_run_on_ml_node": "false",
                "model_access_control_enabled": "true",
                "native_memory_threshold": "99"
            }
        }
    }
}'

echo -e "${MAJOR}Registering a model group.${RESET}"
response=$(curl -s -X POST "http://localhost:9200/_plugins/_ml/model_groups/_register" \
  -H 'Content-Type: application/json' \
  --data-binary '{
    "name": "neural_search_model_group",
    "description": "A model group for neural search models"
  }')

# Extract the model_group_id from the JSON response
model_group_id=$(echo "$response" | jq -r '.model_group_id')

# Use the extracted model_group_id
echo "Created Model Group with id: $model_group_id"

echo -e "${MAJOR}Registering a model in the model group.${RESET}"
response=$(curl -s -X POST "http://localhost:9200/_plugins/_ml/models/_register" \
  -H 'Content-Type: application/json' \
  --data-binary "{
     \"name\": \"huggingface/sentence-transformers/all-MiniLM-L6-v2\",
     \"version\": \"1.0.1\",
     \"model_group_id\": \"$model_group_id\",
     \"model_format\": \"TORCH_SCRIPT\"
  }")

# Extract the task_id from the JSON response
task_id=$(echo "$response" | jq -r '.task_id')

# Use the extracted task_id
echo "Created Model, get status with task id: $task_id"


echo -e "${MAJOR}Waiting for the model to be registered.${RESET}"
max_attempts=10
attempts=0

# Wait for task to be COMPLETED
while [[ "$(curl -s localhost:9200/_plugins/_ml/tasks/$task_id | jq -r '.state')" != "COMPLETED" && $attempts -lt $max_attempts ]]; do
    echo "Waiting for task to complete... attempt $((attempts + 1))/$max_attempts"
    sleep 5
    attempts=$((attempts + 1))
done

if [[ $attempts -ge $max_attempts ]]; then
    echo "Limit of attempts reached. Something went wrong with registering the model. Check OpenSearch logs."
else
    response=$(curl -s localhost:9200/_plugins/_ml/tasks/$task_id)
    model_id=$(echo "$response" | jq -r '.model_id')
    echo "Task completed successfully! Model registered with id: $model_id"
fi

echo -e "${MAJOR}Deploying the model.${RESET}"
response=$(curl -s -X POST "http://localhost:9200/_plugins/_ml/models/$model_id/_deploy")

# Extract the task_id from the JSON response
deploy_task_id=$(echo "$response" | jq -r '.task_id')

echo "Model deployment started, get status with task id: $deploy_task_id"

echo -e "${MAJOR}Waiting for the model to be deployed.${RESET}"
# Reset attempts
attempts=0

while [[ "$(curl -s localhost:9200/_plugins/_ml/tasks/$task_id | jq -r '.state')" != "COMPLETED" && $attempts -lt $max_attempts ]]; do
    echo "Waiting for task to complete... attempt $((attempts + 1))/$max_attempts"
    sleep 5
    attempts=$((attempts + 1))
done

if [[ $attempts -ge $max_attempts ]]; then
    echo "Limit of attempts reached. Something went wrong with deploying the model. Check OpenSearch logs."
else
    response=$(curl -s localhost:9200/_plugins/_ml/tasks/$task_id)
    model_id=$(echo "$response" | jq -r '.model_id')
    echo "Task completed successfully! Model deployed with id: $model_id"
fi

echo -e "${MAJOR}Creating an ingest pipeline for embedding generation during index time.${RESET}"
curl -s -X PUT "http://localhost:9200/_ingest/pipeline/embeddings-pipeline" \
  -H 'Content-Type: application/json' \
  --data-binary "{
     \"description\": \"A text embedding pipeline\",
       \"processors\": [
         {
          \"text_embedding\": {
          \"model_id\": \"$model_id\",
          \"field_map\": {
            \"title\": \"title_embedding\"
          }
        }
      }
    ]
  }"

echo -e "${MAJOR}Creating ecommerce index, defining its mapping & settings\n${RESET}"
curl -s -X PUT "http://localhost:9200/ecommerce" -H 'Content-Type: application/json' --data-binary @./opensearch/schema.json
echo -e "\n"

echo -e "${MAJOR}Prepping Data for Ingestion\n${RESET}"
if [ ! -f ./esci.json.zst ]; then
  echo -e "${MINOR}Downloading the sample product data\n${RESET}"
  wget https://esci-s.s3.amazonaws.com/esci.json.zst
fi

if [ ! -f ./esci.json ]; then
  echo -e "${MINOR}Unpacking the sample product data, please give it a few minutes!\n${RESET}"
  zstd --decompress esci.json.zst 
  # create a sample for starters
fi

echo -e "${MINOR}Transforming the sample product data into JSON format, please give it a few minutes!\n${RESET}"
if [ ! -f ./transformed_esci_1.json ]; then
  docker run -v "$(pwd)":/app -w /app python:3 bash -c "pip install -r requirements.txt && python3 ./opensearch/transform_data.py"
fi

echo -e "${MAJOR}Indexing the product data, please wait...\n${RESET}"
# Define the OpenSearch endpoint and content header
OPENSEARCH_URL="http://localhost:9200/ecommerce/_bulk?pretty=false&filter_path=-items&pipeline=embeddings-pipeline"
CONTENT_TYPE="Content-Type: application/json"

# Loop through each JSON file with the prefix "transformed_esci_"
for file in transformed_esci_*.json; do
    if [[ -f "$file" ]]; then
        echo "Processing $file..."

        # Send the file to OpenSearch using curl
        curl -X POST "$OPENSEARCH_URL" -H "$CONTENT_TYPE" --data-binary @"$file"

        # Check the response code to see if the request was successful
        if [[ $? -ne 0 ]]; then
            echo "Failed to send $file"
        else
            echo "$file successfully sent to OpenSearch"
        fi
    else
        echo "No files found with the prefix 'transformed_esci_'"
    fi
done

echo -e "${MAJOR}Setting up User Behavior Insights indexes...\n${RESET}"
curl -s -X POST "http://localhost:9200/_plugins/ubi/initialize"

if $offline_lab; then
  echo -e "${MAJOR}Setting up Quepid${RESET}"
  docker compose run --rm quepid bundle exec bin/rake db:setup
  docker compose run quepid bundle exec thor user:create -a admin@choruselectronics.com "Chorus Admin" password
fi

echo -e "${MAJOR}Welcome to Chorus OpenSearch Edition!${RESET}"
