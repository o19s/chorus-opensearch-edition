FROM ghcr.io/astral-sh/uv:trixie

WORKDIR /python-docker

# Either checkout out https://github.com/o19s/strands-opensearch-agent into ./art
COPY ./strands-opensearch-agent .
# or:
#RUN git clone https://github.com/username/repo.git .


CMD [ "uv", "run", "ag_ui_server.py"]
