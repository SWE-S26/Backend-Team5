FROM node:20-slim AS builder

WORKDIR /beatza

COPY package*.json ./

RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --ignore-scripts                


COPY tsconfig.json ./
COPY src ./src

# tsc is available here
RUN npm run build           


# ---- Production Stage ----
FROM node:20-slim AS production

WORKDIR /beatza

COPY package*.json ./

# only prod deps
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --omit=dev --ignore-scripts                  

COPY --from=builder /beatza/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]