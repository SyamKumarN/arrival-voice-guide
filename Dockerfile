# One small Node server that serves the app on port 8080.
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production PORT=8080

# The only package is optional (used just for the "ask anything" upgrade).
# If it can't be installed, the app still builds and runs.
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund || true

COPY server.js ./
COPY lib ./lib
COPY public ./public

USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1
CMD ["node", "server.js"]
