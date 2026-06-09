# Check docker-compose.yml to see if we are using this
#FROM opensearchproject/opensearch-dashboards:3.6.0
FROM opensearchstaging/opensearch-dashboards:3.7.0

COPY --chown=opensearch-dashboards:opensearch-dashboards opensearch_dashboards.yml /usr/share/opensearch-dashboards/config/
COPY --chown=opensearch-dashboards:opensearch-dashboards chorus-logo.png /usr/share/opensearch-dashboards/src/core/server/core_app/assets/chorus-logo.png
COPY --chown=opensearch-dashboards:opensearch-dashboards chorus-favicon.ico /usr/share/opensearch-dashboards/src/core/server/core_app/assets/chorus-favicon.ico
