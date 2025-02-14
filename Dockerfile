FROM node:23.5.0
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ENV TZ="Europe/Berlin"

COPY ./server/out /server/out
COPY ./server/data/stops.csv /server/data/stops.csv
COPY ./server/package.json /server/package.json
COPY ./server/package-lock.json /server/package-lock.json

COPY ./shared/out /shared/out
COPY ./shared/package.json /shared/package.json
COPY ./shared/package-lock.json /shared/package-lock.json

COPY ./www/*.html /www/
COPY ./www/out/*.js /www/out/
COPY ./www/*.css /www/
COPY ./www/*.svg /www/
COPY ./fonts /fonts
WORKDIR /server
RUN NODE_ENV=$NODE_ENV npm install
CMD ["node", "out/main.js"]
