FROM node:lts-slim AS development

ENV NODE_ENV=development

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

RUN npx nest build

FROM node:lts-slim AS production

ENV NODE_ENV=production

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY --from=development /app/dist ./dist

# Run as non-root for security
RUN useradd -r -u 1001 nodeusr && chown -R nodeusr:nodeusr /app
USER nodeusr

CMD [ "node", "dist/main" ]