FROM python:3.12.6

WORKDIR /python-docker

COPY requirements.txt requirements.txt
RUN pip install --upgrade pip && pip3 install -r requirements.txt

# We are mounting the local filesystem into Docker via the Docker Compose volumes for developer joy.
COPY . .

CMD [ "python3", "app.py"]
