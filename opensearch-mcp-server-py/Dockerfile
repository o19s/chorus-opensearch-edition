FROM ghcr.io/astral-sh/uv:trixie

WORKDIR /python-docker

# Either clone https://github.com/opensearch-project/opensearch-mcp-server-py into ./opensearch-mcp-server-py and copy:
#COPY ./opensearch-mcp-server-py .
# 
# Application code will be mounted at runtime

# or:
#RUN git clone https://github.com/opensearch-project/opensearch-mcp-server-py .

# We are mounting via volumes so we can edit.
CMD [ "uv", "run", "-m", "mcp_server_opensearch","--transport", "stream", "--port", "3001"]
