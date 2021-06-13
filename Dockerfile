FROM node:8.7-alpine

WORKDIR /home/app

ADD . /home/app

RUN npm install
# this can auto add the .env vars to the image
# RUN export $(grep -v '^#' .env | xargs)

CMD ["npm", "start"]

EXPOSE 3000
