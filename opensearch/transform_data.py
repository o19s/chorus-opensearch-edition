import sys
import json
import random


n = len(sys.argv)
fIn = 'icecat-products-w_price-19k-20201127.json' if n <= 1 else sys.argv[1]
fOut = 'transformed_data.json' if n <= 2 else sys.argv[2]


fIn = open(fIn, encoding='utf8', errors='ignore')
data = json.load(fIn)

with open(fOut, 'w', encoding='utf8') as fOut:
	for row in data:
		price = row.get('price', 1)
		margin = 0 if price < 2 else random.randint(0, price - 1)

		row['primary_ean'] = row['ean'][0]
		row['margin'] = margin
		fOut.write('{ "index" : {"_id" : "' + row['id'] + '"}}\n')
		fOut.write(json.dumps(row) + '\n')