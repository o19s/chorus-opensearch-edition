#FROM  opensearchproject/opensearch-dashboards:3.2.0
FROM opensearchstaging/opensearch-dashboards:3.3.0

# Disable security.
RUN /usr/share/opensearch-dashboards/bin/opensearch-dashboards-plugin remove securityDashboards
COPY --chown=opensearch-dashboards:opensearch-dashboards opensearch_dashboards.yml /usr/share/opensearch-dashboards/config/

# Remove existing dashboards-search-relevance plugin if it exists
RUN /usr/share/opensearch-dashboards/bin/opensearch-dashboards-plugin remove searchRelevanceDashboards #|| true

# Add and install Search Relevance Dashboards plugin
COPY searchRelevanceDashboards-3.3.0.zip /tmp/
RUN /usr/share/opensearch-dashboards/bin/opensearch-dashboards-plugin install file:///tmp/searchRelevanceDashboards-3.3.0.zip
RUN ls
