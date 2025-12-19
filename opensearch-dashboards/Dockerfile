FROM  opensearchproject/opensearch-dashboards:3.4.0
  #FROM opensearchstaging/opensearch-dashboards:3.3.0

# Disable security.
RUN /usr/share/opensearch-dashboards/bin/opensearch-dashboards-plugin remove securityDashboards
COPY --chown=opensearch-dashboards:opensearch-dashboards opensearch_dashboards.yml /usr/share/opensearch-dashboards/config/
