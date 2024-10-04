#!/bin/bash -e

curl -X PUT http://localhost:9090/ubi_events -H "Content-Type: application/json" -d'
[
  {
    "action_name": "product_hover",
    "client_id": "USER-eeed-43de-959d-90e6040e84f9",
    "query_id": "1234",
    "message_type": "INFO",
    "message": "Cyan Toner Cartridge for C7100/C7300/C7500 Series Type C4",
    "timestamp": 1724944081669,
    "event_attributes": {
        "object": {
            "object_id_field": "product",
            "object_id": "0012502615620",
            "description": "Cyan Toner Cartridge for C7100/C7300/C7500 Series Type C4",
            "object_detail": null
        },
        "position": null,
        "browser": null,
        "session_id": null,
        "page_id": null,
        "dwell_time": null
    }
  }
]'
