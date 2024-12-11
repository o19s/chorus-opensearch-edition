import requests
from opensearchpy import OpenSearch

# Here is an example commandline:
# docker run --network=chorus-opensearch-edition_chorus_network -v "$(pwd)":/app -w /app python:3 bash -c "pip install -r requirements.txt && python3 ./opensearch/validate_product_image.py"

# Configuration
opensearch_host = 'http://opensearch:9200'  # Replace with your OpenSearch URL
index_name = 'ecommerce'                   # Replace with your index name
tracking_file = 'product_image_exists.txt'

# Initialize OpenSearch client
client = OpenSearch(
  hosts=[{'host': 'opensearch', 'port': 9200}],
  use_ssl = False,
)

info = client.info()
print(f"Welcome to {info['version']['distribution']} {info['version']['number']}!")


# Load existing tracked IDs
def load_tracked_ids():
    try:
        tracked_ids = {}
        with open(tracking_file, 'r') as f:
            for line in f:
                key, value = line.strip().split(",")
                value = value.lower() == 'true'
                tracked_ids[key] = value
                return tracked_ids
    except FileNotFoundError:
        return {}

# Save a new tracked ID
def save_tracked_id(doc_id, exists):
    with open(tracking_file, 'a') as f:
        f.write(f"{doc_id},{exists}\n")

# Check if image exists
def check_image_exists(image_url):
    response = requests.head(image_url)
    return response.status_code == 200

# Main function to process documents
def process_documents():
    tracked_ids = load_tracked_ids()
    query = {
        "query": {
            "match_all": {}
        }
    }

    # Scroll through the documents
    response = client.search(index=index_name, body=query, scroll='10m', size=1000)
    scroll_id = response['_scroll_id']
    total_docs = response['hits']['total']['value']

    while True:
        for hit in response['hits']['hits']:
            doc_id = hit['_id']
            image_url = hit['_source'].get('image')

            if image_url and doc_id not in tracked_ids:
                exists = check_image_exists(image_url)
                tracked_ids[doc_id] = exists
                # Save the ID to the tracking file
                save_tracked_id(doc_id, exists)

            if image_url:
                exists = tracked_ids[doc_id]
                # Update OpenSearch document
                client.update(
                    index=index_name,
                    id=doc_id,
                    body={
                        "doc": {
                            "image_exists": exists
                        }
                    }
                )

                

        # Fetch the next batch of documents
        response = client.scroll(scroll_id=scroll_id, scroll='10m')
        if not response['hits']['hits']:
            break

    print(f"Processed {total_docs} documents.")

if __name__ == "__main__":
    process_documents()
