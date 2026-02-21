FROM node:18-alpine

WORKDIR /app

RUN npm install -g pnpm@10.6.1
RUN npm install -g pm2

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile 

COPY . .

RUN pnpm db:generate

RUN pnpm run build

RUN pnpm prune --prod

EXPOSE 3000

CMD ["pm2-runtime", "./dist/server.js"]
