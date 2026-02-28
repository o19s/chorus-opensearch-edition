FROM ghcr.io/astral-sh/uv:trixie

WORKDIR /python-docker

# Either clone https://github.com/mingshl/opensearch-agent-server into ./opensearch-agent-server and copy:
COPY ./opensearch-agent-server .

# or:
#RUN git clone https://github.com/mingshl/opensearch-agent-server .

# We are mounting via volumes so we can edit.
CMD [ "uv", "run", "run_server.py"]
