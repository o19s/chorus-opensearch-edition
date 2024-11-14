import sys
import json

# Input and output file settings
n = len(sys.argv)
fIn = 'esci_100000.json' if n <= 1 else sys.argv[1]
outfile_prefix = 'transformed_esci_'

# Open the input file
with open(fIn, encoding='utf8', errors='ignore') as fIn:
    batch_size = 5000
    actions = ""
    n = 0
    i = 1
    index_name = "ecommerce"

    # Process each line in the input file
    for line in fIn:
        if line.strip():  # Avoid processing empty lines
            json_obj = json.loads(line)
            if json_obj['locale'] == "us":  # skip non-English products
                if "image" in json_obj and json_obj["image"] != "": # skip products without an image
                    if "price" in json_obj and json_obj["price"] != "": # skip products without a price
                        json_obj["price"] = json_obj["price"][1:].replace(",", "")
					    # Create the bulk action line for OpenSearch
                        action_meta = {"index": {"_index": index_name, "_id": json_obj['asin']}}
                        action_line = json.dumps(action_meta) + '\n' + json.dumps(json_obj) + '\n'
                        actions += action_line
                        n += 1

                	# Write to file when batch size is reached
                    if n >= batch_size:
                    	with open(f"{outfile_prefix}{i}.json", 'w', encoding='utf8') as fOut:
                           fOut.write(actions)
                           actions = ""
                           n = 0
                           i += 1

    # Write any remaining actions to a final file
if actions:
    with open(f"{outfile_prefix}final.json", 'w', encoding='utf8') as fOut:
      fOut.write(actions)
