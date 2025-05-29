FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm@10.6.1 && pnpm install

RUN pnpm install

COPY . .

RUN pnpm npm run build

RUN pnpm db:generate

RUN pnpm prune --prod

EXPOSE 3000

CMD ["npm", "run", "start"]

