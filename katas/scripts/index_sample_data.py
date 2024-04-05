import json
from collections import Counter
import zipfile
from opensearchpy import OpenSearch
from opensearchpy.helpers import bulk



zip_name = './data/log_events.zip'
host = 'localhost'
port = 9200

# Create the client with SSL/TLS and hostname verification disabled.
client = OpenSearch(
	hosts = [{'host': host, 'port': port}],
	http_auth=('admin', 'admin'),
	http_compress = True, # enables gzip compression for request bodies
	use_ssl = False,
	verify_certs = False,
	ssl_assert_hostname = False,
	ssl_show_warn = False
)
#test connection
print(client.cat.indices())

idx_cntr = Counter()
rows = []
with zipfile.ZipFile(zip_name) as archive:
	for file_name in archive.namelist():
		with archive.open(file_name) as f:
			print(f'Indexing rows in {zip_name}/{file_name}')
			i = 0
			for line in f:
				i += 1
				index_name, log = line.decode('UTF-8').strip('\n').split('\t')
				if index_name not in idx_cntr and not client.indices.exists(index_name):
					# parse the store name out of the index name
					store = ''.join(index_name.split('_')[:-1]).lstrip('.')
					print(f'ERROR: Index {index_name} does not exist for store {store}.')
					print(f'You need to initialize the store first with: PUT .../plugins/ubi/{store}?index=...&key_field=...')
					exit();
				
				idx_cntr[index_name] +=1

				try:
					obj = json.loads(log)
				except:
					continue
				data = obj.get('data', None)
				if data:
					#wrap simple objects in a dict
					if not isinstance(data, dict): 
						obj['data'] = {'value': data}

				rows.append({
				'_index':index_name,
				'_id': i,
				'_source':obj
				})
				try:
					if (len(rows) %1234) == 0:
						bulk(client, rows)
						rows.clear()
				except Exception as e:
					print(f'Error on insert.  Line {{i}}:\n\t{e}\n\t{obj}')

			if len(rows) > 0:
				bulk(client, rows)
					
			#final flush
			for idx, cnt in idx_cntr.items():
				client.indices.refresh(idx)
				print(f'* Uploaded {cnt} rows to {idx}')
	print(f'Done! Indexed {i:n} total documents.')