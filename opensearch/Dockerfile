FROM  opensearchproject/opensearch:3.2.0
#FROM opensearchstaging/opensearch:3.2.0



# Use our custom search-relevance plugin w/ import capablity.  (https://github.com/opensearch-project/search-relevance/pull/120)
# We appear to have to deal with a plugin-security.policy (needed for ml-commons maybe) that is preventing this step from working.
RUN /usr/share/opensearch/bin/opensearch-plugin remove opensearch-search-relevance

# Install unzip for plugin modification
USER root
RUN yum install -y unzip zip
USER opensearch

COPY opensearch-search-relevance-3.2.0.0-SNAPSHOT.zip /tmp/opensearch-search-relevance-3.2.0.0-SNAPSHOT.zip

# Create a working directory, extract the zip, remove the security policy file, repack, and install
RUN mkdir -p /tmp/plugin-extract && \
    cd /tmp/plugin-extract && \
    unzip /tmp/opensearch-search-relevance-3.2.0.0-SNAPSHOT.zip && \
    rm -f plugin-security.policy && \
    zip -r /tmp/opensearch-search-relevance-modified.zip * && \
    cd / && \
    /usr/share/opensearch/bin/opensearch-plugin install file:///tmp/opensearch-search-relevance-modified.zip


# Install the OTel plugin.
# RUN /usr/share/opensearch/bin/opensearch-plugin install --batch https://artifacts.opensearch.org/releases/plugins/telemetry-otel/3.1.0/telemetry-otel-3.1.0.zip
