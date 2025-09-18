FROM node:slim AS development

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

RUN npm install -g @nestjs/cli
COPY package.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

RUN npm install
RUN npm run build

FROM node:slim AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /app

COPY package.json ./

RUN npm install --omit=dev
COPY --from=development /app/dist ./dist

CMD [ "node", "dist/main" ]