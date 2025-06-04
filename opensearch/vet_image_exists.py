import sys
import json
import zstandard as zstd
import requests
from tqdm import tqdm

# Input and output file settings
n = len(sys.argv)
fIn = 'esci.json.zst' if n <= 1 else sys.argv[1]
outfile = 'image_exists_esci.json'

previously_processed_products = []
# Open the file and load the JSON data
with open(outfile, 'r') as file:
  for line in file:
      # Parse each line as a JSON object and append to the list
      previously_processed_products.append(json.loads(line).get("_id"))


def process_stream(input_file):
    dctx = zstd.ZstdDecompressor()
    with open(input_file, 'rb') as compressed_file:
        with dctx.stream_reader(compressed_file) as reader:
            buffer = b""
            while True:
                chunk = reader.read(65536)  # Read in 64KB chunks
                if not chunk:
                    break
                buffer += chunk
                while b"\n" in buffer:  # Process lines in the buffer
                    line, buffer = buffer.split(b"\n", 1)
                    yield line.decode('utf-8', errors='ignore')
            if buffer:  # Handle remaining content
                yield buffer.decode('utf-8', errors='ignore')

def check_image_exists(image_url):
    try:
        # Use HEAD request for efficiency - we don't need the actual image data
        response = requests.head(image_url, timeout=5)
        return response.status_code == 200
    except:
        return False

# Open the output file once at the beginning
with open(outfile, 'a', encoding='utf8') as fOut:
    # Process each line in the input file
    for line in tqdm(process_stream(fIn)):
        if line.strip():  # Skip empty lines
            try:
                json_obj = json.loads(line)

                # Filter products by criteria
                if (
                    json_obj.get('locale') == "us" and
                    json_obj.get('image') and
                    json_obj.get('price') and
                    json_obj.get('asin') not in previously_processed_products
                ):
                    # Check if image exists by making a request to the URL
                    image_exists = check_image_exists(json_obj['image'])

                    # Create JSON for OpenSearch
                    json_image_exists = {"_id": json_obj['asin'], "image_exists": image_exists}
                    
                    # Write directly to the output file
                    fOut.write(json.dumps(json_image_exists) + '\n')

            except json.JSONDecodeError:
                # Skip lines that cannot be parsed
                continue

print(f"Processing complete. Results written to {outfile}")
