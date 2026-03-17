FROM node:20.19.0

# You need to clone https://github.com/opensearch-project/OpenSearch-Dashboards into ./opensearch-dashboards
# Then you need to go to ./opensearch-dashboards/OpenSearch-Dashboards/plugins and then clone https://github.com/opensearch-project/security-dashboards-plugin
# Then you need to go to ./opensearch-dashboards/OpenSearch-Dashboards/plugins and then clone https://github.com/opensearch-project/dashboards-search-relevance
# To make things work!
# 
# A file called .bootstrapped is written out AFTER this is run
# so that we skip this step on future deploys.  
# rm opensearch-dashboards/OpenSearch-Dashboards/.bootstrapped to force a fresh bootstrap

RUN apt-get update && \
    apt-get -y install npm

# Create user with home directory
RUN groupadd -r opensearch-dashboards && \
    useradd -r -g opensearch-dashboards -m opensearch-dashboards

# Create an entrypoint script in /usr/local/bin (outside the mounted volume)
RUN cat > /usr/local/bin/docker-entrypoint.sh <<'EOF'
#!/bin/bash
set -e

cd /home/opensearch-dashboards

# Fix ownership of directories that need write access
# Suppress errors for files that can't be changed (like .git objects)
chown -R opensearch-dashboards:opensearch-dashboards /home/opensearch-dashboards/.cache 2>/dev/null || true
chown -R opensearch-dashboards:opensearch-dashboards /home/opensearch-dashboards/.yarn 2>/dev/null || true
chown -R opensearch-dashboards:opensearch-dashboards /home/opensearch-dashboards/.config 2>/dev/null || true
chown -R opensearch-dashboards:opensearch-dashboards /home/opensearch-dashboards/node_modules 2>/dev/null || true

# Check if node_modules exists, if not run bootstrap
if [ ! -d "node_modules" ] || [ ! -f ".bootstrapped" ]; then
    echo "Running yarn osd bootstrap..."
    su opensearch-dashboards -c "yarn osd bootstrap --single-version=loose"
    touch .bootstrapped
fi

# Start OpenSearch Dashboards in dev mode
exec su opensearch-dashboards -c "yarn start --no-base-path"
EOF

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /home/opensearch-dashboards

CMD ["/usr/local/bin/docker-entrypoint.sh"]
