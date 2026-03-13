FROM ghcr.io/astral-sh/uv:trixie

WORKDIR /python-docker

# Either clone https://github.com/opensearch-project/opensearch-agent-server 
# into ./opensearch-agent-server and set up the volume mountings in docker-compose.yml
# or:
RUN git clone --depth 1  --single-branch https://github.com/opensearch-project/opensearch-agent-server .


# We are mounting via volumes so we can edit.
CMD [ "uv", "run", "run_server.py"]
