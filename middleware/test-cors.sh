#!/bin/bash -e

curl -I -X OPTIONS \
    -H "Origin: http://localhost:4000" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    http://127.0.0.1:9090/ubi_events
