To send an event to Data Prepper:

```
curl -k -XPOST -H "Content-Type: application/json" -d '[{"log": "sample log"}]' https://localhost:2021/log/ingest
```