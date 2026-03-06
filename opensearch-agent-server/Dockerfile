FROM ghcr.io/astral-sh/uv:trixie

WORKDIR /python-docker

# Either clone https://github.com/mingshl/opensearch-agent-server into ./opensearch-agent-server and copy:
# Currently needs the https://github.com/mingshl/opensearch-agent-server/pull/27/
#  to be checked out to get access to HTTPS OpenSearch.
# 
# Application code will be mounted at runtime
#COPY ./opensearch-agent-server .

# or:
#RUN git clone https://github.com/mingshl/opensearch-agent-server .

# We are mounting via volumes so we can edit.
CMD [ "uv", "run", "run_server.py"]
