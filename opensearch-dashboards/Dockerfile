FROM node:20.19.0

# You need to clone https://github.com/opensearch-project/OpenSearch-Dashboards into ./opensearch-dashboards
# Then you need to go to ./opensearch-dashboards/OpenSearch-Dashboards/plugins and then clone https://github.com/opensearch-project/security-dashboards-plugin
# Then you need to go to ./opensearch-dashboards/OpenSearch-Dashboards/plugins and then clone https://github.com/opensearch-project/dashboards-search-relevance
# To make things work!

RUN apt-get update && \
    apt-get -y install npm
    
RUN groupadd -r opensearch-dashboards && useradd -r -g opensearch-dashboards opensearch-dashboards && mkdir /home/opensearch-dashboards && chown opensearch-dashboards:opensearch-dashboards /home/opensearch-dashboards

USER root

# Create an entrypoint script in /usr/local/bin (outside the mounted volume)
RUN cat > /usr/local/bin/docker-entrypoint.sh <<'EOF'
#!/bin/bash
set -e

cd /home/opensearch-dashboards

# Check if node_modules exists, if not run bootstrap
if [ ! -d "node_modules" ] || [ ! -f ".bootstrapped" ]; then
    echo "Running yarn osd bootstrap..."
    yarn osd bootstrap --allow-root
    touch .bootstrapped
fi

# Start OpenSearch Dashboards in dev mode
exec yarn start --no-base-path
EOF

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER opensearch-dashboards

WORKDIR /home/opensearch-dashboards

CMD ["/usr/local/bin/docker-entrypoint.sh"]
