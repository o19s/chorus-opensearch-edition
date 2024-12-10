FROM opensearchproject/opensearch:2.18.0

# Install the OTel plugin.
RUN /usr/share/opensearch/bin/opensearch-plugin install --batch telemetry-otel

# Install the opensearch-ubi plugin.
RUN /usr/share/opensearch/bin/opensearch-plugin install --batch https://github.com/opensearch-project/user-behavior-insights/releases/download/2.18.0.2/opensearch-ubi-2.18.0.2.zip
ADD ./search-eval-plugin/search-quality-evaluation-plugin-2.18.0.0.zip  /tmp/search-quality-evaluation-plugin.zip
RUN /usr/share/opensearch/bin/opensearch-plugin install --batch file:/tmp/search-quality-evaluation-plugin.zip
