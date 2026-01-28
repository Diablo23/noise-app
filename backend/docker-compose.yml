FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

RUN npx prisma generate

COPY . .

RUN npm run build

RUN mkdir -p /app/uploads

EXPOSE 3001

CMD ["npm", "start"]
