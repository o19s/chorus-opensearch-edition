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

services="opensearch opensearch-dashboards middleware reactivesearch"

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

echo -e "${MAJOR}Creating ecommerce-keyword index, defining its mapping & settings\n${RESET}"
curl -s -X PUT "http://localhost:9200/ecommerce-keyword/" -H 'Content-Type: application/json' --data-binary @./opensearch/schema.json
echo -e "\n"

echo -e "${MAJOR}Creating ecommerce alias for ecommerce-keyword index\n${RESET}"
curl -s -X POST "http://localhost:9200/ecommerce-keyword/_aliases/ecommerce" -H "Content-Type: application/json"
echo -e "\n"

echo -e "${MAJOR}Prepping Data for Ingestion\n${RESET}"
if [ ! -f ./esci.json.zst ]; then
  echo -e "${MINOR}Downloading the sample product data\n${RESET}"
  wget https://esci-s.s3.amazonaws.com/esci.json.zst
fi

if [ ! -f ./esci.json ]; then
  echo -e "${MINOR}Unpacking the sample product data, please give it a few minutes!\n${RESET}"
  zstd --decompress esci.json.zst 
fi

if [ ! -f ./transformed_esci_1.json ]; then
  echo -e "${MINOR}Transforming the sample product data into JSON format, please give it a few minutes!\n${RESET}"
  docker run -v "$(pwd)":/app -w /app python:3 bash -c "pip install -r requirements.txt && python3 ./opensearch/transform_data.py"
fi

echo -e "${MAJOR}Indexing the product data, please wait...\n${RESET}"
# Define the OpenSearch endpoint and content header
OPENSEARCH_URL="http://localhost:9200/ecommerce/_bulk?pretty=false&filter_path=-items"
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

# we start dataprepper as the last component to not interfere with ubi index creation
echo -e "${MAJOR}Starting Dataprepper...\n${RESET}"
docker compose up -d --build dataprepper

echo -e "${MAJOR}Welcome to Chorus OpenSearch Edition!${RESET}"
