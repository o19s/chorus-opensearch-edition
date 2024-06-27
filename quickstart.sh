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

services="opensearch opensearch-dashboards dataprepper dataprepper-proxy chorus-ui"

if $offline_lab; then
  services="${services} quepid"
fi

if ! $local_deploy; then
  echo -e "${MAJOR}Updating configuration files for online deploy${RESET}"
  sed -i.bu 's/localhost/chorus-opensearch-edition.dev.o19s.com/g'  ./chorus_ui/src/Logs.js
  sed -i.bu 's/localhost/chorus-opensearch-edition.dev.o19s.com/g'  ./chorus_ui/src/App.js
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

echo -e "${MAJOR}Creating ecommerce index, defining its mapping & settings\n${RESET}"
curl -s -X PUT "http://localhost:9200/ecommerce/" -H 'Content-Type: application/json' --data-binary @./opensearch/schema.json
echo -e "\n"

echo -e "${MAJOR}Creating UBI indexes\n${RESET}"
# Configure the ubi_events index in OpenSearch by looking up the versioned mapping file.
rm -f ./events-mapping.json
wget https://raw.githubusercontent.com/opensearch-project/user-behavior-insights/main/src/main/resources/events-mapping.json
curl -s -X PUT "http://localhost:9200/ubi_events" -H 'Content-Type: application/json'
curl -s -X PUT "http://localhost:9200/ubi_events/_mapping" -H 'Content-Type: application/json' --data-binary @./events-mapping.json

# Configure the ubi_queries index in OpenSearch by sending an empty search with {"ubi":{}} clause
curl -s -X GET "http://localhost:9200/ecommerce/_search" -H "Content-Type: application/json" -d'
 {
  "ext": {
   "ubi": {}
   },
   "query": {"match_all": {}}
 }
'

echo -e "${MAJOR}Prepping Data for Ingestion\n${RESET}"
if [ ! -f ./icecat-products-w_price-19k-20201127.tar.gz ]; then
  echo -e "${MINOR}Downloading the sample product data\n${RESET}"
  wget http://querqy.org/datasets/icecat/icecat-products-w_price-19k-20201127.tar.gz
fi

if [ ! -f ./icecat-products-w_price-19k-20201127.json ]; then
  echo -e "${MINOR}Unpacking the sample product data, please give it a few minutes!\n${RESET}"
  tar xzf icecat-products-w_price-19k-20201127.tar.gz
fi

if [ ! -f ./transformed_data.json ]; then
  echo -e "${MINOR}Transforming the sample product data into JSON format, please give it a few minutes!\n${RESET}"
  docker run -v ./:/app -w /app python:3 python3 ./opensearch/transform_data.py icecat-products-w_price-19k-20201127.json transformed_data.json
fi
echo -e "${MAJOR}Indexing the sample product data, please wait...\n${RESET}"
curl -s -X POST "http://localhost:9200/ecommerce/_bulk?pretty=false&filter_path=-items" -H 'Content-Type: application/json' --data-binary @transformed_data.json


if $offline_lab; then
  echo -e "${MAJOR}Setting up Quepid${RESET}"
  docker compose run --rm quepid bundle exec bin/rake db:setup
  docker compose run quepid bundle exec thor user:create -a admin@choruselectronics.com "Chorus Admin" password
fi

echo -e "${MAJOR}Welcome to Chorus OpenSearch Edition!${RESET}"
