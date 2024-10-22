FROM opensearchproject/opensearch:2.17.1

# Install the OTel plugin.
RUN /usr/share/opensearch/bin/opensearch-plugin install --batch telemetry-otel

# Install the opensearch-ubi plugin.
RUN /usr/share/opensearch/bin/opensearch-plugin install --batch https://github.com/opensearch-project/user-behavior-insights/releases/download/2.17.1.0/opensearch-ubi-2.17.1.0.zip
