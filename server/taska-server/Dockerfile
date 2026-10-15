FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++ 
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV PORT=4000
ENV DATABASE_PATH=/app/data/database.sqlite
EXPOSE 4000
VOLUME ["/app/data"]
CMD ["npm", "run", "start:prod"]
