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
jupyter notebook Interleave.ipynb
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

The Search Relevance Workbench must be enabled in OpenSearch 3.1. 
#### Search Configurations


Congratulations! You now have Chorus - The OpenSearch Edition configured to run an AB test configuration!
