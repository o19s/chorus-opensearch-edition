import logging
import random
import json
from opensearchpy import OpenSearch
import os

OPENSEARCH_HOST = os.getenv("OPENSEARCH_HOST", "opensearch")
OPENSEARCH_PORT = os.getenv("OPENSEARCH_PORT", 9200)
SEARCH_CONFIGS_INDEX = os.getenv("SEARCH_CONFIGS_INDEX", 'search-relevance-search-config')
UBI_EVENTS_INDEX = os.getenv("UBI_EVENTS_INDEX", 'ubi_events')
EMPTY_RESULT = {
    "took": 0,
    "timed_out": False,
    "_shards": {
        "total": 1,
        "successful": 1,
        "skipped": 0,
        "failed": 0
    },
    "hits": {
        "total": {
            "value": 0,
            "relation": "eq"
        },
        "max_score": None,
        "hits": []
    }
}

class Interleave:
    def __init__(self):
        self.client = OpenSearch(hosts=[{'host': OPENSEARCH_HOST, 'port': OPENSEARCH_PORT}],
                                 http_compress=True, use_ssl=False)
        self.label_a = 'TeamA'
        self.label_b = 'TeamB'

    def interleave(self, list_a, list_b, k) -> list:
        ids = []
        hits = []
        rank = 1
        idx_a = 0
        idx_b = 0
        len_a = len(list_a)
        len_b = len(list_b)

        while rank <= k:
            a_val = list_a[idx_a]['_id'] if idx_a < len_a else None
            b_val = list_b[idx_b]['_id'] if idx_b < len_b else None
            if not (a_val and b_val):
                return hits
            if not a_val:
                # take the rest of listB
                for hit in list_b[idx_b:k]:
                    if hit['_id'] not in ids:
                        ids.append(hit['_id'])
                        hit['search_config'] = self.label_b
                        hits.append(hit)
                return hits
            if not b_val:
                # take the rest of listA
                for hit in list_a[idx_a:k]:
                    if hit['_id'] not in ids:
                        ids.append(hit['_id'])
                        hit['search_config'] = self.label_a
                        hits.append(hit)
                return hits
            a_first = idx_a < idx_b or idx_a == idx_b and random.randint(0,1)
            if a_first:
                if a_val not in ids:
                    ids.append(a_val)
                    hit = list_a[idx_a]
                    hit['search_config'] = self.label_a
                    hits.append(hit)
                    rank += 1
                idx_a += 1
            else:
                if b_val not in ids:
                    ids.append(b_val)
                    hit = list_b[idx_b]
                    hit['search_config'] = self.label_b
                    hits.append(hit)
                    rank += 1
                idx_b += 1
        return hits

    def get_list(self, list_a, list_b, k) -> list:
        a = list_a['hits']['hits']
        b = list_b['hits']['hits']
        interleaving = self.interleave(a, b, k)
        return interleaving

    def get_search_config(self, name) -> dict:
        conf = self.client.search( body = {
            "query": {
                "match": {"name": name}
            },
            "size": 1
        }, index=SEARCH_CONFIGS_INDEX)
        return conf['hits']['hits'][0]['_source'] if len(conf['hits']['hits']) else None
    @staticmethod
    def populate_query(query, config, size=10, source=None, ext=None) -> dict:
        if source is None:
            source = ["title", "description", "asin"]
        if ext is None:
            ext = {}
        query = query.replace('"', '\\"')
        body = json.loads(config['query'].replace("%SearchText%", query))
        body['size'] = size
        body['_source'] = source
        body['ext'] = ext
        return body

    def run_ab(self, query, config_a, config_b, size=10, source=None, ext=None) -> dict:
        conf_a = self.get_search_config(config_a)
        self.label_a = config_a
        conf_b = self.get_search_config(config_b)
        self.label_b = config_b
        # if either config is bad, return an empty result
        if not (conf_a and conf_b):
            if not conf_a:
                logging.warning(f'{config_a} is not found.')
            if not conf_b:
                logging.warning(f'Search {config_b} if not found.')
            return EMPTY_RESULT
        q_a = self.populate_query(query, conf_a, size=size, source=source, ext=ext)
        q_b = self.populate_query(query, conf_b, size=size, source=source, ext=ext)
        res_a = self.client.search(body=q_a)
        res_b = self.client.search(body=q_b)
        result = self.get_list(res_a, res_b, size)
        res_a['hits']['hits'] = result
        return res_a

    def get_events(self, obj_id, query, event_type=None) -> dict:
        if event_type:
            evq = {
                "query": {
                    "bool": {
                        "must": [
                            {"match": {"event_attributes.object.object_id": obj_id}},
                            {"match": {"user_query": query}},
                            {"match": {"action_name": event_type}}
                        ]
                    }
                },
                "size": 1000
            }
        else:
            evq = {
                "query": {
                    "bool": {
                        "must": [
                            {"match": {"event_attributes.object.object_id": obj_id}},
                            {"match": {"user_query": query}}
                        ]
                    }
                },
                "size": 1000
            }
        results = self.client.search(body=evq, index=UBI_EVENTS_INDEX)
        return results

    def get_clicks(self, obj_id, query) -> dict:
        results = self.get_events(obj_id, query, 'click')
        return results

    def count_clicks(self, obj_id, query) -> int:
        results = self.get_clicks(obj_id, query)
        return results['hits']['total']['value']

if __name__ == '__main__':
    OPENSEARCH_HOST = "localhost"
    interleave = Interleave()
    queries = ['mouse']
    control = "baseline"
    treatment = "baseline with title weight"
    ext1 = {
        "ubi": {
            "query_id": "88a1b9da-0cb8-44b6-b1fa-3e22ce82e790",
            "user_query": "mouse",
            "client_id": "CLIENT-64e52cac-0565-486e-96ea-24b96baa2b0b",
            "object_id_field": "asin",
            "application": "Chorus",
            "query_attributes": {}
        }
    }
    source1 = {
        "includes": [
            "*"
        ],
        "excludes": []
    }
    for q in queries:
        res = interleave.run_ab(q, control, treatment, size=10, source=source1, ext=ext1)
        print(q)
        for item in res['hits']['hits']:
            print(f'{item["search_config"]} --> {item["_id"]}')
        print(res)