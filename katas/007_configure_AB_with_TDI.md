# Kata 006: Configuring an AB test with Team Draft Interleaving


## Prerequisites
_WARNING_  This Kata requires Opensearch 3.1 with the UBI and SRW plugins enabled.

### Optional Jupyter notebook setup
As with kata 005_1, you can optionally use a jupyter notebook to interact with the data.
To get started, you need to have a recent Python version.

1. Open a terminal and change to the katas directory: `cd ./katas`

1. We're going to use a "Virtual Environment" to organize everything: `python3 -m venv .venv`

1. Now start up the env: `source .venv/bin/activate`

1. Lastly, install all the required libraries: `pip install -r requirements.txt`

Or:

```
cd ./katas
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
jupyter notebook 007_Interleave.ipynb
```
Note, Chorus must still be set up.

### Quick Start
Use `quickstart.sh` to run the Chorus setup. It will perform the following tasks:
* Create and start the docker containers for
  * OpenSearch 3.1
  * OpenSearch 3.1 dashboards
  * Chorus middleware
  * Chorus reactive search

* Download and transform the ESCI product data set
* Update the ML plugin and install a model group for neural search
* Create the ingestion pipeline to use that model
* Index the product data
* Create the neural and hybrid search pipelines
* Update the index with embeddings
* Install the UBI dashboard
* Create and start the dataprepper docker container

### UBI

To create sampled UBI queries and synthetic UBI events, clone the repo:
[User Behavior Insights](https://github.com/opensearch-project/user-behavior-insights/)
and use the 
[UBI Data Geneator](https://github.com/opensearch-project/user-behavior-insights/tree/main/ubi-data-generator).
This will download a copy of the ESCI data set, with judgments, and create a set of queries and associated UBI events.

### SRW

The Search Relevance Workbench must be enabled in OpenSearch 3.1. See [Search Relevance Tools](https://github.com/opensearch-project/dashboards-search-relevance) 
for the Dashboard setting.
![SRW Setting](images/007_SRW_setting.png)

Additionally, the plugin must be enabled, either in the Dev console or via curl:

```
PUT _cluster/settings
{
  "persistent" : {
    "plugins.search_relevance.workbench_enabled" : true
  }
}`
```
Or
```
curl -X PUT "http://localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
 {
   "persistent" : {
    "plugins.search_relevance.workbench_enabled" : true
  }
}'
```
You can initialize example data, including search configurations, using 
[demo.sh](https://github.com/opensearch-project/search-relevance/blob/main/src/test/scripts/demo.sh)
from the search-relevance repository. For this kata, only two search configurations are required. They can be installed via curl.

#### Search Configurations
```
curl -s -X PUT "http://localhost:9200/_plugins/_search_relevance/search_configurations" \
-H "Content-type: application/json" \
-d'{
"name": "baseline",
"query": "{\"query\":{\"multi_match\":{\"query\":\"%SearchText%\",\"fields\":[\"id\",\"title\",\"category\",\"bullets\",\"description\",\"attrs.Brand\",\"attrs.Color\"]}}}",
"index": "ecommerce"
}'
```

```
curl -s -X PUT "http://localhost:9200/_plugins/_search_relevance/search_configurations" \
-H "Content-type: application/json" \
-d'{
"name": "baseline with title weight",
"query": "{\"query\":{\"multi_match\":{\"query\":\"%SearchText%\",\"fields\":[\"id\",\"title^25\",\"category\",\"bullets\",\"description\",\"attrs.Brand\",\"attrs.Color\"]}}}",
"index": "ecommerce"
}'
```

## Configuring an AB test

Now that [Chorus](http://localhost:3000/) is up and running, load up the home page.
On the left hand side, select AB from the Pick your Algo drop down menu:

![Pick AB](images/007_choose_ab.png)

Two text entry boxes will appear. In the first, enter `baseline` and in the second enter
`baseline with title weight`

![Enter Configs](images/007_enter_configs.png)

Congratulations! You now have Chorus - The OpenSearch Edition configured to run an AB test configuration!
