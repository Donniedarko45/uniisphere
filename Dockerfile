FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

RUN apk add --no-cache python3 make g++ 

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .


RUN npx prisma generate

RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app

RUN apk add --no-cache python3 make g++

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN npx prisma generate

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/app.js"] 
