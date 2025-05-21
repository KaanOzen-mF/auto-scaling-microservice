# 1. Build Stage
FROM node:18-alpine AS builder
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# 2. Production Stage
FROM node:18-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production --frozen-lockfile

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3001

CMD [ "node", "dist/index.js" ]