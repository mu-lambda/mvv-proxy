#! /bin/bash
set -e 
(cd shared && npm install && npm run build)
(cd client && npm install && npm run build)
(cd server && npm install && npm run build)
