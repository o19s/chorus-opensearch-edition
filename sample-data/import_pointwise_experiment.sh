# Example of importing an externally run evaluation into SRW
# 
# You must update the values below to match entities in SRW already: 
# 
# querySetId should be ESCI Queries
# searchConfigurationList should point to a "External Search Configuration", leave placeholders for required values
# judgmentList should be ESCI Judgements.  Do a find and replace as it shows up multiple levels.
# 
# curl -s -X POST "localhost:9200/_plugins/_search_relevance/experiments" \
# -H "Content-type: application/json" \
# -d @../data-esci/esci_us_external_experiment.json


curl -s -X POST "localhost:9200/_plugins/_search_relevance/experiments" \
-H "Content-type: application/json" \
-d'{
 	"querySetId": "9dfe82d7-b50a-4131-aa2b-8245e58e6cbf",
 	"searchConfigurationList": ["cc02de51-465a-4085-a922-5460d9541063"],
  "judgmentList": ["b7fbf853-b81b-4cba-9b11-9f4a50935ec7"],
 	"type": "POINTWISE_EVALUATION",
  "size": 10,
  "evaluationResultList": [
    {
      "searchText": "led tv",
      "judgmentIds": [
        "b7fbf853-b81b-4cba-9b11-9f4a50935ec7"
      ],
      "documentIds": [
        "B079VXT54Z",
        "B07MXBCQCF",
        "B07ZFBTFQF",
        "B0915F456C",
        "B07176GBXQ",
        "B07QGQGDRM",
        "B01LY0FCQO",
        "B079NCCK2M",
        "B083GRRW2Z",
        "B076KMND87"
      ],
      "metrics": [
             {
               "metric": "coverage",
               "value": 1.0
             },
             {
               "metric": "precision@10",
               "value": 0.3
             },
             {
               "metric": "ndcg",
               "value": 0.5
             },
             {
               "metric": "precision@5",
               "value": 0.9
             },
             {
               "metric": "MAP",
               "value": 0.8
             }
           ]
    },
    {
      "searchText": "tv",
      "judgmentIds": [
        "b7fbf853-b81b-4cba-9b11-9f4a50935ec7"
      ],
      "documentIds": [
        "B07GPN3MRY",
        "B07176GBXQ",
        "B07W7RP985",
        "B01FH7EQNW",
        "B08718Q168",
        "B086PWXVFW",
        "B06XKFWSJ4",
        "B01N1SSOUC",
        "B07P72ZB37",
        "B01AJJN0DA"
      ],
      "metrics": [
        {
          "metric": "coverage",
          "value": 0.2
        },
        {
          "metric": "precision@10",
          "value": 0.3
        },
        {
          "metric": "ndcg",
          "value": 0.4
        },
        {
          "metric": "precision@5",
          "value": 0.1
        },
        {
          "metric": "MAP",
          "value": 0.1
        }
      ]
    }      
  ]
}'
