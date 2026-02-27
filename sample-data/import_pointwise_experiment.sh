# Example of importing an externally run evaluation into SRW
# 
# You must update the values below to match entities in SRW already: 
# 
# querySetId should be the one that is named 'TVs'.
# searchConfigurationList should point to one you created, maybe called "External Search Configuration", 
#   use placeholders for any required values.
# judgmentList should be ESCI Judgements.  Do a find and replace as it shows up multiple levels.
# 
# curl -s -X POST "localhost:9200/_plugins/_search_relevance/experiments" \
# -H "Content-type: application/json" \
# -d @../data-esci/esci_us_external_experiment.json


curl -s -X POST "http://chorus-opensearch-edition.dev.o19s.com:9200/_plugins/_search_relevance/experiments" \
-H "Content-type: application/json" \
-d'{
 	"querySetId": "8a6e2531-20f1-485a-b5ea-3fe11aa97a2e",
 	"searchConfigurationList": ["11b19f9e-09e4-4548-b60d-ebed1e44fbac"],
  "judgmentList": ["d4f2fc28-9a8c-497e-925b-1d9e64fd0599"],
 	"type": "POINTWISE_EVALUATION",
  "size": 10,
  "evaluationResultList": [
    {
      "searchText": "led tv",
      "judgmentIds": [
        "d4f2fc28-9a8c-497e-925b-1d9e64fd0599"
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
        "d4f2fc28-9a8c-497e-925b-1d9e64fd0599"
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
