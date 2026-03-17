#!/bin/bash

DOT='\033[0;37m.\033[0m'
start_time=$(date +%s)
timeout=120   # OpenSearch Dashboards can take longer to start, especially during bootstrap

# Wait for OpenSearch Dashboards to start...
while [[ "$(curl -s -u admin:MyStr0ng!P@ssw0rd2024 -o /dev/null -w ''%{http_code}'' http://localhost:5601/api/status)" != "200" ]]; do 
    printf ${DOT}
    sleep 5
done

# Wait for OpenSearch Dashboards to be fully available (status: green or available)
while true; do
    status=$(curl -s -u admin:MyStr0ng!P@ssw0rd2024 http://localhost:5601/api/status | jq -r '.status.overall.state // empty' 2>/dev/null)
    
    # Accept "green" or "available" as ready states
    if [[ "$status" == "green" ]] || [[ "$status" == "available" ]]; then
        echo ""
        echo "OpenSearch Dashboards is ready!"
        break
    fi
    
    printf "${DOT}"
    sleep 5

    current_time=$(date +%s)
    elapsed_time=$((current_time - start_time))

    if [[ $elapsed_time -ge $timeout ]]; then
        echo ""
        echo "Timeout waiting for OpenSearch Dashboards to be ready. Current status: $status. Proceeding on."
        break
    fi
done

echo ""