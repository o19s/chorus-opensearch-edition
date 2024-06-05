# Kata 003:  Import pre-existing event data

At Chorus Electonics we've been collecting data for a while, storing in a S3 bucket.  We want to locally populate our set up with data that is pre-existing.

Note: although this data should index to the indices straight from the zipped file format, it's best to make sure the UBI store for the indices exist.  Verify the existence of `ubi_queries` and `ubi_events`

#### TODO: client_idlink to other documentation to init the store


## Data file format
[File format](data/log_events.zip) is a zipped text file with two tab-delimited columns, the index to write to and the json event to store in that index:

```
ubi_events \t {"action_name": "login", "client_id": "124_0349b478-4a53-456c-aaf7-c08c82004b66", "session_id"...
ubi_queries \t {"client_id": "204_a11451b6-c947-4c51-85ec-9bfcaba7967f", "query": ...
```
#### TODO: update links 
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
Then run `python3 scripts/index_sample_data.py`.
or  `python scripts/index_sample_data.py`.

You should see output similar to the following:
```
python .\scripts\index_sample_data.py
green  open .opensearch-observability hjFUJZwnSS29XI3Bt7g7bg 1 0     0 0   208b   208b
green  open .plugins-ml-config        RTlG08MrRWiX_V39h51cmA 1 0     1 0  3.9kb  3.9kb
green  open ubi_queries               MFBfP5DoTt-Horv13IYztA 1 0     1 0  9.1kb  9.1kb
green  open ecommerce                 NF5sxZJISn2TsIKW9jAkdQ 1 0 19406 0 24.7mb 24.7mb
green  open ubi_events                Q12DH3iURS-BlIzAXYfTUQ 1 0     0 0   208b   208b
green  open .kibana_1                 2qm5E-mYSLeXqz1vQkBafA 1 0     0 0   208b   208b
yellow open ubi_chorus_events         1gya1EjsRVCtDCQ1O1_gHQ 1 1     0 0   208b   208b

Indexing rows in ./data/log_events.zip/log_events_new.json
* Uploaded 4130 rows to ubi_queries
* Uploaded 35404 rows to ubi_events
Done! Indexed 39534 total documents.
```

Congrats!
Jacob (and you!) now have some sample data for the next few Katas. 
To visualize this data, move to the next kata [004 Build a basic Dashboard](./004_build_a_basic_dashboard.md)
