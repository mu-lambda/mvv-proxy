FROM node:23.5.0
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV
ENV TZ="Europe/Berlin"

COPY ./out /out
COPY ./data/stops.csv /data/stops.csv
COPY ./data/index.css /data/index.css
COPY ./www/*.html /www/
COPY ./www/*.css /www/
COPY ./www/*.svg /www/
COPY ./package.json /package.json
COPY ./package-lock.json /package-lock.json
COPY ./fonts /fonts
RUN NODE_ENV=$NODE_ENV npm install
CMD ["node", "out/main.js"]
