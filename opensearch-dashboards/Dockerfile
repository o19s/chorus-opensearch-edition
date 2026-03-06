FROM  opensearchproject/opensearch-dashboards:3.5.0
#FROM opensearchstaging/opensearch-dashboards:3.5.0

# Disable security.
RUN /usr/share/opensearch-dashboards/bin/opensearch-dashboards-plugin remove securityDashboards

# Remove existing dashboards-search-relevance plugin if it exists
RUN /usr/share/opensearch-dashboards/bin/opensearch-dashboards-plugin remove searchRelevanceDashboards #|| true

# Add and install Search Relevance Dashboards plugin
COPY searchRelevanceDashboards-3.2.0.3.zip /tmp/
RUN /usr/share/opensearch-dashboards/bin/opensearch-dashboards-plugin install file:///tmp/searchRelevanceDashboards-3.2.0.3.zip
RUN ls
COPY --chown=opensearch-dashboards:opensearch-dashboards opensearch_dashboards.yml /usr/share/opensearch-dashboards/config/
