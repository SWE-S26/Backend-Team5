FROM node:20-slim AS builder

WORKDIR /beatza

COPY package*.json ./
RUN npm ci --ignore-scripts                  # installs ALL deps, including typescript/tsc

COPY tsconfig.json ./
COPY src ./src

RUN npm run build           # tsc is available here

# ---- Production Stage ----
FROM node:20-slim AS production

WORKDIR /beatza

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts   # only prod deps

COPY --from=builder /beatza/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]