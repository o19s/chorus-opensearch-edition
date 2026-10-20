FROM node:20

RUN mkdir /usr/src/app
WORKDIR /usr/src/app

ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY ["package.json", "yarn.lock", "./"]

RUN yarn install

CMD [ "yarn", "start"]

