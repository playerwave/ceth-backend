FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

RUN npm run build

EXPOSE 5090

CMD ["node", "dist/server.js"]
