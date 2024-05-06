curl -k -XPOST -H "Content-Type: application/json" http://localhost:2021/log/ingest -d '
[
  {
  "action_name": "on_search",
  "user_id": "USER-eeed-43de-959d-90e6040e84f9",
  "query_id": "a84818c4-c5da-4031-8612-ce869b98d061",
  "session_id": "SESSION-eb4a46bb-8838-4b01-9699-8cdefbf52c88",
  "page_id": "/",
  "message_type": "QUERY",
  "message": "lapt",
  "timestamp": 1714911643189,
  "event_attributes": {
      "object": {
        "object_type": "click_location",
        "object_id": "OBJECT-77a6505e-8f3d-4110-aa9d-27f5a5726c7f",
        "key_value": "OBJECT-77a6505e-8f3d-4110-aa9d-27f5a5726c7f",
        "description": "(20, 18)",
        "object_detail": {
          "isTrusted": true
        }
      },
      "position": {
        "x": 480,
        "y": 578
      }
    }
  }
]'
