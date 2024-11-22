FROM node:18

RUN mkdir /usr/src/app
WORKDIR /usr/src/app

ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY ["package.json", "yarn.lock", "./"]

RUN yarn

CMD [ "yarn", "start"]
