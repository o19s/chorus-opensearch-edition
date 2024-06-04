# Kata 003:  Import pre-existing event data

At Chorus Electonics we've been collecting data for a while, storing in a S3 bucket.  We want to locally populate our set up with data that is pre-existing.

Note: although this data should index to the indices straight from the zipped file format, it's best to make sure the UBI store(s) for the indices exist with the following:

`curl -X PUT http://localhost:9200/_plugins/ubi/`{<mark>ubi-store-name}</mark>`?index=`{<mark>search-index</mark>}`&object_id_field=`{<mark>unique-key-field</mark>}

Where:
- *ubi-store-name* is the name of the UBI store.  So, for the ubi store name, `ubi-awesome`, the subsequent indices should be named `.ubi-awesome_events` and `.ubi-awesome_queries`.  **This allows UBI to integrate the data you're loading with the UBI store.** 
- *search-index* is the index the user will search against (i.e. products, books, blogs, etc.). **This is what activates a listener on that index to log all user queries on the search-index into the `.ubi-awesome_queries` index**
- *unique-key-field* is a unique field in the search-index that can link back to the exact row. **This is what allows a query at some point in time link to a *hit* that the user acted on (i.e. purchase, like, etc.)**  It does not necessarily need to be an id, it could be an isbn, brand name, etc. that humans tend to associate this item with. This is needed because the default `id` or `_id` field in OpenSearch can change and are not guaranteed to point to the same exact book, product, object that was returned to the user.

So here is a full example:
`curl -X PUT "http://localhost:9200/_plugins/ubi/chorus?index=ecommerce&object_id_field=primary_ean"`

## Data file format
[File format](data/log_events.zip) is a zipped text file with two tab-delimited columns, the index to write to and the json event to store in that index:

```
.ubi-store-name_events \t {"action_name": "login", "client_id": "124_0349b478-4a53-456c-aaf7-c08c82004b66", "session_id"...
.ubi-store-name_queries \t {"client_id": "204_a11451b6-c947-4c51-85ec-9bfcaba7967f", "query": ...
```

The event format should conform to the UBI schema mappings: 
- https://github.com/o19s/opensearch-ubi/tree/main/src/main/resources
- https://github.com/o19s/opensearch-ubi/blob/main/documentation/documentation.md

## Python script
The index script wrequires the Python OpenSearch client [opensearchpy](https://pypi.org/project/opensearch-py/).
Switch into the `./katas` directory for the next steps.   You may need to install the OpenSearch Python client via `pip install opensearch-py`.

Change any OpenSearch configuration in the python file [scripts/index_sample_data.py](scripts/index_sample_data.py):

```python
zip_name = './data/log_events.zip'
host = 'localhost'
port = 9200

# Create the client with SSL/TLS and hostname verification disabled.
client = OpenSearch(
	hosts = [{'host': host, 'port': port}],
	http_auth=('admin', 'admin'),
	http_compress = True, 
	use_ssl = False,
	verify_certs = False,
	ssl_assert_hostname = False,
	ssl_show_warn = False
)
```
Then run `python scripts/index_sample_data.py`.

You should see output similar to the following:
```
python .\scripts\index_sample_data.py
green open .opensearch-observability _Zc-LWVLSCyki7AC2PlFaA 1 0     0 0   208b   208b
green open .plugins-ml-config        cZ_3czqtRXGLbRsghpjuWA 1 0     1 0  3.9kb  3.9kb
green open .ql-datasources           Ekb9nCOwS9yqIXR_FWAgtg 1 0     0 0   208b   208b
green open ecommerce                 V50PSuTrSdetIeE9-f0vjw 1 0 19406 0   24mb   24mb
green open ubi_queries        16wRpOxWT7iF7RIKUg1StQ 1 0     0 0   208b   208b
green open .kibana_1                 7rhJyRdvTV6COAW6j58IcA 1 0     1 0  5.2kb  5.2kb
green open ubi_events         2wKFJacpRbaf-d_rYkDF1A 1 0     0 0   208b   208b

Indexing rows in ./data/log_events.zip/log_events.json
* Uploaded 37577 rows to ubi_events
* Uploaded 2797 rows to ubi_queries
Done! Indexed 40374 total documents.
```

Congrats!
Jacob (and you!) now have some sample data for the next few Katas. 
To visualize this data, move to the next kata [004 Build a basic Dashboard](./004_build_a_basic_dashboard.md)
