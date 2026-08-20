FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run gateway:build
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/services/market-gateway/dist ./services/market-gateway/dist
CMD ["node","services/market-gateway/dist/services/market-gateway/src/index.js"]
