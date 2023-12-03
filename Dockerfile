FROM node:18.18-slim as base

WORKDIR code

COPY package*.json .

FROM base AS dev
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

FROM base as prod
RUN npm ci
COPY . .