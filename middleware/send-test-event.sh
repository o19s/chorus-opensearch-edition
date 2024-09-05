#!/bin/bash -e

curl -X POST http://localhost:9090/ubi_events -H "Content-Type: application/json" -d'
[
    {
        "action_name": "product_hover",
        "client_id": "USER-eeed-43de-959d-90e6040e84f9",
        "query_id": null,
        "page_id": "/",
        "message_type": "INFO",
        "message": "Integral 2GB SD Card memory card (undefined)",
        "timestamp": 1724944081669,
        "event_attributes": {
            "object": {
                "object_id_field": "product",
                "object_id": "1625640",
                "description": "Integral 2GB SD Card memory card",
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
