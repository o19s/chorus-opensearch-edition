FROM ghcr.io/astral-sh/uv:trixie

WORKDIR /python-docker

# Either clone https://github.com/o19s/agentic-relevance-tuning into ./art and copy:
#COPY ./agentic-relevance-tuning .

# or:
#RUN git clone https://github.com/o19s/agentic-relevance-tuning .

# We are mounting via volumes so we can edit.
CMD [ "uv", "run", "ag_ui_server.py"]
