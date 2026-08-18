#FROM  opensearchproject/opensearch:3.5.0
FROM opensearchproject/opensearch:3.8.0

# Install the OTel plugin.
# RUN /usr/share/opensearch/bin/opensearch-plugin install --batch https://artifacts.opensearch.org/releases/plugins/telemetry-otel/3.1.0/telemetry-otel-3.1.0.zip

# Install the UBI hits search pipeline plugin. quickstart.sh builds this zip via
# ubi-hits-search-pipeline-plugin/gradlew and stages it here before this image builds.
COPY ubi-hits-search-pipeline.zip /tmp/ubi-hits-search-pipeline.zip
RUN /usr/share/opensearch/bin/opensearch-plugin install --batch file:///tmp/ubi-hits-search-pipeline.zip
# Same for inner-hits-search-pipeline.zip
COPY inner-hits-search-pipeline.zip /tmp/inner-hits-search-pipeline.zip
RUN /usr/share/opensearch/bin/opensearch-plugin install --batch file:///tmp/inner-hits-search-pipeline.zip
