FROM node:22

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build
RUN npm rebuild bcrypt
# Verify the build output exists
RUN ls -la dist/ && test -f dist/server.js

EXPOSE 5090

CMD ["node", "dist/server.js"]
