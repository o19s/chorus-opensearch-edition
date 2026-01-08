#!/bin/bash -e

# This script starts up Chorus and runs through the basic setup tasks.

# Ansi color code variables
ERROR='\033[0;31m[QUICKSTART] '
MAJOR='\033[0;34m[QUICKSTART] '
MINOR='\033[0;37m[QUICKSTART]    '
RESET='\033[0m' # No Color

# Set up logging to both terminal and log file
mkdir -p logs
LOG_FILE="logs/quickstart-$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG_FILE")
exec 2>&1

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


hostname_or_ip=false

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


        --hostname_or_ip | -host)
	    if [ -n "$2" ] && [[ "$2" != -* ]]; then
          hostname_or_ip=true
	        HOST=$2
	        echo -e "${MAJOR}Using hostname/IP: $HOST\n${RESET}"
	        shift
	    else
	        echo -e "${ERROR}Error: --hostname | -host option requires an argument.${RESET}"
	        exit 1
	    fi
	    ;;
	esac
	shift
done

services="opensearch opensearch-dashboards middleware reactivesearch"

if $offline_lab; then
  services="${services} quepid"
fi

mkdir -p build

if ! $local_deploy; then
  echo -e "${MAJOR}Updating configuration files for online deploy${RESET}"
  sed -i.bu 's/localhost/chorus-opensearch-edition.dev.o19s.com/g'  ./reactivesearch/src/App.js
  sed -i.bu 's/localhost/chorus-opensearch-edition.dev.o19s.com/g'  ./opensearch/wait-for-os.sh
fi

if $hostname_or_ip; then
  echo -e "${MAJOR}Updating configuration files for deployment with specific hostname or IP${RESET}"
  sed -i.bu "s/localhost/$HOST/g" ./reactivesearch/src/App.js
fi

if $stop; then
  docker compose stop ${services}
  exit
fi

if $shutdown; then
  docker compose down -v
  exit
fi

# Using pre-prepared sample data instead of downloading and transforming
echo -e "${MAJOR}Using pre-prepared sample data for quicker startup\n${RESET}"




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

# Try to extract the model_group_id from the response
model_group_id=$(echo "$response" | jq -r '.model_group_id // empty' 2>/dev/null)

# If creation succeeded, use it; otherwise search for existing one
if [ -n "$model_group_id" ] && [ "$model_group_id" != "null" ]; then
  echo "Created Model Group with id: $model_group_id"
else
  response=$(curl -s -X POST "http://localhost:9200/_plugins/_ml/model_groups/_search" \
    -H 'Content-Type: application/json' \
    --data-binary '{
      "query": {
        "bool": {
          "must": [
            {
              "terms": {
                "name": [
                  "neural_search_model_group"
                ]
              }
            }
          ]
        }
      }
    }')
  model_group_id=$(echo "$response" | jq -r '.hits.hits[0]._id // empty' 2>/dev/null)
  echo "Using existing Model Group with id: $model_group_id"
fi

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
    exit 1
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

echo -e "${MAJOR}Setting up User Behavior Insights indexes...\n${RESET}"
curl -s -X POST "http://localhost:9200/_plugins/ubi/initialize"

echo -e "${MAJOR}Creating ecommerce index, defining its mapping & settings\n${RESET}"
curl -s -X PUT "http://localhost:9200/ecommerce" -H 'Content-Type: application/json' --data-binary @./opensearch/schema.json
echo -e "\n"

echo -e "${MAJOR}Indexing the product data, please wait...\n${RESET}"
# Define the OpenSearch endpoint and content header
OPENSEARCH_URL="http://localhost:9200/ecommerce/_bulk?pretty=false&filter_path=-items"
CONTENT_TYPE="Content-Type: application/json"

# Using pre-prepared shrunk sample data for faster indexing
echo "Processing ./sample-data/esci_us_ecommerce_shrunk.ndjson"

# Send the file to OpenSearch using curl
curl -X POST "$OPENSEARCH_URL" -H "$CONTENT_TYPE" --data-binary @./sample-data/esci_us_ecommerce_shrunk.ndjson

# Check the response code to see if the request was successful
if [[ $? -ne 0 ]]; then
    echo "Failed to send sample data file"
else
    echo "Sample data file successfully sent to OpenSearch"
fi

echo -e "${MAJOR}Creating pipelines for neural search and hybrid search\n${RESET}"
curl -s -X PUT "http://localhost:9200/_search/pipeline/neural-search-pipeline" \
  -H 'Content-Type: application/json' \
  --data-binary "{
     \"description\": \"Neural Only Search\",
     \"request_processors\": [
      {
      \"neural_query_enricher\" : {
        \"description\": \"Sets the default model ID at index and field levels\",
        \"default_model_id\": \"$model_id\",
        \"neural_field_default_id\": {
           \"title_embeddings\": \"$model_id\"
        }
      }
    }
  ]
  }"

curl -s -X PUT "http://localhost:9200/_search/pipeline/hybrid-search-pipeline" \
  -H 'Content-Type: application/json' \
  --data-binary "{
     \"request_processors\": [
    {
      \"neural_query_enricher\" : {
        \"description\": \"Sets the default model ID at index and field levels\",
        \"default_model_id\": \"$model_id\",
        \"neural_field_default_id\": {
           \"title_embeddings\": \"$model_id\"
        }
      }
    }
  ],
  \"phase_results_processors\": [
    {
      \"normalization-processor\": {
        \"normalization\": {
          \"technique\": \"min_max\"
        },
        \"combination\": {
          \"technique\": \"arithmetic_mean\",
          \"parameters\": {
            \"weights\": [
              0.3,
              0.7
            ]
          }
        }
      }
    }
  ]
  }"

if $offline_lab; then
  echo -e "${MAJOR}Setting up Quepid${RESET}"
  docker compose run --rm quepid bundle exec bin/rake db:setup
  docker compose run quepid bundle exec thor user:create -a admin@choruselectronics.com "Chorus Admin" password
fi

echo -e "${MAJOR}Updating the indexed data with embeddings...\n${RESET}"
update_docs_task_id=$(curl -s -X POST "http://localhost:9200/ecommerce/_update_by_query?pipeline=embeddings-pipeline&wait_for_completion=false" | jq -r '.task')

echo -e "${MAJOR}This process runs in the background. Plese give it a couple of minutes. You can check the progress with the following curl command:

curl -s GET http://localhost:9200/_tasks/$update_docs_task_id\n${RESET}"

echo -e "${MAJOR}Installing User Behavior Insights Dashboards...\n${RESET}"
curl -X POST "http://localhost:5601/api/saved_objects/_import?overwrite=true" -H "osd-xsrf: true" --form file=@opensearch-dashboards/ubi_dashboard.ndjson > /dev/null

echo -e "${MAJOR}Installing Team Draft Interleaving Dashboards...\n${RESET}"
curl -X POST "http://localhost:5601/api/saved_objects/_import?overwrite=true" -H "osd-xsrf: true" --form file=@opensearch-dashboards/tdi_dashboard.ndjson > /dev/null

echo -e "${MAJOR}Fetching latest Search Result Quality Evaluation Dashboard, sample data and install script...\n${RESET}"

# Dashboards
curl -s -o build/search_dashboard.ndjson https://raw.githubusercontent.com/o19s/opensearch-search-quality-evaluation/refs/heads/main/opensearch-dashboard-prototyping/search_dashboard.ndjson
# Install script
curl -s -o build/install_dashboards.sh https://raw.githubusercontent.com/o19s/opensearch-search-quality-evaluation/refs/heads/main/opensearch-dashboard-prototyping/install_dashboards.sh
# sample data
curl -s -o build/sample_data.ndjson https://raw.githubusercontent.com/o19s/opensearch-search-quality-evaluation/refs/heads/main/opensearch-dashboard-prototyping/sample_data.ndjson
# mappings for search quality metrics sample data index
curl -s -o build/srw_metrics_mappings.json https://raw.githubusercontent.com/o19s/opensearch-search-quality-evaluation/refs/heads/main/opensearch-dashboard-prototyping/srw_metrics_mappings.json

echo -e "${MAJOR}Installing Search Result Quality Evaluation Dashboard...\n${RESET}"
chmod +x build/install_dashboards.sh
./build/install_dashboards.sh http://localhost:9200 http://localhost:5601

## configure the SRW search configurations
echo -e "${MAJOR}Creating Search Relevance entities...\n${RESET}"
./search_relevance.sh


# we start dataprepper as the last service to prevent it from creating the ubi_queries index using the wrong mappings.
echo -e "${MAJOR}Starting Dataprepper...\n${RESET}"
docker compose up -d --build dataprepper --remove-orphans

echo -e "${MAJOR}Welcome to Chorus OpenSearch Edition!${RESET}"
