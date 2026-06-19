FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production=false

COPY . .

RUN npm run build && \
    chmod +x entrypoint.sh && \
    ls -la dist/ 2>/dev/null || echo "dist built"

EXPOSE 19482

ENTRYPOINT ["/app/entrypoint.sh"]
